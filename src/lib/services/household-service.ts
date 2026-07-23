/**
 * Household service (§2.3, D4 §8). Households are the core tenancy; access is
 * membership-scoped by RLS. Reads/updates use the RLS user client; creation goes
 * through the create_household RPC (atomic household + owner membership, since a
 * plain insert fails RLS — the creator isn't a member yet).
 */
import "server-only";
import { z } from "zod";
import { createUserClient } from "@/lib/supabase/server";
import { AppError, ErrorCode } from "@/lib/api/errors";
import type { UserContext } from "@/lib/auth/user-context";
import type { Tables, TablesUpdate } from "@/shared/types/database.types";

const PROPERTY_TYPES = ["house", "apartment", "townhouse", "other"] as const;
const OWNERSHIP_STATUSES = ["owner", "renter", "landlord", "other"] as const;

export const createHouseholdSchema = z
  .object({
    name: z.string().min(1).max(120),
    country_id: z.string().uuid().optional(),
    address_line_1: z.string().max(200).optional(),
    city: z.string().max(120).optional(),
    county: z.string().max(120).optional(),
    postal_code: z.string().max(20).optional(),
    property_type: z.enum(PROPERTY_TYPES).optional(),
    ownership_status: z.enum(OWNERSHIP_STATUSES).optional(),
  })
  .strict();

export const updateHouseholdSchema = createHouseholdSchema.partial().strict();

export type CreateHouseholdInput = z.infer<typeof createHouseholdSchema>;
export type UpdateHouseholdInput = z.infer<typeof updateHouseholdSchema>;

export async function listHouseholds(): Promise<Tables<"households">[]> {
  const supabase = await createUserClient();
  const { data, error } = await supabase
    .from("households")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getHousehold(id: string): Promise<Tables<"households">> {
  const supabase = await createUserClient();
  const { data, error } = await supabase
    .from("households")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new AppError(ErrorCode.NOT_FOUND, "Household not found.");
  return data;
}

export async function getCurrentHousehold(ctx: UserContext): Promise<Tables<"households"> | null> {
  if (!ctx.activeHouseholdId) return null;
  return getHousehold(ctx.activeHouseholdId);
}

export async function createHousehold(input: CreateHouseholdInput): Promise<Tables<"households">> {
  const supabase = await createUserClient();
  const { data: newId, error } = await supabase.rpc("create_household", {
    p_name: input.name,
    p_country_id: input.country_id,
    p_address_line_1: input.address_line_1,
    p_city: input.city,
    p_county: input.county,
    p_postal_code: input.postal_code,
    p_property_type: input.property_type,
    p_ownership_status: input.ownership_status,
  });
  if (error) throw new Error(error.message);
  return getHousehold(newId);
}

export async function updateHousehold(
  ctx: UserContext,
  id: string,
  input: UpdateHouseholdInput
): Promise<Tables<"households">> {
  const membership = ctx.memberships.find((m) => m.householdId === id);
  if (!membership) throw new AppError(ErrorCode.NOT_FOUND, "Household not found.");
  if (membership.role !== "owner" && membership.role !== "admin") {
    throw new AppError(ErrorCode.FORBIDDEN, "You cannot modify this household.");
  }

  const supabase = await createUserClient();
  const patch: TablesUpdate<"households"> = { ...input };
  const { data, error } = await supabase
    .from("households")
    .update(patch)
    .eq("id", id)
    .is("deleted_at", null)
    .select()
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new AppError(ErrorCode.NOT_FOUND, "Household not found.");
  return data;
}
