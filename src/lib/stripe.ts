/**
 * Stripe SDK client (server-only). Test-mode keys during the build (§2.5).
 * Full billing lives in Phase 10; this exists so the webhook endpoint can verify
 * signatures now.
 */
import "server-only";
import Stripe from "stripe";
import { serverEnv } from "@/lib/env";

let cached: Stripe | null = null;

export function getStripe(): Stripe {
  if (!cached) {
    cached = new Stripe(serverEnv().STRIPE_SECRET_KEY, {
      typescript: true,
      appInfo: { name: "sparl-web" },
    });
  }
  return cached;
}
