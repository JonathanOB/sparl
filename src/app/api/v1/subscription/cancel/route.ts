/**
 * POST /api/v1/subscription/cancel — cancel at period end (D4 §18).
 */
import { authed } from "@/lib/api/authed";
import { ok } from "@/lib/api/envelope";
import { cancelSubscription } from "@/lib/services/subscription-service";

export const dynamic = "force-dynamic";

export const POST = authed(async () => {
  return ok(await cancelSubscription());
});
