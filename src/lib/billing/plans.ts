/**
 * Sparl plan tiers (§2.5, D11 §3). Display metadata + the Stripe price lookup keys
 * used for checkout. The actual charge is Stripe's; prices here are labels only.
 */
export type PlanId = "free" | "premium" | "family";

export const VALID_LOOKUP_KEYS = ["premium_monthly", "premium_yearly", "family_monthly"] as const;
export type LookupKey = (typeof VALID_LOOKUP_KEYS)[number];

export interface PlanTier {
  id: PlanId;
  name: string;
  monthlyLabel: string;
  lookupKey: LookupKey | null; // monthly checkout key; null = Free
  yearlyLookupKey?: LookupKey;
  yearlyLabel?: string;
  features: string[];
  highlight?: boolean;
}

export const PLAN_TIERS: PlanTier[] = [
  {
    id: "free",
    name: "Free",
    monthlyLabel: "€0",
    lookupKey: null,
    features: ["Track your services", "Savings recommendations", "20 AI questions / month"],
  },
  {
    id: "premium",
    name: "Premium",
    monthlyLabel: "€4.99/mo",
    lookupKey: "premium_monthly",
    yearlyLookupKey: "premium_yearly",
    yearlyLabel: "€49/yr",
    highlight: true,
    features: [
      "Everything in Free",
      "Unlimited AI assistant",
      "Document AI extraction",
      "Priority renewal monitoring",
    ],
  },
  {
    id: "family",
    name: "Family",
    monthlyLabel: "€7.99/mo",
    lookupKey: "family_monthly",
    features: ["Everything in Premium", "Up to 5 household members", "Multiple households"],
  },
];
