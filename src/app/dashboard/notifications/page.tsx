"use client";

import { CalendarClock, PiggyBank, Info, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "@/lib/query/hooks";
import type { Enums } from "@/shared/types/database.types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";

const iconFor: Record<Enums<"notification_type">, typeof Info> = {
  saving_found: PiggyBank,
  renewal: CalendarClock,
  billing: CreditCard,
  system: Info,
};

export default function NotificationsPage() {
  const { data: notifications, isLoading, isError, refetch } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const unread = notifications?.filter((n) => !n.read).length ?? 0;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">Savings, renewals and account updates.</p>
        </div>
        {unread > 0 ? (
          <Button variant="outline" size="sm" onClick={() => markAll.mutate()} disabled={markAll.isPending}>
            Mark all read
          </Button>
        ) : null}
      </div>

      {isLoading ? (
        <LoadingState message="Loading notifications…" />
      ) : isError ? (
        <ErrorState
          message="We couldn't load your notifications."
          onRetry={() => {
            void refetch();
          }}
        />
      ) : !notifications || notifications.length === 0 ? (
        <p className="text-sm text-muted-foreground">No notifications yet.</p>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const Icon = iconFor[n.type];
            return (
              <Card
                key={n.id}
                className={cn("cursor-pointer transition-colors", !n.read && "border-primary/30")}
                onClick={() => {
                  if (!n.read) markRead.mutate(n.id);
                }}
              >
                <CardContent className="flex items-start gap-3 p-4">
                  <Icon className={cn("mt-0.5 size-5 shrink-0", n.read ? "text-muted-foreground" : "text-primary")} />
                  <div className="min-w-0 flex-1">
                    <p className={cn("text-sm", !n.read && "font-medium")}>{n.title}</p>
                    {n.message ? (
                      <p className="text-sm text-muted-foreground">{n.message}</p>
                    ) : null}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(n.created_at).toLocaleString()}
                    </p>
                  </div>
                  {!n.read ? <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" /> : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
