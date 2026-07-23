/**
 * Shared user-sync logic (§2.3). Single source of truth used by BOTH the Clerk
 * webhook and lazy provisioning in getUserContext, so they can never diverge.
 * Server-only; uses a trusted (admin) client — inherently self-scoped by clerk id.
 */
import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/shared/types/database.types";

/** Normalised Clerk profile — decouples callers from Clerk's differing payload shapes. */
export interface ClerkUserInput {
  clerkUserId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
}

export async function upsertUser(
  admin: SupabaseClient<Database>,
  input: ClerkUserInput
): Promise<Tables<"users">> {
  const { data, error } = await admin
    .from("users")
    .upsert(
      {
        clerk_user_id: input.clerkUserId,
        email: input.email,
        first_name: input.firstName,
        last_name: input.lastName,
        deleted_at: null,
      },
      { onConflict: "clerk_user_id" }
    )
    .select()
    .single();
  if (error) throw new Error(`upsertUser failed: ${error.message}`);
  return data;
}

export async function softDeleteUser(
  admin: SupabaseClient<Database>,
  clerkUserId: string
): Promise<void> {
  const { error } = await admin
    .from("users")
    .update({ deleted_at: new Date().toISOString() })
    .eq("clerk_user_id", clerkUserId);
  if (error) throw new Error(`softDeleteUser failed: ${error.message}`);
}
