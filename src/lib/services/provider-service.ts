/**
 * Provider read service (D4 §14). Provider intelligence is public read-only
 * (RLS `using(true)`). Filters honour country_id + category_id (§2.1).
 */
import "server-only";
import { z } from "zod";
import { createUserClient } from "@/lib/supabase/server";
import { AppError, ErrorCode } from "@/lib/api/errors";
import type { Tables } from "@/shared/types/database.types";

export const providerFilterSchema = z
  .object({
    country_id: z.uuid().optional(),
    category_id: z.uuid().optional(),
  })
  .strict();

export type ProviderFilter = z.infer<typeof providerFilterSchema>;

export async function listProviders(filter: ProviderFilter): Promise<Tables<"providers">[]> {
  const supabase = await createUserClient();
  let query = supabase
    .from("providers")
    .select("*")
    .is("deleted_at", null)
    .eq("active", true)
    .order("name", { ascending: true });
  if (filter.country_id) query = query.eq("country_id", filter.country_id);
  if (filter.category_id) query = query.eq("category_id", filter.category_id);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getProvider(id: string): Promise<Tables<"providers">> {
  const supabase = await createUserClient();
  const { data, error } = await supabase
    .from("providers")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new AppError(ErrorCode.NOT_FOUND, "Provider not found.");
  return data;
}

export async function listCategories(): Promise<Tables<"provider_categories">[]> {
  const supabase = await createUserClient();
  const { data, error } = await supabase
    .from("provider_categories")
    .select("*")
    .is("deleted_at", null)
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function listProviderProducts(
  providerId: string
): Promise<Tables<"provider_products">[]> {
  const supabase = await createUserClient();
  const { data, error } = await supabase
    .from("provider_products")
    .select("*")
    .eq("provider_id", providerId)
    .is("deleted_at", null)
    .eq("active", true)
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}
