import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { AppShell } from "@/components/app-shell";

/**
 * Authenticated app layout. Resource-based auth (§2.2): the guard lives here,
 * where protected data is served — not in middleware.
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  return <AppShell>{children}</AppShell>;
}
