"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { useNotifications } from "@/lib/query/hooks";

export function Topbar() {
  const { data: notifications } = useNotifications();
  const unread = notifications?.filter((n) => !n.read).length ?? 0;

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-background px-6">
      <div className="text-sm font-medium text-muted-foreground md:hidden">Sparl</div>
      <div className="ml-auto flex items-center gap-3">
        <Link
          href="/dashboard/notifications"
          className="relative rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Notifications"
        >
          <Bell className="size-5" />
          {unread > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          ) : null}
        </Link>
        <UserButton />
      </div>
    </header>
  );
}
