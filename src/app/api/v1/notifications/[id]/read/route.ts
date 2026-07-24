/**
 * POST /api/v1/notifications/{id}/read — mark one notification read.
 */
import { authed } from "@/lib/api/authed";
import { ok } from "@/lib/api/envelope";
import { requireUuidParam } from "@/lib/api/validation";
import { markNotificationRead } from "@/lib/services/notification-service";

export const dynamic = "force-dynamic";

export const POST = authed(async ({ params }) => {
  const id = requireUuidParam(params.id);
  return ok(await markNotificationRead(id));
});
