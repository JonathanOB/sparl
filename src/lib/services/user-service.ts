/**
 * User service (D4 §7, D13 §11–12). Business logic for the current user's profile.
 * Data access goes through the RLS-scoped user client (§2.2): the `users_self`
 * policy already limits rows to the caller, and we additionally scope by
 * ctx.userId (belt-and-braces). Routes never touch the DB directly.
 */
import "server-only";
import { z } from "zod";
import { createUserClient } from "@/lib/supabase/server";
import { AppError, ErrorCode } from "@/lib/api/errors";
import type { UserContext } from "@/lib/auth/user-context";
import type { Tables, TablesUpdate } from "@/shared/types/database.types";

export const updateMeSchema = z
  .object({
    first_name: z.string().min(1).max(100).optional(),
    last_name: z.string().min(1).max(100).optional(),
    timezone: z.string().min(1).max(64).optional(),
    country_id: z.uuid().optional(),
  })
  .strict();

export type UpdateMeInput = z.infer<typeof updateMeSchema>;

export async function getMe(ctx: UserContext): Promise<Tables<"users">> {
  const supabase = await createUserClient();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", ctx.userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new AppError(ErrorCode.NOT_FOUND, "User profile not found.");
  return data;
}

export async function updateMe(ctx: UserContext, input: UpdateMeInput): Promise<Tables<"users">> {
  const supabase = await createUserClient();
  const patch: TablesUpdate<"users"> = { ...input };
  const { data, error } = await supabase
    .from("users")
    .update(patch)
    .eq("id", ctx.userId)
    .select()
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new AppError(ErrorCode.NOT_FOUND, "User profile not found.");
  return data;
}
