/**
 * GET /api/v1/subscription — the caller's current subscription (or null).
 */
import { authed } from "@/lib/api/authed";
import { ok } from "@/lib/api/envelope";
import { getSubscription } from "@/lib/services/subscription-service";

export const dynamic = "force-dynamic";

export const GET = authed(async () => {
  return ok(await getSubscription());
});
