/**
 * GET  /api/v1/users/me — current user's profile.
 * PATCH /api/v1/users/me — update profile fields.
 * Canonical endpoint shape: authed → validate (Zod) → service → typed envelope.
 * No business logic or DB access here (§1 Global Conventions).
 */
import { authed } from "@/lib/api/authed";
import { ok } from "@/lib/api/envelope";
import { parseJson } from "@/lib/api/validation";
import { getMe, updateMe, updateMeSchema } from "@/lib/services/user-service";

export const dynamic = "force-dynamic";

export const GET = authed(async ({ ctx }) => {
  const user = await getMe(ctx);
  return ok(user);
});

export const PATCH = authed(async ({ ctx, req }) => {
  const input = await parseJson(req, updateMeSchema);
  const user = await updateMe(ctx, input);
  return ok(user);
});
