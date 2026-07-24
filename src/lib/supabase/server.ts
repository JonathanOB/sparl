/**
 * Clerk-aware Supabase client (§2.2). Server-only. This module imports Clerk, so
 * do NOT import it from the worker — use @/lib/supabase/admin there instead.
 *
 * createUserClient(): RLS-scoped. Attaches the caller's Clerk session token via
 * `accessToken`, so Supabase (native Third-Party Auth for Clerk) sets
 * auth.jwt()->>'sub' and RLS policies apply. Use for anything acting *as the user*.
 */
import "server-only";
import { auth } from "@clerk/nextjs/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { serverEnv } from "@/lib/env";
import type { Database } from "@/shared/types/database.types";

export { createAdminClient, createPublicClient } from "@/lib/supabase/admin";

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
