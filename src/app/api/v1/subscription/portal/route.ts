/**
 * POST /api/v1/subscription/portal — Stripe customer portal session (D11 §5).
 */
import { authed } from "@/lib/api/authed";
import { ok } from "@/lib/api/envelope";
import { createPortalSession } from "@/lib/services/subscription-service";

export const dynamic = "force-dynamic";

export const POST = authed(async ({ ctx }) => {
  return ok(await createPortalSession(ctx));
});
