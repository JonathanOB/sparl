/**
 * POST /api/v1/recommendations/generate — run the engine for the active household.
 */
import { authed } from "@/lib/api/authed";
import { ok } from "@/lib/api/envelope";
import { generateRecommendations } from "@/lib/services/recommendation-service";

export const dynamic = "force-dynamic";

export const POST = authed(async ({ ctx }) => {
  return ok(await generateRecommendations(ctx));
});
