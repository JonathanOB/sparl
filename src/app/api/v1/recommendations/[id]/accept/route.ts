/**
 * POST /api/v1/recommendations/{id}/accept (§2.4, D4 §13).
 */
import { authed } from "@/lib/api/authed";
import { ok } from "@/lib/api/envelope";
import { requireUuidParam } from "@/lib/api/validation";
import { acceptRecommendation } from "@/lib/services/recommendation-service";

export const dynamic = "force-dynamic";

export const POST = authed(async ({ params }) => {
  const id = requireUuidParam(params.id);
  return ok(await acceptRecommendation(id));
});
