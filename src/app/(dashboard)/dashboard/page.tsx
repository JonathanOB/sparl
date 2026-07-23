"use client";

import Link from "next/link";
import { PiggyBank, CalendarClock, ShieldCheck } from "lucide-react";
import { useCurrentHousehold } from "@/lib/query/hooks";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { StatCard } from "@/components/dashboard/stat-card";

export default function DashboardPage() {
  const { data: household, isLoading, isError, refetch } = useCurrentHousehold();

  if (isLoading) return <LoadingState message="Loading your dashboard…" />;
  if (isError) {
    return (
      <ErrorState
        message="We couldn't load your dashboard."
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }

  if (!household) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Welcome to Sparl</h1>
          <p className="text-muted-foreground">Let&apos;s set up your household to get started.</p>
        </div>
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle>Create your household</CardTitle>
            <CardDescription>
              Add your home so we can start tracking bills and finding savings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/household">Set up household</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{household.name}</h1>
        <p className="text-muted-foreground">Here&apos;s your household at a glance.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          icon={PiggyBank}
          label="Estimated savings"
          value="€0"
          hint="Add services to find savings"
          tone="success"
        />
        <StatCard
          icon={CalendarClock}
          label="Upcoming renewals"
          value="0"
          hint="No renewals tracked yet"
          tone="warning"
        />
        <StatCard
          icon={ShieldCheck}
          label="Household health"
          value="—"
          hint="Complete your profile"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent recommendations</CardTitle>
          <CardDescription>Personalised savings will appear here.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            No recommendations yet. Add a service or upload a bill to get started.
          </p>
          <Button asChild>
            <Link href="/services">Add a service</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
