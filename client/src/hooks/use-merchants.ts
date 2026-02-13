import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type {
  CreateMerchantRequest,
  UpdateMerchantRequest,
} from "@shared/schema";
import { z } from "zod";

function parseWithLogging<T>(schema: z.ZodSchema<T>, data: unknown, label: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error(`[Zod] ${label} validation failed:`, result.error.format());
    throw result.error;
  }
  return result.data;
}

export function useMerchants() {
  return useQuery({
    queryKey: [api.merchants.list.path],
    queryFn: async () => {
      const res = await fetch(api.merchants.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch merchants");
      const json = await res.json();
      return parseWithLogging(api.merchants.list.responses[200], json, "merchants.list");
    },
  });
}

export function useMerchant(id?: string) {
  return useQuery({
    queryKey: [api.merchants.get.path, id ?? ""],
    enabled: !!id,
    queryFn: async () => {
      const url = buildUrl(api.merchants.get.path, { id: id as string });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch merchant");
      return parseWithLogging(api.merchants.get.responses[200], await res.json(), "merchants.get");
    },
  });
}

export function useCreateMerchant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateMerchantRequest) => {
      const validated = api.merchants.create.input.parse(data);
      const res = await fetch(api.merchants.create.path, {
        method: api.merchants.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 400) {
          const err = parseWithLogging(api.merchants.create.responses[400], await res.json(), "merchants.create.400");
          throw new Error(err.message);
        }
        throw new Error("Failed to create merchant");
      }
      return parseWithLogging(api.merchants.create.responses[201], await res.json(), "merchants.create.201");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [api.merchants.list.path] });
    },
  });
}

export function useUpdateMerchant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateMerchantRequest }) => {
      const validated = api.merchants.update.input.parse(updates);
      const url = buildUrl(api.merchants.update.path, { id });
      const res = await fetch(url, {
        method: api.merchants.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 400) {
          const err = parseWithLogging(api.merchants.update.responses[400], await res.json(), "merchants.update.400");
          throw new Error(err.message);
        }
        if (res.status === 404) {
          const err = parseWithLogging(api.merchants.update.responses[404], await res.json(), "merchants.update.404");
          throw new Error(err.message);
        }
        throw new Error("Failed to update merchant");
      }
      return parseWithLogging(api.merchants.update.responses[200], await res.json(), "merchants.update.200");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [api.merchants.list.path] });
    },
  });
}

export function useDeleteMerchant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const url = buildUrl(api.merchants.delete.path, { id });
      const res = await fetch(url, {
        method: api.merchants.delete.method,
        credentials: "include",
      });
      if (!res.ok) {
        if (res.status === 404) {
          const err = parseWithLogging(api.merchants.delete.responses[404], await res.json(), "merchants.delete.404");
          throw new Error(err.message);
        }
        throw new Error("Failed to delete merchant");
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [api.merchants.list.path] });
      qc.invalidateQueries({ queryKey: [api.invoices.list.path] });
      qc.invalidateQueries({ queryKey: [api.paymentOptions.list.path] });
    },
  });
}
