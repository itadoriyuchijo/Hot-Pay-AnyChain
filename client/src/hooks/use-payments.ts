import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import type { CreatePaymentRequest } from "@shared/schema";
import { z } from "zod";

function parseWithLogging<T>(schema: z.ZodSchema<T>, data: unknown, label: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error(`[Zod] ${label} validation failed:`, result.error.format());
    throw result.error;
  }
  return result.data;
}

export function usePayments(invoiceId?: string) {
  return useQuery({
    queryKey: [api.payments.list.path, { invoiceId: invoiceId ?? "" }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (invoiceId) params.set("invoiceId", invoiceId);
      const url = params.toString()
        ? `${api.payments.list.path}?${params.toString()}`
        : api.payments.list.path;

      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch payments");
      return parseWithLogging(api.payments.list.responses[200], await res.json(), "payments.list");
    },
  });
}

export function useCreatePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreatePaymentRequest) => {
      const validated = api.payments.create.input.parse(data);
      const res = await fetch(api.payments.create.path, {
        method: api.payments.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 400) {
          const err = parseWithLogging(api.payments.create.responses[400], await res.json(), "payments.create.400");
          throw new Error(err.message);
        }
        if (res.status === 404) {
          const err = parseWithLogging(api.payments.create.responses[404], await res.json(), "payments.create.404");
          throw new Error(err.message);
        }
        throw new Error("Failed to create payment");
      }
      return parseWithLogging(api.payments.create.responses[201], await res.json(), "payments.create.201");
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: [api.payments.list.path] });
      qc.invalidateQueries({ queryKey: [api.invoices.get.path, vars.invoiceId] });
      qc.invalidateQueries({ queryKey: [api.invoices.list.path] });
    },
  });
}
