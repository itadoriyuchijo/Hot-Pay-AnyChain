import { useMemo, useState } from "react";
import { useParams } from "wouter";
import { Seo } from "@/components/seo/Seo";
import { AppShell } from "@/components/layout/AppShell";
import { SectionHeader } from "@/components/common/SectionHeader";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { InvoiceStatusBadge } from "@/components/invoices/InvoiceStatusBadge";
import { CreatePaymentDialog } from "@/components/payments/CreatePaymentDialog";
import { formatMoney } from "@/components/format/money";
import { formatDateTime } from "@/components/format/time";
import { useInvoice, useMarkInvoicePaid, useUpdateInvoice } from "@/hooks/use-invoices";
import { usePayments, useCreatePayment } from "@/hooks/use-payments";
import { useMerchants } from "@/hooks/use-merchants";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  CheckCircle2,
  Clipboard,
  Copy,
  ExternalLink,
  Loader2,
  Plus,
  ReceiptText,
  TriangleAlert,
} from "lucide-react";

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();

  const invoiceQ = useInvoice(id);
  const paymentsQ = usePayments(id);
  const merchantsQ = useMerchants();

  const markPaid = useMarkInvoicePaid();
  const updateInv = useUpdateInvoice();
  const createPayment = useCreatePayment();

  const invoice = invoiceQ.data;
  const payments = paymentsQ.data ?? [];
  const merchants = merchantsQ.data ?? [];

  const merchant = useMemo(() => merchants.find((m) => m.id === invoice?.merchantId) ?? null, [merchants, invoice]);

  const [confirmPaidOpen, setConfirmPaidOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  const shareUrl = useMemo(() => {
    if (!id) return "";
    return `${window.location.origin}/invoices/${id}`;
  }, [id]);

  const loading = invoiceQ.isLoading || paymentsQ.isLoading || merchantsQ.isLoading;
  const error = invoiceQ.error || paymentsQ.error || merchantsQ.error;

  return (
    <AppShell>
      <Seo
        title={invoice ? `HotPay — ${invoice.title}` : "HotPay — Invoice"}
        description="Invoice detail: status, metadata, and payment records."
      />

      <div className="mb-5">
        <Button
          data-testid="invoice-detail-back"
          variant="secondary"
          className="rounded-2xl border border-border/70 hover:border-border transition-all duration-300"
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      <SectionHeader
        eyebrow="Invoice"
        title={invoice?.title ?? "Loading invoice…"}
        description={
          invoice
            ? `${merchant?.name ?? "Merchant"} • ${formatMoney(invoice.amount, invoice.currency)} • Created ${formatDateTime(invoice.createdAt)}`
            : "Fetching invoice details and payment history."
        }
        right={
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              data-testid="invoice-detail-copy-link"
              variant="secondary"
              className="rounded-2xl border border-border/70 hover:border-border transition-all duration-300"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(shareUrl);
                  toast({ title: "Link copied", description: "Share it with a payer." });
                } catch {
                  toast({ title: "Copy failed", description: "Clipboard permission denied.", variant: "destructive" });
                }
              }}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy link
            </Button>

            <Button
              data-testid="invoice-detail-open-new"
              variant="secondary"
              className="rounded-2xl border border-border/70 hover:border-border transition-all duration-300"
              onClick={() => window.open(shareUrl, "_blank")}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open
            </Button>

            <Button
              data-testid="invoice-detail-mark-paid"
              onClick={() => setConfirmPaidOpen(true)}
              disabled={!invoice || invoice.status === "paid" || markPaid.isPending}
              className={cn(
                "rounded-2xl bg-gradient-to-r from-primary to-accent text-primary-foreground",
                "shadow-lg shadow-black/30 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300",
              )}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              {invoice?.status === "paid" ? "Paid" : markPaid.isPending ? "Marking…" : "Mark paid"}
            </Button>
          </div>
        }
      />

      {loading ? (
        <Card className="glass grain rounded-3xl border-border/70 p-8 mt-6">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        </Card>
      ) : error ? (
        <Card className="glass grain rounded-3xl border-border/70 p-6 mt-6">
          <div className="flex items-start gap-3">
            <TriangleAlert className="h-5 w-5 text-destructive mt-0.5" />
            <div>
              <div className="font-medium text-destructive">Failed to load invoice</div>
              <div className="text-sm text-muted-foreground">{String((error as Error).message ?? error)}</div>
            </div>
          </div>
        </Card>
      ) : !invoice ? (
        <Card className="glass grain rounded-3xl border-border/70 p-6 mt-6">
          <div className="text-sm text-muted-foreground">Invoice not found.</div>
        </Card>
      ) : (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="glass grain rounded-3xl border-border/70 p-5 sm:p-6 lg:col-span-2">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground/80">
                  Status
                </div>
                <div className="mt-2">
                  <InvoiceStatusBadge status={invoice.status as any} />
                </div>
              </div>
              <Button
                data-testid="invoice-detail-toggle-draft"
                variant="secondary"
                className="rounded-2xl border border-border/70 hover:border-border transition-all duration-300"
                onClick={() => {
                  const next = invoice.status === "draft" ? "unpaid" : "draft";
                  updateInv.mutate(
                    { id: invoice.id, updates: { status: next as any } },
                    {
                      onSuccess: () => toast({ title: "Status updated", description: `Now ${next}.` }),
                      onError: (e) =>
                        toast({ title: "Update failed", description: String((e as Error).message ?? e), variant: "destructive" }),
                    },
                  );
                }}
              >
                <Clipboard className="h-4 w-4 mr-2" />
                {invoice.status === "draft" ? "Move to unpaid" : "Set draft"}
              </Button>
            </div>

            <div className="mt-6 grid gap-3">
              <div className="rounded-2xl border border-border/70 bg-secondary/20 p-4">
                <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground/80">
                  Amount
                </div>
                <div className="mt-1 font-display text-2xl">
                  {formatMoney(invoice.amount, invoice.currency)}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-2xl border border-border/70 bg-secondary/20 p-4">
                  <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground/80">
                    Created
                  </div>
                  <div className="mt-1 text-sm">{formatDateTime(invoice.createdAt)}</div>
                </div>
                <div className="rounded-2xl border border-border/70 bg-secondary/20 p-4">
                  <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground/80">
                    Paid at
                  </div>
                  <div className="mt-1 text-sm">{formatDateTime(invoice.paidAt)}</div>
                </div>
              </div>

              <div className="rounded-2xl border border-border/70 bg-secondary/20 p-4">
                <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground/80">
                  Description
                </div>
                <div className="mt-2 text-sm text-foreground/85 whitespace-pre-wrap">
                  {invoice.description || "—"}
                </div>
              </div>

              <div className="rounded-2xl border border-border/70 bg-secondary/20 p-4">
                <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground/80">
                  Memo
                </div>
                <div className="mt-2 text-sm text-foreground/85 whitespace-pre-wrap">
                  {invoice.memo || "—"}
                </div>
              </div>
            </div>
          </Card>

          <Card className="glass grain rounded-3xl border-border/70 p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground/80">
                  Payments
                </div>
                <div className="mt-1 font-display text-xl">
                  {payments.length} record{payments.length === 1 ? "" : "s"}
                </div>
              </div>
              <Button
                data-testid="invoice-detail-add-payment"
                onClick={() => setPaymentDialogOpen(true)}
                className={cn(
                  "rounded-2xl bg-gradient-to-r from-primary to-accent text-primary-foreground",
                  "shadow-lg shadow-black/30 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300",
                )}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>

            <div className="mt-5 grid gap-3">
              {payments.length === 0 ? (
                <div className="rounded-2xl border border-border/70 bg-secondary/20 p-6 text-sm text-muted-foreground">
                  No payments recorded yet. Add a detection/confirmation record.
                </div>
              ) : (
                payments
                  .slice()
                  .sort((a, b) => String(b.detectedAt ?? "").localeCompare(String(a.detectedAt ?? "")))
                  .map((p) => (
                    <div
                      key={p.id}
                      className={cn(
                        "rounded-2xl border border-border/70 bg-secondary/20 p-4",
                        "transition-all duration-300 hover:bg-secondary/28 hover:border-border",
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-medium truncate">
                            {p.chain} • {p.assetSymbol}
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {formatDateTime(p.detectedAt)} • {p.status}
                          </div>
                        </div>
                        <div className="text-sm font-display">
                          {p.amount}
                        </div>
                      </div>
                      <div className="mt-3 grid gap-2 text-xs text-muted-foreground font-mono">
                        <div className="truncate">to: {p.toAddress}</div>
                        {p.fromAddress ? <div className="truncate">from: {p.fromAddress}</div> : null}
                        {p.txHash ? <div className="truncate">tx: {p.txHash}</div> : null}
                      </div>
                    </div>
                  ))
              )}
            </div>
          </Card>
        </div>
      )}

      <ConfirmDialog
        open={confirmPaidOpen}
        onOpenChange={setConfirmPaidOpen}
        title="Mark this invoice as paid?"
        description="This sets status to “paid” and records paidAt (server-side)."
        confirmLabel={markPaid.isPending ? "Marking..." : "Mark paid"}
        testIdConfirm="invoice-detail-confirm-mark-paid"
        testIdCancel="invoice-detail-cancel-mark-paid"
        onConfirm={() => {
          if (!invoice) return;
          markPaid.mutate(
            { id: invoice.id, body: {} },
            {
              onSuccess: () => {
                toast({ title: "Invoice marked paid" });
                setConfirmPaidOpen(false);
              },
              onError: (e) =>
                toast({
                  title: "Action failed",
                  description: String((e as Error).message ?? e),
                  variant: "destructive",
                }),
            },
          );
        }}
      />

      <CreatePaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        invoiceId={id}
        isSubmitting={createPayment.isPending}
        onSubmit={(values) => {
          const payload: any = {
            ...values,
            invoiceId: id,
            fromAddress: values.fromAddress || null,
            txHash: values.txHash || null,
          };
          createPayment.mutate(payload, {
            onSuccess: () => {
              toast({ title: "Payment recorded" });
              setPaymentDialogOpen(false);
            },
            onError: (e) =>
              toast({
                title: "Create failed",
                description: String((e as Error).message ?? e),
                variant: "destructive",
              }),
          });
        }}
      />
    </AppShell>
  );
}
