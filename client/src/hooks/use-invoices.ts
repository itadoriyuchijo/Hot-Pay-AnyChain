import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type {
  CreateInvoiceRequest,
  UpdateInvoiceRequest,
  MarkInvoicePaidRequest,
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

export type InvoicesListFilters = {
  merchantId?: string;
  status?: string;
  q?: string;
};

export function useInvoices(filters?: InvoicesListFilters) {
  return useQuery({
    queryKey: [api.invoices.list.path, filters ?? {}],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.merchantId) params.set("merchantId", filters.merchantId);
      if (filters?.status) params.set("status", filters.status);
      if (filters?.q) params.set("q", filters.q);

      const url = params.toString()
        ? `${api.invoices.list.path}?${params.toString()}`
        : api.invoices.list.path;

      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch invoices");
      return parseWithLogging(api.invoices.list.responses[200], await res.json(), "invoices.list");
    },
  });
}

export function useInvoice(id?: string) {
  return useQuery({
    queryKey: [api.invoices.get.path, id ?? ""],
    enabled: !!id,
    queryFn: async () => {
      const url = buildUrl(api.invoices.get.path, { id: id as string });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch invoice");
      return parseWithLogging(api.invoices.get.responses[200], await res.json(), "invoices.get");
    },
  });
}

export function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateInvoiceRequest) => {
      const validated = api.invoices.create.input.parse(data);
      const res = await fetch(api.invoices.create.path, {
        method: api.invoices.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) {
        if (res.status === 400) {
          const err = parseWithLogging(api.invoices.create.responses[400], await res.json(), "invoices.create.400");
          throw new Error(err.message);
        }
        throw new Error("Failed to create invoice");
      }
      return parseWithLogging(api.invoices.create.responses[201], await res.json(), "invoices.create.201");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [api.invoices.list.path] });
    },
  });
}

export function useUpdateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateInvoiceRequest }) => {
      const validated = api.invoices.update.input.parse(updates);
      const url = buildUrl(api.invoices.update.path, { id });
      const res = await fetch(url, {
        method: api.invoices.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 400) {
          const err = parseWithLogging(api.invoices.update.responses[400], await res.json(), "invoices.update.400");
          throw new Error(err.message);
        }
        if (res.status === 404) {
          const err = parseWithLogging(api.invoices.update.responses[404], await res.json(), "invoices.update.404");
          throw new Error(err.message);
        }
        throw new Error("Failed to update invoice");
      }
      return parseWithLogging(api.invoices.update.responses[200], await res.json(), "invoices.update.200");
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: [api.invoices.list.path] });
      qc.invalidateQueries({ queryKey: [api.invoices.get.path, vars.id] });
    },
  });
}

export function useMarkInvoicePaid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, body }: { id: string; body?: MarkInvoicePaidRequest }) => {
      const validated = api.invoices.markPaid.input.parse(body);
      const url = buildUrl(api.invoices.markPaid.path, { id });
      const res = await fetch(url, {
        method: api.invoices.markPaid.method,
        headers: { "Content-Type": "application/json" },
        body: validated ? JSON.stringify(validated) : undefined,
        credentials: "include",
      });
      if (!res.ok) {
        if (res.status === 404) {
          const err = parseWithLogging(api.invoices.markPaid.responses[404], await res.json(), "invoices.markPaid.404");
          throw new Error(err.message);
        }
        throw new Error("Failed to mark invoice paid");
      }
      return parseWithLogging(api.invoices.markPaid.responses[200], await res.json(), "invoices.markPaid.200");
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: [api.invoices.list.path] });
      qc.invalidateQueries({ queryKey: [api.invoices.get.path, vars.id] });
      qc.invalidateQueries({ queryKey: [api.payments.list.path] });
    },
  });
}

export function useDeleteInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const url = buildUrl(api.invoices.delete.path, { id });
      const res = await fetch(url, { method: api.invoices.delete.method, credentials: "include" });
      if (!res.ok) {
        if (res.status === 404) {
          const err = parseWithLogging(api.invoices.delete.responses[404], await res.json(), "invoices.delete.404");
          throw new Error(err.message);
        }
        throw new Error("Failed to delete invoice");
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [api.invoices.list.path] });
      qc.invalidateQueries({ queryKey: [api.payments.list.path] });
    },
  });
}
