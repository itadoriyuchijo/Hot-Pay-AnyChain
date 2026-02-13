import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type {
  CreateSupportedPaymentOptionRequest,
  UpdateSupportedPaymentOptionRequest,
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

export function usePaymentOptions(merchantId?: string) {
  return useQuery({
    queryKey: [api.paymentOptions.list.path, { merchantId: merchantId ?? "" }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (merchantId) params.set("merchantId", merchantId);
      const url = params.toString()
        ? `${api.paymentOptions.list.path}?${params.toString()}`
        : api.paymentOptions.list.path;

      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch payment options");
      return parseWithLogging(api.paymentOptions.list.responses[200], await res.json(), "paymentOptions.list");
    },
  });
}

export function useCreatePaymentOption() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateSupportedPaymentOptionRequest) => {
      const validated = api.paymentOptions.create.input.parse(data);
      const res = await fetch(api.paymentOptions.create.path, {
        method: api.paymentOptions.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) {
        if (res.status === 400) {
          const err = parseWithLogging(api.paymentOptions.create.responses[400], await res.json(), "paymentOptions.create.400");
          throw new Error(err.message);
        }
        throw new Error("Failed to create payment option");
      }
      return parseWithLogging(api.paymentOptions.create.responses[201], await res.json(), "paymentOptions.create.201");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [api.paymentOptions.list.path] });
    },
  });
}

export function useUpdatePaymentOption() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateSupportedPaymentOptionRequest }) => {
      const validated = api.paymentOptions.update.input.parse(updates);
      const url = buildUrl(api.paymentOptions.update.path, { id });
      const res = await fetch(url, {
        method: api.paymentOptions.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 400) {
          const err = parseWithLogging(api.paymentOptions.update.responses[400], await res.json(), "paymentOptions.update.400");
          throw new Error(err.message);
        }
        if (res.status === 404) {
          const err = parseWithLogging(api.paymentOptions.update.responses[404], await res.json(), "paymentOptions.update.404");
          throw new Error(err.message);
        }
        throw new Error("Failed to update payment option");
      }
      return parseWithLogging(api.paymentOptions.update.responses[200], await res.json(), "paymentOptions.update.200");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [api.paymentOptions.list.path] });
    },
  });
}

export function useDeletePaymentOption() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const url = buildUrl(api.paymentOptions.delete.path, { id });
      const res = await fetch(url, { method: api.paymentOptions.delete.method, credentials: "include" });
      if (!res.ok) {
        if (res.status === 404) {
          const err = parseWithLogging(api.paymentOptions.delete.responses[404], await res.json(), "paymentOptions.delete.404");
          throw new Error(err.message);
        }
        throw new Error("Failed to delete payment option");
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [api.paymentOptions.list.path] });
    },
  });
}
