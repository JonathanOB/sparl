"use client";

import { UserButton } from "@clerk/nextjs";

export function Topbar() {
  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-background px-6">
      <div className="text-sm font-medium text-muted-foreground md:hidden">Sparl</div>
      <div className="ml-auto">
        <UserButton />
      </div>
    </header>
  );
}
