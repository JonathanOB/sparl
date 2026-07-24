/**
 * GET /api/v1/recommendations — the caller's recommendations (best savings first).
 */
import { authed } from "@/lib/api/authed";
import { ok } from "@/lib/api/envelope";
import { listRecommendations } from "@/lib/services/recommendation-service";

export const dynamic = "force-dynamic";

export const GET = authed(async () => {
  return ok(await listRecommendations());
});
