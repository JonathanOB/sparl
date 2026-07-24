/**
 * Stripe → DB subscription sync (D11 §7, §2.8). Clerk-free (admin client) so the
 * webhook route can call it. Idempotent upsert keyed on the Stripe customer.
 */
import "server-only";
import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Enums } from "@/shared/types/database.types";

function mapStatus(status: Stripe.Subscription.Status): Enums<"subscription_status"> {
  switch (status) {
    case "active":
    case "trialing":
    case "past_due":
    case "canceled":
    case "unpaid":
    case "incomplete":
    case "incomplete_expired":
      return status;
    default:
      return "incomplete"; // e.g. "paused" — approximate
  }
}

function planFromSubscription(sub: Stripe.Subscription): Enums<"subscription_plan"> {
  const plan = sub.items.data[0]?.price?.metadata?.sparl_plan;
  return plan === "premium" || plan === "family" ? plan : "free";
}

export async function syncSubscription(sub: Stripe.Subscription): Promise<void> {
  const admin = createAdminClient();
  const userId = sub.metadata?.user_id ?? null;
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const status = mapStatus(sub.status);
  const plan = status === "canceled" ? "free" : planFromSubscription(sub);

  const periodEnd = (sub as unknown as { current_period_end?: number }).current_period_end;
  const renewalDate =
    typeof periodEnd === "number" ? new Date(periodEnd * 1000).toISOString().slice(0, 10) : null;

  const patch = {
    stripe_subscription_id: sub.id,
    plan,
    status,
    renewal_date: renewalDate,
  };

  const { data: existing } = await admin
    .from("subscriptions")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    await admin.from("subscriptions").update(patch).eq("id", existing.id);
  } else if (userId) {
    await admin.from("subscriptions").insert({ user_id: userId, stripe_customer_id: customerId, ...patch });
  }
}
