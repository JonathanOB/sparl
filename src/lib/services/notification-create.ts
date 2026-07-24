/**
 * Notification creation — Clerk-free (admin client) so both the API and the worker
 * can notify any user. Read/update live in notification-service (RLS user client).
 */
import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Enums } from "@/shared/types/database.types";

export async function createNotification(
  userId: string,
  type: Enums<"notification_type">,
  title: string,
  message: string
): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("notifications")
    .insert({ user_id: userId, type, title, message, read: false });
  if (error) throw new Error(error.message);
  // TODO(email): best-effort Resend send for renewal/saving notifications.
}
