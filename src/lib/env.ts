/**
 * Server-side environment access, validated with Zod (§1 Global Conventions).
 * Import only from server code — pulling this into a client bundle is a build
 * error (server-only). Values are parsed once and cached; a missing required
 * var fails loudly with a clear message instead of a vague runtime crash.
 */
import "server-only";
import { z } from "zod";

// Empty string (an unset var in .env) is treated as absent for optional secrets.
const optionalSecret = z.preprocess(
  (v) => (v === "" ? undefined : v),
  z.string().min(1).optional()
);

const schema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  SUPABASE_SECRET_KEY: z.string().min(1),
  CLERK_SECRET_KEY: z.string().min(1),
  STRIPE_SECRET_KEY: z.string().min(1),
  // Set after the provider webhooks are created (see webhook.md).
  STRIPE_WEBHOOK_SECRET: optionalSecret,
  CLERK_WEBHOOK_SIGNING_SECRET: optionalSecret,
});

export type ServerEnv = z.infer<typeof schema>;

let cached: ServerEnv | null = null;

export function serverEnv(): ServerEnv {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const fields = Object.keys(parsed.error.flatten().fieldErrors).join(", ");
    throw new Error(`Invalid or missing environment variables: ${fields}`);
  }
  cached = parsed.data;
  return cached;
}
