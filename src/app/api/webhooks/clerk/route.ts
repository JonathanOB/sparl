/**
 * POST /api/webhooks/clerk — sync Clerk identity into public.users (§2.3).
 * Public route (no session). Signature verified via Svix (verifyWebhook) using
 * CLERK_WEBHOOK_SIGNING_SECRET. User upsert/soft-delete is shared with the
 * lazy-provisioning path (see @/lib/auth/users) so they never diverge.
 */
import type { NextRequest } from "next/server";
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { createAdminClient } from "@/lib/supabase/server";
import { upsertUser, softDeleteUser } from "@/lib/auth/users";
import { createRequestLogger } from "@/lib/log/logger";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest): Promise<Response> {
  const logger = createRequestLogger(req);

  let evt;
  try {
    evt = await verifyWebhook(req);
  } catch {
    logger.warn("webhook.clerk.invalid_signature");
    return new Response("Invalid signature", { status: 400 });
  }

  const admin = createAdminClient();

  try {
    if (evt.type === "user.created" || evt.type === "user.updated") {
      const d = evt.data;
      const email =
        d.email_addresses.find((e) => e.id === d.primary_email_address_id)?.email_address ??
        d.email_addresses[0]?.email_address ??
        "";
      await upsertUser(admin, {
        clerkUserId: d.id,
        email,
        firstName: d.first_name ?? null,
        lastName: d.last_name ?? null,
      });
    } else if (evt.type === "user.deleted" && evt.data.id) {
      await softDeleteUser(admin, evt.data.id);
    }

    logger.info("webhook.clerk", { type: evt.type });
    return new Response("ok", { status: 200 });
  } catch (err) {
    logger.error("webhook.clerk.failed", { type: evt.type, err });
    return new Response("Processing error", { status: 500 });
  }
}
