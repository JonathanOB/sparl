/**
 * Document processing job handler (§2.6, D8 §8.1). Downloads the uploaded file,
 * runs Claude extraction, applies business rules + PII redaction, persists
 * document_extractions, and updates the document status. Runs in the worker
 * process (see index.ts).
 */
import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { serverEnv } from "@/lib/env";
import {
  extractDocument,
  isPlausible,
  redactExtraction,
  type DocumentExtraction,
} from "@/lib/ai/document-extraction";
import type { DocumentProcessJob } from "@/lib/queue/boss";

type Admin = ReturnType<typeof createAdminClient>;

const BUCKET = "documents";

function log(level: string, msg: string, data?: Record<string, unknown>) {
  console.log(JSON.stringify({ ts: new Date().toISOString(), level, msg, ...data }));
}

async function markFailed(documentId: string) {
  const admin = createAdminClient();
  await admin.from("documents").update({ processing_status: "failed" }).eq("id", documentId);
}

export async function processDocument(job: DocumentProcessJob): Promise<void> {
  const { documentId, storagePath } = job;
  const admin = createAdminClient();

  const { data: file, error: dlError } = await admin.storage.from(BUCKET).download(storagePath);
  if (dlError || !file) {
    log("error", "document.download_failed", { documentId, err: dlError?.message });
    await markFailed(documentId);
    return;
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const mediaType = file.type || "application/pdf";

  let extraction;
  try {
    extraction = await extractDocument(bytes, mediaType);
  } catch (err) {
    log("error", "document.extraction_failed", { documentId, err: String(err) });
    await markFailed(documentId);
    return;
  }

  const { error: insertError } = await admin.from("document_extractions").insert({
    document_id: documentId,
    extracted_data: redactExtraction(extraction),
    confidence_score: extraction.confidence,
    ai_model: serverEnv().CLAUDE_MODEL_STRONG,
  });
  if (insertError) {
    log("error", "document.persist_failed", { documentId, err: insertError.message });
    await markFailed(documentId);
    return;
  }

  // Implausible extractions are flagged (status failed = needs review), not trusted (D5 §13).
  const plausible = isPlausible(extraction);
  if (plausible) {
    try {
      await upsertServiceFromExtraction(admin, job.householdId, extraction);
    } catch (err) {
      log("error", "document.service_mapping_failed", { documentId, err: String(err) });
    }
  }

  await admin
    .from("documents")
    .update({ processing_status: plausible ? "completed" : "failed" })
    .eq("id", documentId);

  log("info", "document.processed", { documentId, plausible, confidence: extraction.confidence });
  // TODO(next): enqueue a recommendation job for the affected household.
}

/**
 * Turn a plausible extraction into a household service: resolve the category +
 * provider, then update the household's existing service in that category (if any)
 * or create a new one. Runs with the admin client (worker context).
 */
async function upsertServiceFromExtraction(
  admin: Admin,
  householdId: string,
  extraction: DocumentExtraction
): Promise<void> {
  const categoryId = await resolveCategoryId(admin, extraction.category);
  const providerId = await resolveProviderId(admin, extraction.provider_name);

  const fields = {
    provider_id: providerId,
    category_id: categoryId,
    monthly_cost: extraction.monthly_cost,
    annual_cost: extraction.annual_cost,
    renewal_date: extraction.renewal_date,
    status: "active" as const,
  };

  // Dedupe by household + category so re-uploading a bill updates rather than duplicates.
  if (categoryId) {
    const { data: existing } = await admin
      .from("user_services")
      .select("id")
      .eq("household_id", householdId)
      .eq("category_id", categoryId)
      .is("deleted_at", null)
      .limit(1)
      .maybeSingle();
    if (existing) {
      await admin.from("user_services").update(fields).eq("id", existing.id);
      return;
    }
  }
  await admin.from("user_services").insert({ household_id: householdId, ...fields });
}

async function resolveCategoryId(admin: Admin, category: string | null): Promise<string | null> {
  if (!category) return null;
  const bySlug = await admin
    .from("provider_categories")
    .select("id")
    .ilike("slug", category)
    .limit(1)
    .maybeSingle();
  if (bySlug.data) return bySlug.data.id;
  const byName = await admin
    .from("provider_categories")
    .select("id")
    .ilike("name", category)
    .limit(1)
    .maybeSingle();
  return byName.data?.id ?? null;
}

async function resolveProviderId(admin: Admin, providerName: string | null): Promise<string | null> {
  if (!providerName) return null;
  const { data } = await admin
    .from("providers")
    .select("id")
    .ilike("name", `%${providerName}%`)
    .is("deleted_at", null)
    .limit(1)
    .maybeSingle();
  return data?.id ?? null;
}
