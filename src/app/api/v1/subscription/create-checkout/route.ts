/**
 * POST /api/v1/subscription/create-checkout — Stripe Checkout session (D4 §18).
 */
import { authed } from "@/lib/api/authed";
import { ok } from "@/lib/api/envelope";
import { parseJson } from "@/lib/api/validation";
import { checkoutSchema, createCheckoutSession } from "@/lib/services/subscription-service";

export const dynamic = "force-dynamic";

export const POST = authed(async ({ ctx, req }) => {
  const { lookupKey } = await parseJson(req, checkoutSchema);
  return ok(await createCheckoutSession(ctx, lookupKey));
});
