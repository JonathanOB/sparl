/**
 * GET /api/v1/categories — provider categories (public reference data).
 */
import { authed } from "@/lib/api/authed";
import { ok } from "@/lib/api/envelope";
import { listCategories } from "@/lib/services/provider-service";

export const dynamic = "force-dynamic";

export const GET = authed(async () => {
  return ok(await listCategories());
});
