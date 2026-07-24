/**
 * Feature entitlements by plan (D11 §8, D10 §17). Free is limited; paid unlocks.
 * Used for gating (assistant limit, document AI). Pure — safe anywhere.
 */
import type { UserContext } from "@/lib/auth/user-context";

export const AI_FREE_MONTHLY_LIMIT = 20;

export function isPaid(ctx: UserContext): boolean {
  return ctx.subscriptionPlan !== "free";
}

/** Document AI extraction is a premium feature (D11 §8). */
export function canUseDocumentAI(ctx: UserContext): boolean {
  return isPaid(ctx);
}
