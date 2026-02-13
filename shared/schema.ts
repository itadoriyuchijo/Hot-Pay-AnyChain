import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, numeric, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

/**
 * HotPay AnyChain
 * - Simple payment-link style invoices that can be paid on multiple chains/assets.
 * - MVP: merchants create invoices; payers see invoice and mark as paid; merchant can track status.
 */

export const merchants = pgTable("merchants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  websiteUrl: text("website_url"),
  contactEmail: text("contact_email"),
});

export const invoiceStatusEnum = z.enum(["draft", "unpaid", "paid", "expired", "cancelled"]);
export type InvoiceStatus = z.infer<typeof invoiceStatusEnum>;

export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  merchantId: varchar("merchant_id").notNull().references(() => merchants.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("unpaid"),

  title: text("title").notNull(),
  description: text("description"),

  currency: text("currency").notNull().default("USD"),
  amount: numeric("amount", { precision: 18, scale: 2 }).notNull(),

  memo: text("memo"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),

  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  paidAt: timestamp("paid_at"),
});

export const paymentStatusEnum = z.enum(["detected", "confirmed", "failed"]);
export type PaymentStatus = z.infer<typeof paymentStatusEnum>;

export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceId: varchar("invoice_id").notNull().references(() => invoices.id, { onDelete: "cascade" }),

  chain: text("chain").notNull(),
  assetSymbol: text("asset_symbol").notNull(),

  toAddress: text("to_address").notNull(),
  fromAddress: text("from_address"),

  amount: numeric("amount", { precision: 36, scale: 18 }).notNull(),
  txHash: text("tx_hash"),
  status: text("status").notNull().default("detected"),

  detectedAt: timestamp("detected_at").notNull().defaultNow(),
  confirmedAt: timestamp("confirmed_at"),
});

export const supportedPaymentOptions = pgTable("supported_payment_options", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  merchantId: varchar("merchant_id").notNull().references(() => merchants.id, { onDelete: "cascade" }),
  chain: text("chain").notNull(),
  assetSymbol: text("asset_symbol").notNull(),
  receiveAddress: text("receive_address").notNull(),
  enabled: boolean("enabled").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
});

// =====================
// Zod schemas (base)
// =====================

export const insertMerchantSchema = createInsertSchema(merchants).omit({ id: true });
export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
  paidAt: true,
});
export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  detectedAt: true,
  confirmedAt: true,
});
export const insertSupportedPaymentOptionSchema = createInsertSchema(supportedPaymentOptions).omit({
  id: true,
});

// =====================
// Explicit API contract types
// =====================

export type Merchant = typeof merchants.$inferSelect;
export type InsertMerchant = z.infer<typeof insertMerchantSchema>;

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;

export type SupportedPaymentOption = typeof supportedPaymentOptions.$inferSelect;
export type InsertSupportedPaymentOption = z.infer<typeof insertSupportedPaymentOptionSchema>;

// Requests
export type CreateMerchantRequest = InsertMerchant;
export type UpdateMerchantRequest = Partial<InsertMerchant>;

export type CreateInvoiceRequest = InsertInvoice;
export type UpdateInvoiceRequest = Partial<InsertInvoice>;

export type CreatePaymentRequest = InsertPayment;
export type UpdatePaymentRequest = Partial<InsertPayment>;

export type CreateSupportedPaymentOptionRequest = InsertSupportedPaymentOption;
export type UpdateSupportedPaymentOptionRequest = Partial<InsertSupportedPaymentOption>;

export type MarkInvoicePaidRequest = {
  paidAt?: string; // ISO timestamp (optional)
  paymentId?: string; // optional reference
};

// Responses
export type MerchantResponse = Merchant;
export type MerchantsListResponse = Merchant[];

export type InvoiceResponse = Invoice;
export type InvoicesListResponse = Invoice[];

export type PaymentResponse = Payment;
export type PaymentsListResponse = Payment[];

export type SupportedPaymentOptionResponse = SupportedPaymentOption;
export type SupportedPaymentOptionsListResponse = SupportedPaymentOption[];

export interface PaginatedResponse<T> {
  items: T[];
  nextCursor?: string;
  total?: number;
}
