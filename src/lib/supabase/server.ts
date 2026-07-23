/**
 * Supabase clients (§2.2). Server-only.
 *
 *  - createUserClient(): RLS-scoped. Attaches the caller's Clerk session token via
 *    `accessToken`, so Supabase (native Third-Party Auth for Clerk) sets
 *    auth.jwt()->>'sub' and RLS policies apply. Use for anything acting *as the user*.
 *  - createAdminClient(): uses the secret key, BYPASSES RLS. Server-only (workers,
 *    webhooks, admin). Any code path using it MUST do its own ownership check
 *    (belt-and-braces, §2.2). Never expose it to a client.
 */
import "server-only";
import { auth } from "@clerk/nextjs/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { serverEnv } from "@/lib/env";
import type { Database } from "@/shared/types/database.types";

export async function createUserClient(): Promise<SupabaseClient<Database>> {
  const env = serverEnv();
  const { getToken } = await auth();
  return createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      accessToken: async () => (await getToken()) ?? null,
      auth: { persistSession: false, autoRefreshToken: false },
    }
  );
}

export function createAdminClient(): SupabaseClient<Database> {
  const env = serverEnv();
  return createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
