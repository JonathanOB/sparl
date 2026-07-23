/**
 * Service management (D4 §11, D6 §10). A "service" is a household's use of a
 * provider (table: user_services). Creation goes through the create_service RPC
 * (atomic user_services + contract + renewal, §2.1). Reads/updates/deletes use
 * the RLS user client. Soft-delete on remove.
 */
import "server-only";
import { z } from "zod";
import { createUserClient } from "@/lib/supabase/server";
import { AppError, ErrorCode } from "@/lib/api/errors";
import type { UserContext } from "@/lib/auth/user-context";
import type { Tables, TablesUpdate } from "@/shared/types/database.types";

const STATUSES = ["active", "expired", "cancelled", "unknown"] as const;
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected date as YYYY-MM-DD");

export const createServiceSchema = z
  .object({
    household_id: z.string().uuid().optional(), // defaults to the active household
    provider_id: z.string().uuid().optional(),
    category_id: z.string().uuid().optional(),
    current_product_id: z.string().uuid().optional(),
    monthly_cost: z.number().nonnegative().optional(),
    annual_cost: z.number().nonnegative().optional(),
    status: z.enum(STATUSES).optional(),
    renewal_date: isoDate.optional(),
    contract_start_date: isoDate.optional(),
  })
  .strict();

export const updateServiceSchema = z
  .object({
    provider_id: z.string().uuid().nullable().optional(),
    category_id: z.string().uuid().nullable().optional(),
    current_product_id: z.string().uuid().nullable().optional(),
    monthly_cost: z.number().nonnegative().nullable().optional(),
    annual_cost: z.number().nonnegative().nullable().optional(),
    status: z.enum(STATUSES).optional(),
    renewal_date: isoDate.nullable().optional(),
  })
  .strict();

export const listServicesSchema = z.object({ household_id: z.string().uuid().optional() }).strict();

export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
export type ListServicesFilter = z.infer<typeof listServicesSchema>;

export async function listServices(filter: ListServicesFilter): Promise<Tables<"user_services">[]> {
  const supabase = await createUserClient();
  let query = supabase
    .from("user_services")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (filter.household_id) query = query.eq("household_id", filter.household_id);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getService(id: string): Promise<Tables<"user_services">> {
  const supabase = await createUserClient();
  const { data, error } = await supabase
    .from("user_services")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new AppError(ErrorCode.NOT_FOUND, "Service not found.");
  return data;
}

export async function createService(
  ctx: UserContext,
  input: CreateServiceInput
): Promise<Tables<"user_services">> {
  const householdId = input.household_id ?? ctx.activeHouseholdId;
  if (!householdId) {
    throw new AppError(ErrorCode.VALIDATION_FAILED, "No household to add this service to.");
  }
  if (!ctx.memberships.some((m) => m.householdId === householdId)) {
    throw new AppError(ErrorCode.FORBIDDEN, "You are not a member of that household.");
  }

  const supabase = await createUserClient();
  const { data: newId, error } = await supabase.rpc("create_service", {
    p_household_id: householdId,
    p_provider_id: input.provider_id,
    p_category_id: input.category_id,
    p_current_product_id: input.current_product_id,
    p_monthly_cost: input.monthly_cost,
    p_annual_cost: input.annual_cost,
    p_status: input.status,
    p_renewal_date: input.renewal_date,
    p_contract_start_date: input.contract_start_date,
  });
  if (error) throw new Error(error.message);
  return getService(newId);
}

export async function updateService(
  id: string,
  input: UpdateServiceInput
): Promise<Tables<"user_services">> {
  const supabase = await createUserClient();
  const patch: TablesUpdate<"user_services"> = { ...input };
  const { data, error } = await supabase
    .from("user_services")
    .update(patch)
    .eq("id", id)
    .is("deleted_at", null)
    .select()
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new AppError(ErrorCode.NOT_FOUND, "Service not found.");
  return data;
}

export async function deleteService(id: string): Promise<{ id: string }> {
  const supabase = await createUserClient();
  const { data, error } = await supabase
    .from("user_services")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new AppError(ErrorCode.NOT_FOUND, "Service not found.");
  return { id: data.id };
}
