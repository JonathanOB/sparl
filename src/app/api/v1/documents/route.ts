/**
 * GET  /api/v1/documents — list the caller's documents.
 * POST /api/v1/documents — multipart upload → { id, status: "processing" } (D4 §9, §2.4).
 */
import { authed } from "@/lib/api/authed";
import { ok } from "@/lib/api/envelope";
import { AppError, ErrorCode } from "@/lib/api/errors";
import { createDocument, listDocuments } from "@/lib/services/document-service";

export const dynamic = "force-dynamic";

export const GET = authed(async () => {
  return ok(await listDocuments());
});

export const POST = authed(async ({ ctx, req }) => {
  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    throw new AppError(ErrorCode.VALIDATION_FAILED, "No file provided.");
  }
  const documentType = formData.get("document_type");
  const doc = await createDocument(
    ctx,
    file,
    typeof documentType === "string" ? documentType : undefined
  );
  return ok({ id: doc.id, status: doc.processing_status }, { status: 201 });
});
