import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

async function seedDatabase() {
  const existingMerchants = await storage.getMerchants();
  if (existingMerchants.length > 0) return;

  const merchant = await storage.createMerchant({
    name: "HotPay Demo Store",
    websiteUrl: "https://hotpay.example",
    contactEmail: "billing@hotpay.example",
  });

  await storage.createPaymentOption({
    merchantId: merchant.id,
    chain: "Ethereum",
    assetSymbol: "USDC",
    receiveAddress: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    enabled: true,
    sortOrder: 1,
  });

  await storage.createPaymentOption({
    merchantId: merchant.id,
    chain: "Solana",
    assetSymbol: "USDC",
    receiveAddress: "9xQeWvG816bUx9EPf8Q7zv1QH3pE6GmYcRUpZJ2xvYp",
    enabled: true,
    sortOrder: 2,
  });

  await storage.createPaymentOption({
    merchantId: merchant.id,
    chain: "Polygon",
    assetSymbol: "USDT",
    receiveAddress: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
    enabled: true,
    sortOrder: 3,
  });

  await storage.createInvoice({
    merchantId: merchant.id,
    status: "unpaid",
    title: "Order #1042",
    description: "Premium subscription (monthly) - AnyChain checkout",
    currency: "USD",
    amount: "49.00" as any,
    memo: "SUB-1042",
    metadata: { customer: "Acme Co" },
    expiresAt: null as any,
  });

  await storage.createInvoice({
    merchantId: merchant.id,
    status: "unpaid",
    title: "Invoice INV-00018",
    description: "Hardware shipment - payment on supported chains",
    currency: "USD",
    amount: "219.99" as any,
    memo: "SHIP-18",
    metadata: { po: "PO-8871" },
    expiresAt: null as any,
  });
}

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  await seedDatabase();

  // Merchants
  app.get(api.merchants.list.path, async (_req, res) => {
    const rows = await storage.getMerchants();
    res.json(rows);
  });

  app.get(api.merchants.get.path, async (req, res) => {
    const row = await storage.getMerchant(String(req.params.id));
    if (!row) return res.status(404).json({ message: "Merchant not found" });
    res.json(row);
  });

  app.post(api.merchants.create.path, async (req, res) => {
    try {
      const input = api.merchants.create.input.parse(req.body);
      const created = await storage.createMerchant(input);
      res.status(201).json(created);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0]?.message ?? "Invalid input",
          field: err.errors[0]?.path?.join("."),
        });
      }
      throw err;
    }
  });

  app.patch(api.merchants.update.path, async (req, res) => {
    try {
      const id = String(req.params.id);
      const input = api.merchants.update.input.parse(req.body);
      const updated = await storage.updateMerchant(id, input);
      if (!updated) return res.status(404).json({ message: "Merchant not found" });
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0]?.message ?? "Invalid input",
          field: err.errors[0]?.path?.join("."),
        });
      }
      throw err;
    }
  });

  app.delete(api.merchants.delete.path, async (req, res) => {
    const ok = await storage.deleteMerchant(String(req.params.id));
    if (!ok) return res.status(404).json({ message: "Merchant not found" });
    res.status(204).send();
  });

  // Payment options
  app.get(api.paymentOptions.list.path, async (req, res) => {
    const merchantId = req.query.merchantId ? String(req.query.merchantId) : undefined;
    const rows = await storage.getPaymentOptions(merchantId);
    res.json(rows);
  });

  app.post(api.paymentOptions.create.path, async (req, res) => {
    try {
      const input = api.paymentOptions.create.input.parse(req.body);
      const created = await storage.createPaymentOption(input);
      res.status(201).json(created);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0]?.message ?? "Invalid input",
          field: err.errors[0]?.path?.join("."),
        });
      }
      throw err;
    }
  });

  app.patch(api.paymentOptions.update.path, async (req, res) => {
    try {
      const id = String(req.params.id);
      const input = api.paymentOptions.update.input.parse(req.body);
      const updated = await storage.updatePaymentOption(id, input);
      if (!updated)
        return res.status(404).json({ message: "Payment option not found" });
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0]?.message ?? "Invalid input",
          field: err.errors[0]?.path?.join("."),
        });
      }
      throw err;
    }
  });

  app.delete(api.paymentOptions.delete.path, async (req, res) => {
    const ok = await storage.deletePaymentOption(String(req.params.id));
    if (!ok) return res.status(404).json({ message: "Payment option not found" });
    res.status(204).send();
  });

  // Invoices
  app.get(api.invoices.list.path, async (req, res) => {
    const merchantId = req.query.merchantId ? String(req.query.merchantId) : undefined;
    const status = req.query.status ? String(req.query.status) : undefined;
    const q = req.query.q ? String(req.query.q) : undefined;

    const rows = await storage.getInvoices({ merchantId, status, q });
    res.json(rows);
  });

  app.get(api.invoices.get.path, async (req, res) => {
    const row = await storage.getInvoice(String(req.params.id));
    if (!row) return res.status(404).json({ message: "Invoice not found" });
    res.json(row);
  });

  app.post(api.invoices.create.path, async (req, res) => {
    try {
      const bodySchema = api.invoices.create.input.extend({
        amount: z.coerce.string(),
      });
      const input = bodySchema.parse(req.body);
      const created = await storage.createInvoice(input as any);
      res.status(201).json(created);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0]?.message ?? "Invalid input",
          field: err.errors[0]?.path?.join("."),
        });
      }
      throw err;
    }
  });

  app.patch(api.invoices.update.path, async (req, res) => {
    try {
      const id = String(req.params.id);
      const bodySchema = api.invoices.update.input.extend({
        amount: z.coerce.string().optional(),
      });
      const input = bodySchema.parse(req.body);
      const updated = await storage.updateInvoice(id, input as any);
      if (!updated) return res.status(404).json({ message: "Invoice not found" });
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0]?.message ?? "Invalid input",
          field: err.errors[0]?.path?.join("."),
        });
      }
      throw err;
    }
  });

  app.post(api.invoices.markPaid.path, async (req, res) => {
    const id = String(req.params.id);
    const existing = await storage.getInvoice(id);
    if (!existing) return res.status(404).json({ message: "Invoice not found" });

    const input = api.invoices.markPaid.input
      ? api.invoices.markPaid.input.parse(req.body ?? {})
      : {};

    const paidAt = input?.paidAt ? new Date(input.paidAt) : undefined;
    const updated = await storage.markInvoicePaid(id, paidAt);
    if (!updated) return res.status(404).json({ message: "Invoice not found" });
    res.json(updated);
  });

  app.delete(api.invoices.delete.path, async (req, res) => {
    const ok = await storage.deleteInvoice(String(req.params.id));
    if (!ok) return res.status(404).json({ message: "Invoice not found" });
    res.status(204).send();
  });

  // Payments
  app.get(api.payments.list.path, async (req, res) => {
    const invoiceId = req.query.invoiceId ? String(req.query.invoiceId) : undefined;
    const rows = await storage.getPayments(invoiceId);
    res.json(rows);
  });

  app.post(api.payments.create.path, async (req, res) => {
    try {
      const bodySchema = api.payments.create.input.extend({
        amount: z.coerce.string(),
      });
      const input = bodySchema.parse(req.body);
      const created = await storage.createPayment(input as any);
      res.status(201).json(created);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0]?.message ?? "Invalid input",
          field: err.errors[0]?.path?.join("."),
        });
      }
      if (err instanceof Error && err.message === "INVOICE_NOT_FOUND") {
        return res.status(404).json({ message: "Invoice not found" });
      }
      throw err;
    }
  });

  return httpServer;
}
