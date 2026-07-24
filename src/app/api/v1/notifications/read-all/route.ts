/**
 * POST /api/v1/notifications/read-all — mark all notifications read.
 */
import { authed } from "@/lib/api/authed";
import { ok } from "@/lib/api/envelope";
import { markAllNotificationsRead } from "@/lib/services/notification-service";

export const dynamic = "force-dynamic";

export const POST = authed(async () => {
  return ok(await markAllNotificationsRead());
});
