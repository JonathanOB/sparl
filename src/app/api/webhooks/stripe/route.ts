/**
 * POST /api/webhooks/stripe — subscription lifecycle (§2.8, D11 §7).
 * Public route. Verifies the Stripe signature against the RAW body, then syncs
 * public.subscriptions. Handlers are idempotent (upsert), so replays are safe.
 */
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { serverEnv } from "@/lib/env";
import { createRequestLogger } from "@/lib/log/logger";
import { syncSubscription } from "@/lib/services/subscription-sync";

export const dynamic = "force-dynamic";

export async function POST(req: Request): Promise<Response> {
  const logger = createRequestLogger(req);

  const signature = req.headers.get("stripe-signature");
  const secret = serverEnv().STRIPE_WEBHOOK_SECRET;
  if (!signature || !secret) {
    logger.warn("webhook.stripe.not_configured");
    return new Response("Webhook not configured", { status: 400 });
  }

  const rawBody = await req.text(); // raw body required for signature verification
  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch {
    logger.warn("webhook.stripe.invalid_signature");
    return new Response("Invalid signature", { status: 400 });
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await syncSubscription(event.data.object);
        break;
      case "checkout.session.completed": {
        const session = event.data.object;
        if (typeof session.subscription === "string") {
          await syncSubscription(await stripe.subscriptions.retrieve(session.subscription));
        }
        break;
      }
      case "invoice.payment_failed":
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice & { subscription?: string | null };
        if (typeof invoice.subscription === "string") {
          await syncSubscription(await stripe.subscriptions.retrieve(invoice.subscription));
        }
        break;
      }
      default:
        logger.debug("webhook.stripe.unhandled", { type: event.type, id: event.id });
    }
    logger.info("webhook.stripe", { type: event.type, id: event.id });
    return Response.json({ received: true }, { status: 200 });
  } catch (err) {
    logger.error("webhook.stripe.failed", { type: event.type, id: event.id, err: String(err) });
    return new Response("Processing error", { status: 500 });
  }
}
