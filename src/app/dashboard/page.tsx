import { redirect } from "next/navigation";

/** /dashboard → the overview at /dashboard/main. */
export default function DashboardIndex() {
  redirect("/dashboard/main");
}
