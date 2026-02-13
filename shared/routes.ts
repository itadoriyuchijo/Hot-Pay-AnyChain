import { z } from "zod";
import {
  insertMerchantSchema,
  insertInvoiceSchema,
  insertPaymentSchema,
  insertSupportedPaymentOptionSchema,
  merchants,
  invoices,
  payments,
  supportedPaymentOptions,
} from "./schema";

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

const idParam = z.object({ id: z.string().min(1) });

export const api = {
  merchants: {
    list: {
      method: "GET" as const,
      path: "/api/merchants" as const,
      responses: {
        200: z.array(z.custom<typeof merchants.$inferSelect>()),
      },
    },
    get: {
      method: "GET" as const,
      path: "/api/merchants/:id" as const,
      responses: {
        200: z.custom<typeof merchants.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/merchants" as const,
      input: insertMerchantSchema,
      responses: {
        201: z.custom<typeof merchants.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: "PATCH" as const,
      path: "/api/merchants/:id" as const,
      input: insertMerchantSchema.partial(),
      responses: {
        200: z.custom<typeof merchants.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: "DELETE" as const,
      path: "/api/merchants/:id" as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },

  invoices: {
    list: {
      method: "GET" as const,
      path: "/api/invoices" as const,
      input: z
        .object({
          merchantId: z.string().optional(),
          status: z.string().optional(),
          q: z.string().optional(),
        })
        .optional(),
      responses: {
        200: z.array(z.custom<typeof invoices.$inferSelect>()),
      },
    },
    get: {
      method: "GET" as const,
      path: "/api/invoices/:id" as const,
      responses: {
        200: z.custom<typeof invoices.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/invoices" as const,
      input: insertInvoiceSchema,
      responses: {
        201: z.custom<typeof invoices.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: "PATCH" as const,
      path: "/api/invoices/:id" as const,
      input: insertInvoiceSchema.partial(),
      responses: {
        200: z.custom<typeof invoices.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    markPaid: {
      method: "POST" as const,
      path: "/api/invoices/:id/mark-paid" as const,
      input: z
        .object({
          paidAt: z.string().datetime().optional(),
          paymentId: z.string().optional(),
        })
        .optional(),
      responses: {
        200: z.custom<typeof invoices.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: "DELETE" as const,
      path: "/api/invoices/:id" as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },

  payments: {
    list: {
      method: "GET" as const,
      path: "/api/payments" as const,
      input: z
        .object({
          invoiceId: z.string().optional(),
        })
        .optional(),
      responses: {
        200: z.array(z.custom<typeof payments.$inferSelect>()),
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/payments" as const,
      input: insertPaymentSchema,
      responses: {
        201: z.custom<typeof payments.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
  },

  paymentOptions: {
    list: {
      method: "GET" as const,
      path: "/api/payment-options" as const,
      input: z
        .object({
          merchantId: z.string().optional(),
        })
        .optional(),
      responses: {
        200: z.array(z.custom<typeof supportedPaymentOptions.$inferSelect>()),
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/payment-options" as const,
      input: insertSupportedPaymentOptionSchema,
      responses: {
        201: z.custom<typeof supportedPaymentOptions.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: "PATCH" as const,
      path: "/api/payment-options/:id" as const,
      input: insertSupportedPaymentOptionSchema.partial(),
      responses: {
        200: z.custom<typeof supportedPaymentOptions.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: "DELETE" as const,
      path: "/api/payment-options/:id" as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
} as const;

export function buildUrl(
  path: string,
  params?: Record<string, string | number>
): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export const paramsSchemas = {
  id: idParam,
};

export type MerchantInput = z.infer<typeof api.merchants.create.input>;
export type MerchantResponse = z.infer<typeof api.merchants.create.responses[201]>;
export type MerchantsListResponse = z.infer<typeof api.merchants.list.responses[200]>;

export type InvoiceInput = z.infer<typeof api.invoices.create.input>;
export type InvoiceUpdateInput = z.infer<typeof api.invoices.update.input>;
export type InvoiceResponse = z.infer<typeof api.invoices.create.responses[201]>;
export type InvoicesListResponse = z.infer<typeof api.invoices.list.responses[200]>;

export type PaymentInput = z.infer<typeof api.payments.create.input>;
export type PaymentResponse = z.infer<typeof api.payments.create.responses[201]>;
export type PaymentsListResponse = z.infer<typeof api.payments.list.responses[200]>;

export type PaymentOptionInput = z.infer<typeof api.paymentOptions.create.input>;
export type PaymentOptionResponse = z.infer<typeof api.paymentOptions.create.responses[201]>;
export type PaymentOptionsListResponse = z.infer<typeof api.paymentOptions.list.responses[200]>;

export type ValidationError = z.infer<typeof errorSchemas.validation>;
export type NotFoundError = z.infer<typeof errorSchemas.notFound>;
export type InternalError = z.infer<typeof errorSchemas.internal>;
