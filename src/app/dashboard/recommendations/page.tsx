"use client";

import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useAcceptRecommendation,
  useCategories,
  useGenerateRecommendations,
  useProviders,
  useRecommendations,
  useRejectRecommendation,
} from "@/lib/query/hooks";
import type { Tables } from "@/shared/types/database.types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";

function confidenceLabel(score: number | null): string {
  if (score == null) return "—";
  if (score >= 0.8) return "High confidence";
  if (score >= 0.6) return "Medium confidence";
  return "Low confidence";
}

export default function RecommendationsPage() {
  const { data: recs, isLoading, isError, refetch } = useRecommendations();
  const { data: categories } = useCategories();
  const { data: providers } = useProviders();
  const generate = useGenerateRecommendations();
  const accept = useAcceptRecommendation();
  const reject = useRejectRecommendation();

  const categoryName = (id: string | null) =>
    (id && categories?.find((c) => c.id === id)?.name) || "Service";
  const providerName = (id: string | null) =>
    (id && providers?.find((p) => p.id === id)?.name) || "another provider";

  const active = recs?.filter((r) => r.status === "new" || r.status === "viewed") ?? [];
  const resolved = recs?.filter((r) => r.status === "accepted" || r.status === "rejected") ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Recommendations</h1>
          <p className="text-muted-foreground">Personalised switches that save you money.</p>
        </div>
        <Button onClick={() => generate.mutate()} disabled={generate.isPending}>
          <Sparkles className="size-4" />
          {generate.isPending ? "Finding savings…" : "Find savings"}
        </Button>
      </div>

      {isLoading ? (
        <LoadingState message="Loading recommendations…" />
      ) : isError ? (
        <ErrorState
          message="We couldn't load your recommendations."
          onRetry={() => {
            void refetch();
          }}
        />
      ) : active.length === 0 && resolved.length === 0 ? (
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle>No recommendations yet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Add your services (or upload a bill), then tap <strong>Find savings</strong> and
              Sparl will compare them against the market.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {active.length > 0 ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {active.map((r) => (
                <RecommendationCard
                  key={r.id}
                  rec={r}
                  categoryName={categoryName(r.category_id)}
                  providerName={providerName(r.recommended_provider_id)}
                  onAccept={() => accept.mutate(r.id)}
                  onReject={() => reject.mutate({ id: r.id })}
                  busy={accept.isPending || reject.isPending}
                />
              ))}
            </div>
          ) : null}

          {resolved.length > 0 ? (
            <div className="space-y-3">
              <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                Reviewed
              </h2>
              {resolved.map((r) => (
                <Card key={r.id}>
                  <CardContent className="flex items-center justify-between gap-4 p-4">
                    <div>
                      <p className="font-medium">{categoryName(r.category_id)}</p>
                      <p className="text-sm text-muted-foreground">{r.summary}</p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                        r.status === "accepted"
                          ? "bg-success-subtle text-success"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {r.status}
                    </span>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : null}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Sparl may earn a commission if you switch through us. We only ever recommend switches that
        save you money (D10 §25).
      </p>
    </div>
  );
}

function RecommendationCard({
  rec,
  categoryName,
  providerName,
  onAccept,
  onReject,
  busy,
}: {
  rec: Tables<"recommendations">;
  categoryName: string;
  providerName: string;
  onAccept: () => void;
  onReject: () => void;
  busy: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">{categoryName}</CardTitle>
          <span className="text-xs text-muted-foreground">{confidenceLabel(rec.confidence_score)}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-figure text-3xl text-success">
            €{rec.estimated_saving != null ? Number(rec.estimated_saving).toFixed(0) : "—"}
            <span className="ml-1 text-base font-normal text-muted-foreground">/yr saving</span>
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Switch to <span className="font-medium text-foreground">{providerName}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="success" size="sm" onClick={onAccept} disabled={busy}>
            Accept
          </Button>
          <Button variant="ghost" size="sm" onClick={onReject} disabled={busy}>
            Not now
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
