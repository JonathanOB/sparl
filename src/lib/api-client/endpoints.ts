/**
 * Typed endpoint functions over the shared client. Frontend hooks call these;
 * they never build URLs or parse envelopes themselves.
 */
import { apiClient } from "./fetcher";
import type { Tables } from "@/shared/types/database.types";
// import type only — these are Zod-inferred input types; the runtime (server-only) is erased.
import type { UpdateMeInput } from "@/lib/services/user-service";
import type {
  CreateHouseholdInput,
  UpdateHouseholdInput,
} from "@/lib/services/household-service";
import type {
  CreateServiceInput,
  UpdateServiceInput,
} from "@/lib/services/service-management";

function qs(params?: Record<string, string | undefined>): string {
  if (!params) return "";
  const entries = Object.entries(params).filter(([, v]) => v != null && v !== "");
  return entries.length
    ? `?${new URLSearchParams(Object.fromEntries(entries) as Record<string, string>).toString()}`
    : "";
}

export const usersApi = {
  me: () => apiClient.get<Tables<"users">>("/users/me"),
  updateMe: (input: UpdateMeInput) => apiClient.patch<Tables<"users">>("/users/me", input),
};

export const householdsApi = {
  list: () => apiClient.get<Tables<"households">[]>("/households"),
  current: () => apiClient.get<Tables<"households"> | null>("/households/current"),
  get: (id: string) => apiClient.get<Tables<"households">>(`/households/${id}`),
  create: (input: CreateHouseholdInput) => apiClient.post<Tables<"households">>("/households", input),
  update: (id: string, input: UpdateHouseholdInput) =>
    apiClient.patch<Tables<"households">>(`/households/${id}`, input),
};

export const providersApi = {
  list: (filter?: { country_id?: string; category_id?: string }) =>
    apiClient.get<Tables<"providers">[]>(`/providers${qs(filter)}`),
  get: (id: string) => apiClient.get<Tables<"providers">>(`/providers/${id}`),
  products: (id: string) => apiClient.get<Tables<"provider_products">[]>(`/providers/${id}/products`),
};

export const servicesApi = {
  list: (filter?: { household_id?: string }) =>
    apiClient.get<Tables<"user_services">[]>(`/services${qs(filter)}`),
  get: (id: string) => apiClient.get<Tables<"user_services">>(`/services/${id}`),
  create: (input: CreateServiceInput) => apiClient.post<Tables<"user_services">>("/services", input),
  update: (id: string, input: UpdateServiceInput) =>
    apiClient.patch<Tables<"user_services">>(`/services/${id}`, input),
  remove: (id: string) => apiClient.del<{ id: string }>(`/services/${id}`),
};
