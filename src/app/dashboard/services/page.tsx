"use client";

import { CalendarClock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCategories, useDeleteService, useProviders, useServices } from "@/lib/query/hooks";
import type { Enums } from "@/shared/types/database.types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { AddServiceDialog } from "@/components/services/add-service-dialog";

const statusStyles: Record<Enums<"user_service_status">, string> = {
  active: "bg-success-subtle text-success",
  expired: "bg-warning-subtle text-warning",
  cancelled: "bg-muted text-muted-foreground",
  unknown: "bg-muted text-muted-foreground",
};

function StatusPill({ status }: { status: Enums<"user_service_status"> }) {
  return (
    <span
      className={cn(
        "inline-flex w-fit rounded-full px-2 py-0.5 text-xs font-medium capitalize",
        statusStyles[status]
      )}
    >
      {status}
    </span>
  );
}

export default function ServicesPage() {
  const { data: services, isLoading, isError, refetch } = useServices();
  const { data: categories } = useCategories();
  const { data: providers } = useProviders();
  const del = useDeleteService();

  const categoryName = (id: string | null) =>
    (id && categories?.find((c) => c.id === id)?.name) || "Uncategorised";
  const providerName = (id: string | null) =>
    id ? (providers?.find((p) => p.id === id)?.name ?? "Unknown provider") : "No provider yet";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Services</h1>
          <p className="text-muted-foreground">Your broadband, energy, insurance and more.</p>
        </div>
        <AddServiceDialog />
      </div>

      {isLoading ? (
        <LoadingState message="Loading your services…" />
      ) : isError ? (
        <ErrorState
          message="We couldn't load your services."
          onRetry={() => {
            void refetch();
          }}
        />
      ) : !services || services.length === 0 ? (
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle>No services yet</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Add your first service to start tracking renewals and finding savings.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <Card key={s.id}>
              <CardHeader>
                <CardTitle className="text-base">{categoryName(s.category_id)}</CardTitle>
                <p className="text-sm text-muted-foreground">{providerName(s.provider_id)}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-figure text-2xl">
                  {s.monthly_cost != null ? `€${s.monthly_cost}/mo` : "—"}
                </p>
                {s.renewal_date ? (
                  <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <CalendarClock className="size-4" /> Renews {s.renewal_date}
                  </p>
                ) : null}
                <StatusPill status={s.status} />
                <div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => del.mutate(s.id)}
                    disabled={del.isPending}
                  >
                    Remove
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
