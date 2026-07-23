/**
 * GET /api/v1/providers/{id} — a single provider.
 */
import { authed } from "@/lib/api/authed";
import { ok } from "@/lib/api/envelope";
import { requireUuidParam } from "@/lib/api/validation";
import { getProvider } from "@/lib/services/provider-service";

export const dynamic = "force-dynamic";

export const GET = authed(async ({ params }) => {
  const id = requireUuidParam(params.id);
  return ok(await getProvider(id));
});
