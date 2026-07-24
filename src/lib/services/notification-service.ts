/**
 * Notification service (D4 §17, D8 §8.5, Phase 9). In-app notifications backed by
 * the `notifications` table. Creation is admin-scoped (system/worker can notify
 * any user); reads/updates go through the RLS user client. Value-only content.
 */
import "server-only";
import { createUserClient } from "@/lib/supabase/server";
import { AppError, ErrorCode } from "@/lib/api/errors";
import type { Tables } from "@/shared/types/database.types";

export { createNotification } from "@/lib/services/notification-create";

export async function listNotifications(): Promise<Tables<"notifications">[]> {
  const supabase = await createUserClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function markNotificationRead(id: string): Promise<Tables<"notifications">> {
  const supabase = await createUserClient();
  const { data, error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", id)
    .is("deleted_at", null)
    .select()
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new AppError(ErrorCode.NOT_FOUND, "Notification not found.");
  return data;
}

export async function markAllNotificationsRead(): Promise<{ updated: number }> {
  const supabase = await createUserClient();
  const { data, error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("read", false)
    .is("deleted_at", null)
    .select("id");
  if (error) throw new Error(error.message);
  return { updated: (data ?? []).length };
}
