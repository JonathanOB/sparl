/**
 * GET /api/v1/households/current — the caller's active household (§2.4), or null.
 */
import { authed } from "@/lib/api/authed";
import { ok } from "@/lib/api/envelope";
import { getCurrentHousehold } from "@/lib/services/household-service";

export const dynamic = "force-dynamic";

export const GET = authed(async ({ ctx }) => {
  return ok(await getCurrentHousehold(ctx));
});
