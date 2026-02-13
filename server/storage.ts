import { db } from "./db";
import {
  merchants,
  supportedPaymentOptions,
  invoices,
  payments,
  type MerchantResponse,
  type MerchantsListResponse,
  type CreateMerchantRequest,
  type UpdateMerchantRequest,
  type SupportedPaymentOptionResponse,
  type SupportedPaymentOptionsListResponse,
  type CreateSupportedPaymentOptionRequest,
  type UpdateSupportedPaymentOptionRequest,
  type InvoiceResponse,
  type InvoicesListResponse,
  type CreateInvoiceRequest,
  type UpdateInvoiceRequest,
  type PaymentResponse,
  type PaymentsListResponse,
  type CreatePaymentRequest,
} from "@shared/schema";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";

export interface IStorage {
  // Merchants
  getMerchants(): Promise<MerchantsListResponse>;
  getMerchant(id: string): Promise<MerchantResponse | undefined>;
  createMerchant(input: CreateMerchantRequest): Promise<MerchantResponse>;
  updateMerchant(
    id: string,
    updates: UpdateMerchantRequest,
  ): Promise<MerchantResponse | undefined>;
  deleteMerchant(id: string): Promise<boolean>;

  // Payment options
  getPaymentOptions(
    merchantId?: string,
  ): Promise<SupportedPaymentOptionsListResponse>;
  createPaymentOption(
    input: CreateSupportedPaymentOptionRequest,
  ): Promise<SupportedPaymentOptionResponse>;
  updatePaymentOption(
    id: string,
    updates: UpdateSupportedPaymentOptionRequest,
  ): Promise<SupportedPaymentOptionResponse | undefined>;
  deletePaymentOption(id: string): Promise<boolean>;

  // Invoices
  getInvoices(filters?: {
    merchantId?: string;
    status?: string;
    q?: string;
  }): Promise<InvoicesListResponse>;
  getInvoice(id: string): Promise<InvoiceResponse | undefined>;
  createInvoice(input: CreateInvoiceRequest): Promise<InvoiceResponse>;
  updateInvoice(
    id: string,
    updates: UpdateInvoiceRequest,
  ): Promise<InvoiceResponse | undefined>;
  deleteInvoice(id: string): Promise<boolean>;
  markInvoicePaid(
    id: string,
    paidAt?: Date,
  ): Promise<InvoiceResponse | undefined>;

  // Payments
  getPayments(invoiceId?: string): Promise<PaymentsListResponse>;
  createPayment(input: CreatePaymentRequest): Promise<PaymentResponse>;
}

export class DatabaseStorage implements IStorage {
  // Merchants
  async getMerchants(): Promise<MerchantsListResponse> {
    return await db.select().from(merchants).orderBy(merchants.name);
  }

  async getMerchant(id: string): Promise<MerchantResponse | undefined> {
    const [row] = await db.select().from(merchants).where(eq(merchants.id, id));
    return row;
  }

  async createMerchant(input: CreateMerchantRequest): Promise<MerchantResponse> {
    const [created] = await db.insert(merchants).values(input).returning();
    return created;
  }

  async updateMerchant(
    id: string,
    updates: UpdateMerchantRequest,
  ): Promise<MerchantResponse | undefined> {
    const [updated] = await db
      .update(merchants)
      .set(updates)
      .where(eq(merchants.id, id))
      .returning();
    return updated;
  }

  async deleteMerchant(id: string): Promise<boolean> {
    const [deleted] = await db
      .delete(merchants)
      .where(eq(merchants.id, id))
      .returning({ id: merchants.id });
    return Boolean(deleted);
  }

  // Payment options
  async getPaymentOptions(
    merchantId?: string,
  ): Promise<SupportedPaymentOptionsListResponse> {
    const where = merchantId
      ? eq(supportedPaymentOptions.merchantId, merchantId)
      : undefined;

    const rows = await db
      .select()
      .from(supportedPaymentOptions)
      .where(where)
      .orderBy(
        supportedPaymentOptions.sortOrder,
        supportedPaymentOptions.chain,
        supportedPaymentOptions.assetSymbol,
      );
    return rows;
  }

  async createPaymentOption(
    input: CreateSupportedPaymentOptionRequest,
  ): Promise<SupportedPaymentOptionResponse> {
    const [created] = await db
      .insert(supportedPaymentOptions)
      .values(input)
      .returning();
    return created;
  }

  async updatePaymentOption(
    id: string,
    updates: UpdateSupportedPaymentOptionRequest,
  ): Promise<SupportedPaymentOptionResponse | undefined> {
    const [updated] = await db
      .update(supportedPaymentOptions)
      .set(updates)
      .where(eq(supportedPaymentOptions.id, id))
      .returning();
    return updated;
  }

  async deletePaymentOption(id: string): Promise<boolean> {
    const [deleted] = await db
      .delete(supportedPaymentOptions)
      .where(eq(supportedPaymentOptions.id, id))
      .returning({ id: supportedPaymentOptions.id });
    return Boolean(deleted);
  }

  // Invoices
  async getInvoices(filters?: {
    merchantId?: string;
    status?: string;
    q?: string;
  }): Promise<InvoicesListResponse> {
    const whereParts = [] as Array<ReturnType<typeof eq>>;

    if (filters?.merchantId) {
      whereParts.push(eq(invoices.merchantId, filters.merchantId) as any);
    }
    if (filters?.status) {
      whereParts.push(eq(invoices.status, filters.status) as any);
    }
    if (filters?.q) {
      const q = `%${filters.q}%`;
      whereParts.push(
        or(ilike(invoices.title, q), ilike(sql`${invoices.description}`, q)) as any,
      );
    }

    const where = whereParts.length ? and(...(whereParts as any)) : undefined;

    const rows = await db
      .select()
      .from(invoices)
      .where(where)
      .orderBy(desc(invoices.createdAt));

    return rows;
  }

  async getInvoice(id: string): Promise<InvoiceResponse | undefined> {
    const [row] = await db.select().from(invoices).where(eq(invoices.id, id));
    return row;
  }

  async createInvoice(input: CreateInvoiceRequest): Promise<InvoiceResponse> {
    const [created] = await db.insert(invoices).values(input).returning();
    return created;
  }

  async updateInvoice(
    id: string,
    updates: UpdateInvoiceRequest,
  ): Promise<InvoiceResponse | undefined> {
    const [updated] = await db
      .update(invoices)
      .set(updates)
      .where(eq(invoices.id, id))
      .returning();
    return updated;
  }

  async deleteInvoice(id: string): Promise<boolean> {
    const [deleted] = await db
      .delete(invoices)
      .where(eq(invoices.id, id))
      .returning({ id: invoices.id });
    return Boolean(deleted);
  }

  async markInvoicePaid(
    id: string,
    paidAt?: Date,
  ): Promise<InvoiceResponse | undefined> {
    const [updated] = await db
      .update(invoices)
      .set({
        status: "paid",
        paidAt: paidAt ?? new Date(),
      })
      .where(eq(invoices.id, id))
      .returning();
    return updated;
  }

  // Payments
  async getPayments(invoiceId?: string): Promise<PaymentsListResponse> {
    const where = invoiceId ? eq(payments.invoiceId, invoiceId) : undefined;
    const rows = await db
      .select()
      .from(payments)
      .where(where)
      .orderBy(desc(payments.detectedAt));
    return rows;
  }

  async createPayment(input: CreatePaymentRequest): Promise<PaymentResponse> {
    const invoice = await this.getInvoice(input.invoiceId);
    if (!invoice) {
      throw new Error("INVOICE_NOT_FOUND");
    }

    const [created] = await db.insert(payments).values(input).returning();
    return created;
  }
}

export const storage = new DatabaseStorage();
