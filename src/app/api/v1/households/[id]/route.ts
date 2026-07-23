/**
 * GET   /api/v1/households/{id} — a household the caller belongs to.
 * PATCH /api/v1/households/{id} — update it (owner/admin only).
 */
import { authed } from "@/lib/api/authed";
import { ok } from "@/lib/api/envelope";
import { parseJson, requireUuidParam } from "@/lib/api/validation";
import {
  getHousehold,
  updateHousehold,
  updateHouseholdSchema,
} from "@/lib/services/household-service";

export const dynamic = "force-dynamic";

export const GET = authed(async ({ params }) => {
  const id = requireUuidParam(params.id);
  return ok(await getHousehold(id));
});

export const PATCH = authed(async ({ ctx, req, params }) => {
  const id = requireUuidParam(params.id);
  const input = await parseJson(req, updateHouseholdSchema);
  return ok(await updateHousehold(ctx, id, input));
});
