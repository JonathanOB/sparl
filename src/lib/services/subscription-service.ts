/**
 * Subscription service (D4 §18, D11 §5, Phase 10). Checkout, portal, cancel, and
 * the current subscription. Prices resolved by Stripe lookup key (config-driven,
 * §2.5). Stripe customer id is cached on the subscriptions row.
 */
import "server-only";
import { z } from "zod";
import { getStripe } from "@/lib/stripe";
import { createUserClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AppError, ErrorCode } from "@/lib/api/errors";
import { VALID_LOOKUP_KEYS } from "@/lib/billing/plans";
import type { UserContext } from "@/lib/auth/user-context";
import type { Tables } from "@/shared/types/database.types";

const appUrl = () => process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const checkoutSchema = z.object({ lookupKey: z.enum(VALID_LOOKUP_KEYS) }).strict();
export type CheckoutInput = z.infer<typeof checkoutSchema>;

export async function getSubscription(): Promise<Tables<"subscriptions"> | null> {
  const supabase = await createUserClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

async function ensureStripeCustomer(ctx: UserContext): Promise<string> {
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", ctx.userId)
    .not("stripe_customer_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existing?.stripe_customer_id) return existing.stripe_customer_id;

  const customer = await getStripe().customers.create({
    email: ctx.email,
    metadata: { user_id: ctx.userId },
  });
  await admin
    .from("subscriptions")
    .insert({ user_id: ctx.userId, stripe_customer_id: customer.id, plan: "free", status: "incomplete" });
  return customer.id;
}

export async function createCheckoutSession(
  ctx: UserContext,
  lookupKey: string
): Promise<{ url: string }> {
  const stripe = getStripe();
  const price = (await stripe.prices.list({ lookup_keys: [lookupKey], limit: 1 })).data[0];
  if (!price) throw new AppError(ErrorCode.NOT_FOUND, "That plan isn't available.");

  const customerId = await ensureStripeCustomer(ctx);
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: price.id, quantity: 1 }],
    success_url: `${appUrl()}/dashboard/billing?status=success`,
    cancel_url: `${appUrl()}/dashboard/billing?status=cancelled`,
    subscription_data: { metadata: { user_id: ctx.userId } },
    allow_promotion_codes: true,
  });
  if (!session.url) throw new AppError(ErrorCode.INTERNAL, "Could not start checkout.");
  return { url: session.url };
}

export async function createPortalSession(ctx: UserContext): Promise<{ url: string }> {
  const customerId = await ensureStripeCustomer(ctx);
  const session = await getStripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: `${appUrl()}/dashboard/billing`,
  });
  return { url: session.url };
}

export async function cancelSubscription(): Promise<{ canceled: boolean }> {
  const sub = await getSubscription();
  if (!sub?.stripe_subscription_id) {
    throw new AppError(ErrorCode.NOT_FOUND, "No active subscription to cancel.");
  }
  await getStripe().subscriptions.update(sub.stripe_subscription_id, { cancel_at_period_end: true });
  return { canceled: true };
}
