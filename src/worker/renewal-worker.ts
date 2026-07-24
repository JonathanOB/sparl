/**
 * Renewal monitoring job (D8 §8.2, D1 §6.4, Phase 9). Daily: find services renewing
 * within 30 days, (re)generate recommendations for those households, and notify
 * their members. Clerk-free imports only (runs in the worker process).
 */
import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateRecommendationsFor } from "@/lib/services/recommendation-engine";
import { createNotification } from "@/lib/services/notification-create";

function log(level: string, msg: string, data?: Record<string, unknown>) {
  console.log(JSON.stringify({ ts: new Date().toISOString(), level, msg, ...data }));
}

export async function processRenewalScan(): Promise<void> {
  const admin = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);
  const soon = new Date();
  soon.setDate(soon.getDate() + 30);
  const soonStr = soon.toISOString().slice(0, 10);

  const { data: services, error } = await admin
    .from("user_services")
    .select("household_id, renewal_date")
    .is("deleted_at", null)
    .not("renewal_date", "is", null)
    .gte("renewal_date", today)
    .lte("renewal_date", soonStr);
  if (error) {
    log("error", "renewal.scan_failed", { err: error.message });
    return;
  }

  const households = [...new Set((services ?? []).map((s) => s.household_id))];
  let notified = 0;

  for (const householdId of households) {
    let created = 0;
    try {
      created = (await generateRecommendationsFor(admin, householdId)).created;
    } catch (err) {
      log("error", "renewal.generate_failed", { householdId, err: String(err) });
    }

    const { data: members } = await admin
      .from("household_members")
      .select("user_id")
      .eq("household_id", householdId)
      .is("deleted_at", null);

    for (const m of members ?? []) {
      await createNotification(
        m.user_id,
        "renewal",
        "A contract is coming up for renewal",
        created > 0
          ? `We found ${created} way${created === 1 ? "" : "s"} to save before your renewal.`
          : "One of your services is renewing soon — review it to avoid overpaying."
      );
      notified++;
    }
  }

  log("info", "renewal.scan_done", { households: households.length, notified });
}
