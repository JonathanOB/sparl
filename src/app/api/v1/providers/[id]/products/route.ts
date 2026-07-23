/**
 * GET /api/v1/providers/{id}/products — a provider's products.
 */
import { authed } from "@/lib/api/authed";
import { ok } from "@/lib/api/envelope";
import { requireUuidParam } from "@/lib/api/validation";
import { listProviderProducts } from "@/lib/services/provider-service";

export const dynamic = "force-dynamic";

export const GET = authed(async ({ params }) => {
  const providerId = requireUuidParam(params.id);
  return ok(await listProviderProducts(providerId));
});
