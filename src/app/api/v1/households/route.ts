/**
 * GET  /api/v1/households — list the caller's households.
 * POST /api/v1/households — create a household (creator becomes owner).
 */
import { authed } from "@/lib/api/authed";
import { ok } from "@/lib/api/envelope";
import { parseJson } from "@/lib/api/validation";
import {
  createHousehold,
  createHouseholdSchema,
  listHouseholds,
} from "@/lib/services/household-service";

export const dynamic = "force-dynamic";

export const GET = authed(async () => {
  return ok(await listHouseholds());
});

export const POST = authed(async ({ req }) => {
  const input = await parseJson(req, createHouseholdSchema);
  const household = await createHousehold(input);
  return ok(household, { status: 201 });
});
