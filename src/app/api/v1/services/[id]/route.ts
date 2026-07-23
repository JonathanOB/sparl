/**
 * GET    /api/v1/services/{id} — a service.
 * PATCH  /api/v1/services/{id} — update it.
 * DELETE /api/v1/services/{id} — soft-delete it.
 */
import { authed } from "@/lib/api/authed";
import { ok } from "@/lib/api/envelope";
import { parseJson, requireUuidParam } from "@/lib/api/validation";
import {
  deleteService,
  getService,
  updateService,
  updateServiceSchema,
} from "@/lib/services/service-management";

export const dynamic = "force-dynamic";

export const GET = authed(async ({ params }) => {
  const id = requireUuidParam(params.id);
  return ok(await getService(id));
});

export const PATCH = authed(async ({ req, params }) => {
  const id = requireUuidParam(params.id);
  const input = await parseJson(req, updateServiceSchema);
  return ok(await updateService(id, input));
});

export const DELETE = authed(async ({ params }) => {
  const id = requireUuidParam(params.id);
  return ok(await deleteService(id));
});
