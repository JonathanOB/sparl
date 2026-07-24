"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { PLAN_TIERS } from "@/lib/billing/plans";
import { useBillingPortal, useCheckout, useSubscription } from "@/lib/query/hooks";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function BillingPage() {
  const { data: subscription } = useSubscription();
  const checkout = useCheckout();
  const portal = useBillingPortal();

  const [yearly, setYearly] = useState(false);
  const status = useSearchParams().get("status");

  const currentPlan = subscription?.plan ?? "free";
  const isPaid = currentPlan !== "free";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
          <p className="text-muted-foreground">Choose the plan that fits your household.</p>
        </div>
        {isPaid ? (
          <Button variant="outline" onClick={() => portal.mutate()} disabled={portal.isPending}>
            Manage subscription
          </Button>
        ) : null}
      </div>

      {status === "success" ? (
        <Alert variant="success">
          <AlertDescription>Thanks! Your subscription is being activated.</AlertDescription>
        </Alert>
      ) : status === "cancelled" ? (
        <Alert variant="info">
          <AlertDescription>Checkout cancelled — no changes were made.</AlertDescription>
        </Alert>
      ) : null}

      <div className="inline-flex items-center gap-1 rounded-lg border border-border p-1 text-sm">
        <button
          onClick={() => setYearly(false)}
          className={cn("rounded-md px-3 py-1", !yearly && "bg-primary text-primary-foreground")}
        >
          Monthly
        </button>
        <button
          onClick={() => setYearly(true)}
          className={cn("rounded-md px-3 py-1", yearly && "bg-primary text-primary-foreground")}
        >
          Yearly
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {PLAN_TIERS.map((tier) => {
          const isCurrent = tier.id === currentPlan;
          const lookupKey = yearly && tier.yearlyLookupKey ? tier.yearlyLookupKey : tier.lookupKey;
          const priceLabel = yearly && tier.yearlyLabel ? tier.yearlyLabel : tier.monthlyLabel;
          return (
            <Card key={tier.id} className={cn(tier.highlight && "border-primary shadow-md")}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {tier.name}
                  {isCurrent ? (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                      Current
                    </span>
                  ) : null}
                </CardTitle>
                <p className="text-figure text-2xl">{priceLabel}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-success" />
                      {f}
                    </li>
                  ))}
                </ul>
                {isCurrent || tier.id === "free" ? null : (
                  <Button
                    className="w-full"
                    variant={tier.highlight ? "default" : "outline"}
                    onClick={() => lookupKey && checkout.mutate(lookupKey)}
                    disabled={checkout.isPending || !lookupKey}
                  >
                    {checkout.isPending ? "Redirecting…" : `Upgrade to ${tier.name}`}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        Payments are handled securely by Stripe. Cancel anytime from Manage subscription.
      </p>
    </div>
  );
}
