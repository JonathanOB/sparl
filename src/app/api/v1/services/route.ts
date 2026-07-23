/**
 * GET  /api/v1/services?household_id= — list the caller's services.
 * POST /api/v1/services — add a service (creates user_services + contract + renewal).
 */
import { authed } from "@/lib/api/authed";
import { ok } from "@/lib/api/envelope";
import { parseJson, parseQuery } from "@/lib/api/validation";
import {
  createService,
  createServiceSchema,
  listServices,
  listServicesSchema,
} from "@/lib/services/service-management";

export const dynamic = "force-dynamic";

export const GET = authed(async ({ req }) => {
  const filter = parseQuery(req, listServicesSchema);
  return ok(await listServices(filter));
});

export const POST = authed(async ({ ctx, req }) => {
  const input = await parseJson(req, createServiceSchema);
  const service = await createService(ctx, input);
  return ok(service, { status: 201 });
});
