import { Sidebar } from "@/components/nav/sidebar";
import { Topbar } from "@/components/nav/topbar";

/** Authenticated app frame: sidebar + topbar + main content (D6 §7). */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
