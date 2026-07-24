/**
 * POST /api/v1/recommendations/{id}/reject (§2.4, D4 §13). Optional feedback.
 */
import { authed } from "@/lib/api/authed";
import { ok } from "@/lib/api/envelope";
import { parseJson, requireUuidParam } from "@/lib/api/validation";
import { rejectRecommendation, rejectSchema } from "@/lib/services/recommendation-service";

export const dynamic = "force-dynamic";

export const POST = authed(async ({ ctx, req, params }) => {
  const id = requireUuidParam(params.id);
  // Body is optional; default to empty feedback.
  const input = await parseJson(req, rejectSchema).catch(() => ({}));
  return ok(await rejectRecommendation(ctx, id, input));
});
