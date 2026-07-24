/**
 * GET /api/v1/notifications — the caller's recent notifications (D4 §17).
 */
import { authed } from "@/lib/api/authed";
import { ok } from "@/lib/api/envelope";
import { listNotifications } from "@/lib/services/notification-service";

export const dynamic = "force-dynamic";

export const GET = authed(async () => {
  return ok(await listNotifications());
});
