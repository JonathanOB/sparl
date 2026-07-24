/**
 * Document service (D4 §9, D10 §11–12). Secure upload to a private Storage bucket
 * (path: {household_id}/{document_id}.{ext}), a `documents` row, and a pg-boss job
 * for extraction. Uploads use the admin client (trusted server write, ownership
 * derived from ctx). Reads use the RLS user client. Signed-URL access only.
 */
import "server-only";
import { createAdminClient, createUserClient } from "@/lib/supabase/server";
import { AppError, ErrorCode } from "@/lib/api/errors";
import { enqueueDocumentProcess } from "@/lib/queue/boss";
import type { UserContext } from "@/lib/auth/user-context";
import type { Enums, Tables } from "@/shared/types/database.types";

const BUCKET = "documents";
const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["application/pdf", "image/png", "image/jpeg", "image/webp"]);
const DOCUMENT_TYPES: Enums<"document_type">[] = [
  "bill",
  "contract",
  "insurance_policy",
  "renewal_letter",
  "invoice",
  "other",
];

const extFor = (file: File): string => {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]{1,5}$/.test(fromName)) return fromName;
  return file.type === "application/pdf" ? "pdf" : (file.type.split("/")[1] ?? "bin");
};

export async function createDocument(
  ctx: UserContext,
  file: File,
  documentType?: string
): Promise<Tables<"documents">> {
  const householdId = ctx.activeHouseholdId;
  if (!householdId) {
    throw new AppError(ErrorCode.VALIDATION_FAILED, "Create a household before uploading documents.");
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new AppError(ErrorCode.VALIDATION_FAILED, "Unsupported file type. Upload a PDF or image.");
  }
  if (file.size > MAX_BYTES) {
    throw new AppError(ErrorCode.VALIDATION_FAILED, "File is too large (max 10MB).");
  }

  const admin = createAdminClient();
  const documentId = crypto.randomUUID();
  const storagePath = `${householdId}/${documentId}.${extFor(file)}`;

  const bytes = new Uint8Array(await file.arrayBuffer());
  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(storagePath, bytes, { contentType: file.type, upsert: false });
  if (uploadError) throw new Error(`storage upload failed: ${uploadError.message}`);

  const docType: Enums<"document_type"> = DOCUMENT_TYPES.includes(
    documentType as Enums<"document_type">
  )
    ? (documentType as Enums<"document_type">)
    : "other";

  const { data, error } = await admin
    .from("documents")
    .insert({
      id: documentId,
      household_id: householdId,
      uploaded_by: ctx.userId,
      storage_path: storagePath,
      document_type: docType,
      processing_status: "processing",
    })
    .select()
    .single();
  if (error) {
    // best-effort cleanup of the orphaned object
    await admin.storage.from(BUCKET).remove([storagePath]);
    throw new Error(error.message);
  }

  // TODO(malware): ClamAV scan step before extraction (D10 §12).
  await enqueueDocumentProcess({ documentId, householdId, storagePath });

  return data;
}

export async function listDocuments(): Promise<Tables<"documents">[]> {
  const supabase = await createUserClient();
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}
