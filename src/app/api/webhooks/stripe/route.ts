/**
 * POST /api/webhooks/stripe — subscription lifecycle (§2.8, Phase 10).
 * Public route. Verifies the Stripe signature against the RAW body using
 * STRIPE_WEBHOOK_SECRET. Handlers are stubbed here; full subscription sync +
 * idempotency (dedupe on event.id) lands in Phase 10.
 */
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { serverEnv } from "@/lib/env";
import { createRequestLogger } from "@/lib/log/logger";

export const dynamic = "force-dynamic";

const HANDLED_EVENTS = new Set<Stripe.Event["type"]>([
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.paid",
  "invoice.payment_failed",
]);

export async function POST(req: Request): Promise<Response> {
  const logger = createRequestLogger(req);

  const signature = req.headers.get("stripe-signature");
  const secret = serverEnv().STRIPE_WEBHOOK_SECRET;
  if (!signature || !secret) {
    logger.warn("webhook.stripe.not_configured");
    return new Response("Webhook not configured", { status: 400 });
  }

  const rawBody = await req.text(); // raw body required for signature verification
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, secret);
  } catch {
    logger.warn("webhook.stripe.invalid_signature");
    return new Response("Invalid signature", { status: 400 });
  }

  // TODO(Phase 10): idempotency — skip if event.id already processed, then sync
  // public.subscriptions from the event.
  if (HANDLED_EVENTS.has(event.type)) {
    logger.info("webhook.stripe", { type: event.type, id: event.id });
  } else {
    logger.debug("webhook.stripe.unhandled", { type: event.type, id: event.id });
  }

  return Response.json({ received: true }, { status: 200 });
}
