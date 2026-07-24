"use client";

import { Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrentHousehold, useHouseholds } from "@/lib/query/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { CreateHouseholdDialog } from "@/components/households/create-household-dialog";

export default function HouseholdPage() {
  const { data: households, isLoading, isError, refetch } = useHouseholds();
  const { data: current } = useCurrentHousehold();

  const addressLine = (h: { city: string | null; postal_code: string | null }) =>
    [h.city, h.postal_code].filter(Boolean).join(", ");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Household</h1>
          <p className="text-muted-foreground">Your homes and their details.</p>
        </div>
        {households && households.length > 0 ? (
          <CreateHouseholdDialog triggerLabel="Add household" />
        ) : null}
      </div>

      {isLoading ? (
        <LoadingState message="Loading your households…" />
      ) : isError ? (
        <ErrorState
          message="We couldn't load your households."
          onRetry={() => {
            void refetch();
          }}
        />
      ) : !households || households.length === 0 ? (
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle>Create your first household</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Add your home to start tracking services, bills and renewals.
            </p>
            <CreateHouseholdDialog triggerLabel="Create household" />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {households.map((h) => (
            <Card key={h.id}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Home className="size-4 text-muted-foreground" />
                  <CardTitle className="text-base">{h.name}</CardTitle>
                  {current?.id === h.id ? (
                    <span className="ml-auto inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      Active
                    </span>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="space-y-1 text-sm text-muted-foreground">
                <p className={cn(!addressLine(h) && "italic")}>
                  {addressLine(h) || "No address yet"}
                </p>
                {h.property_type ? <p className="capitalize">{h.property_type}</p> : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
