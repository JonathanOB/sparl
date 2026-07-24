"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  categoriesApi,
  documentsApi,
  householdsApi,
  notificationsApi,
  providersApi,
  recommendationsApi,
  servicesApi,
  usersApi,
} from "@/lib/api-client/endpoints";
import type { UpdateMeInput } from "@/lib/services/user-service";
import type {
  CreateHouseholdInput,
  UpdateHouseholdInput,
} from "@/lib/services/household-service";
import type {
  CreateServiceInput,
  UpdateServiceInput,
} from "@/lib/services/service-management";

export const queryKeys = {
  me: ["me"] as const,
  households: ["households"] as const,
  currentHousehold: ["households", "current"] as const,
  household: (id: string) => ["households", id] as const,
  providers: (filter?: { country_id?: string; category_id?: string }) =>
    ["providers", filter ?? {}] as const,
  providerProducts: (id: string) => ["providers", id, "products"] as const,
  services: (householdId?: string) =>
    householdId ? (["services", householdId] as const) : (["services"] as const),
  service: (id: string) => ["services", id] as const,
  categories: ["categories"] as const,
  documents: ["documents"] as const,
  recommendations: ["recommendations"] as const,
  notifications: ["notifications"] as const,
};

export function useNotifications() {
  return useQuery({
    queryKey: queryKeys.notifications,
    queryFn: notificationsApi.list,
    refetchInterval: 60_000,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.read(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.notifications }),
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.readAll(),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.notifications }),
  });
}

export function useRecommendations() {
  return useQuery({ queryKey: queryKeys.recommendations, queryFn: recommendationsApi.list });
}

export function useGenerateRecommendations() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => recommendationsApi.generate(),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.recommendations }),
  });
}

export function useAcceptRecommendation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => recommendationsApi.accept(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.recommendations }),
  });
}

export function useRejectRecommendation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason, note }: { id: string; reason?: string; note?: string }) =>
      recommendationsApi.reject(id, { reason, note }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.recommendations }),
  });
}

export function useCategories() {
  return useQuery({ queryKey: queryKeys.categories, queryFn: categoriesApi.list });
}

export function useDocuments() {
  return useQuery({
    queryKey: queryKeys.documents,
    queryFn: documentsApi.list,
    // poll while any document is still processing
    refetchInterval: (query) =>
      query.state.data?.some((d) => d.processing_status === "processing") ? 4000 : false,
  });
}

export function useUploadDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ file, documentType }: { file: File; documentType?: string }) =>
      documentsApi.upload(file, documentType),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.documents }),
  });
}

export function useMe() {
  return useQuery({ queryKey: queryKeys.me, queryFn: usersApi.me });
}

export function useUpdateMe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateMeInput) => usersApi.updateMe(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.me }),
  });
}

export function useHouseholds() {
  return useQuery({ queryKey: queryKeys.households, queryFn: householdsApi.list });
}

export function useCurrentHousehold() {
  return useQuery({ queryKey: queryKeys.currentHousehold, queryFn: householdsApi.current });
}

export function useCreateHousehold() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateHouseholdInput) => householdsApi.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.households }),
  });
}

export function useUpdateHousehold(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateHouseholdInput) => householdsApi.update(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.households });
      qc.invalidateQueries({ queryKey: queryKeys.household(id) });
    },
  });
}

export function useProviders(filter?: { country_id?: string; category_id?: string }) {
  return useQuery({
    queryKey: queryKeys.providers(filter),
    queryFn: () => providersApi.list(filter),
  });
}

export function useProviderProducts(id: string) {
  return useQuery({
    queryKey: queryKeys.providerProducts(id),
    queryFn: () => providersApi.products(id),
    enabled: Boolean(id),
  });
}

export function useServices(householdId?: string) {
  return useQuery({
    queryKey: queryKeys.services(householdId),
    queryFn: () => servicesApi.list(householdId ? { household_id: householdId } : undefined),
  });
}

export function useCreateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateServiceInput) => servicesApi.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["services"] }),
  });
}

export function useUpdateService(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateServiceInput) => servicesApi.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["services"] }),
  });
}

export function useDeleteService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => servicesApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["services"] }),
  });
}
