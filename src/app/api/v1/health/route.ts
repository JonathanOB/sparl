/**
 * GET /api/v1/health — liveness probe returning the standard success envelope.
 * Proves the envelope + versioned API surface (§2.4, D4 §6).
 */
import { ok } from "@/lib/api/envelope";

// Health must reflect live process state, never a cached/prerendered value.
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  return ok({
    status: "ok",
    service: "sparl-web",
    version: "v1",
    time: new Date().toISOString(),
  });
}
