/**
 * Clerk-free Supabase clients (§2.2). Kept separate from server.ts (which imports
 * Clerk) so the worker process can use them without pulling in Next.js/Clerk.
 *
 *  - createAdminClient(): secret key, BYPASSES RLS. Trusted server/worker contexts
 *    only; always filter by ctx-derived ownership. Never reaches a client.
 *  - createPublicClient(): anon (publishable key, no user token) for PUBLIC read-only
 *    data (providers, categories). RLS still applies (`select using(true)`).
 */
import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { serverEnv } from "@/lib/env";
import type { Database } from "@/shared/types/database.types";

export function createAdminClient(): SupabaseClient<Database> {
  const env = serverEnv();
  return createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function createPublicClient(): SupabaseClient<Database> {
  const env = serverEnv();
  return createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
