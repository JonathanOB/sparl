/**
 * GET /api/v1/providers?country_id=&category_id= — list active providers.
 */
import { authed } from "@/lib/api/authed";
import { ok } from "@/lib/api/envelope";
import { parseQuery } from "@/lib/api/validation";
import { listProviders, providerFilterSchema } from "@/lib/services/provider-service";

export const dynamic = "force-dynamic";

export const GET = authed(async ({ req }) => {
  const filter = parseQuery(req, providerFilterSchema);
  return ok(await listProviders(filter));
});
