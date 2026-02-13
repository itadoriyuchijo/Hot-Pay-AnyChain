import { useMemo } from "react";
import { Seo } from "@/components/seo/Seo";
import { AppShell } from "@/components/layout/AppShell";
import { SectionHeader } from "@/components/common/SectionHeader";
import { StatCard } from "@/components/common/StatCard";
import { useMerchants } from "@/hooks/use-merchants";
import { useInvoices } from "@/hooks/use-invoices";
import { usePaymentOptions } from "@/hooks/use-payment-options";
import { formatMoney } from "@/components/format/money";
import { formatDateTime } from "@/components/format/time";
import { InvoiceStatusBadge } from "@/components/invoices/InvoiceStatusBadge";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Banknote,
  ReceiptText,
  Blocks,
  TrendingUp,
  ArrowUpRight,
  Loader2,
  TriangleAlert,
} from "lucide-react";

export default function Dashboard() {
  const merchantsQ = useMerchants();
  const invoicesQ = useInvoices();
  const paymentOptionsQ = usePaymentOptions();

  const merchants = merchantsQ.data ?? [];
  const invoices = invoicesQ.data ?? [];
  const paymentOptions = paymentOptionsQ.data ?? [];

  const stats = useMemo(() => {
    const totalInvoices = invoices.length;
    const paid = invoices.filter((i) => i.status === "paid").length;
    const unpaid = invoices.filter((i) => i.status === "unpaid").length;

    const paidTotal = invoices
      .filter((i) => i.status === "paid")
      .reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);

    const anyCurrency = invoices[0]?.currency ?? "USD";

    return {
      totalInvoices,
      paid,
      unpaid,
      paidTotal: formatMoney(paidTotal, anyCurrency),
    };
  }, [invoices]);

  const loading = merchantsQ.isLoading || invoicesQ.isLoading || paymentOptionsQ.isLoading;
  const error = merchantsQ.error || invoicesQ.error || paymentOptionsQ.error;

  return (
    <AppShell>
      <Seo
        title="HotPay — Dashboard"
        description="Overview of merchants, invoices, and multi-chain payment readiness."
      />

      <SectionHeader
        eyebrow="Overview"
        title="A clean ledger for chaotic chains."
        description="Track invoices across merchants, keep payment options sharp, and close the loop on settlements."
        right={
          <div className="flex flex-col sm:flex-row gap-2">
            <Link href="/invoices?new=1" className="w-full sm:w-auto">
              <Button
                data-testid="dashboard-new-invoice"
                className={cn(
                  "w-full sm:w-auto rounded-2xl",
                  "bg-gradient-to-r from-primary to-accent text-primary-foreground",
                  "shadow-lg shadow-black/30 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300",
                )}
              >
                <ArrowUpRight className="h-4 w-4 mr-2" />
                Create invoice
              </Button>
            </Link>
            <Link href="/payment-options" className="w-full sm:w-auto">
              <Button
                data-testid="dashboard-manage-options"
                variant="secondary"
                className="w-full sm:w-auto rounded-2xl border border-border/70 hover:border-border transition-all duration-300"
              >
                <Blocks className="h-4 w-4 mr-2" />
                Payment options
              </Button>
            </Link>
          </div>
        }
      />

      <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Merchants"
          value={`${stats.totalInvoices === 0 ? merchants.length : merchants.length}`}
          hint="Profiles issuing invoices"
          icon={<Banknote className="h-5 w-5" />}
          tone="neutral"
        />
        <StatCard
          label="Invoices"
          value={`${stats.totalInvoices}`}
          hint={`${stats.unpaid} unpaid • ${stats.paid} paid`}
          icon={<ReceiptText className="h-5 w-5" />}
          tone="accent"
        />
        <StatCard
          label="Paid volume"
          value={stats.paidTotal}
          hint="Across all paid invoices"
          icon={<TrendingUp className="h-5 w-5" />}
          tone="primary"
        />
        <StatCard
          label="Payment options"
          value={`${paymentOptions.length}`}
          hint="Enabled chains/assets"
          icon={<Blocks className="h-5 w-5" />}
          tone="neutral"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="glass grain rounded-3xl border-border/70 p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground/80">
                Latest invoices
              </div>
              <div className="mt-1 font-display text-xl">Recent activity</div>
            </div>
            <Link href="/invoices" className="shrink-0">
              <Button
                data-testid="dashboard-view-invoices"
                variant="secondary"
                className="rounded-2xl border border-border/70 hover:border-border transition-all duration-300"
              >
                View all
              </Button>
            </Link>
          </div>

          <div className="mt-5">
            {loading ? (
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading…
              </div>
            ) : error ? (
              <div className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm">
                <TriangleAlert className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-destructive">Failed to load</div>
                  <div className="text-muted-foreground">{String((error as Error).message ?? error)}</div>
                </div>
              </div>
            ) : invoices.length === 0 ? (
              <div className="rounded-2xl border border-border/70 bg-secondary/20 p-6 text-sm text-muted-foreground">
                No invoices yet. Create one to start tracking payments across chains.
              </div>
            ) : (
              <div className="grid gap-3">
                {invoices
                  .slice()
                  .sort((a, b) => String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? "")))
                  .slice(0, 6)
                  .map((inv) => (
                    <Link
                      key={inv.id}
                      href={`/invoices/${inv.id}`}
                      data-testid={`dashboard-invoice-${inv.id}`}
                      className={cn(
                        "group rounded-2xl border border-border/70 bg-secondary/20 p-4",
                        "transition-all duration-300 ease-out hover:bg-secondary/30 hover:border-border hover:-translate-y-0.5",
                      )}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="truncate font-medium text-foreground/95">
                            {inv.title}
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {formatDateTime(inv.createdAt)} • {formatMoney(inv.amount, inv.currency)}
                          </div>
                        </div>
                        <InvoiceStatusBadge status={inv.status as any} />
                      </div>
                    </Link>
                  ))}
              </div>
            )}
          </div>
        </Card>

        <Card className="glass grain rounded-3xl border-border/70 p-5 sm:p-6">
          <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground/80">
            Readiness
          </div>
          <div className="mt-1 font-display text-xl">Multi-chain configuration</div>
          <p className="mt-2 text-sm text-muted-foreground max-w-prose">
            Payment options are scoped per merchant. Make sure every merchant has at least one enabled chain/asset + receive address.
          </p>

          <div className="mt-5 grid gap-3">
            {merchants.length === 0 ? (
              <div className="rounded-2xl border border-border/70 bg-secondary/20 p-6 text-sm text-muted-foreground">
                Add a merchant to start configuring supported chains.
              </div>
            ) : (
              merchants.slice(0, 6).map((m) => {
                const options = paymentOptions.filter((o) => o.merchantId === m.id);
                const enabled = options.filter((o) => !!o.enabled).length;
                const ok = enabled > 0;
                return (
                  <div
                    key={m.id}
                    className={cn(
                      "rounded-2xl border p-4",
                      ok ? "border-primary/25 bg-primary/6" : "border-destructive/25 bg-destructive/8",
                    )}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <div className="truncate font-medium">{m.name}</div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {enabled} enabled • {options.length} total
                        </div>
                      </div>
                      <Link href={`/payment-options?merchantId=${encodeURIComponent(m.id)}`}>
                        <Button
                          data-testid={`dashboard-merchant-options-${m.id}`}
                          size="sm"
                          variant="secondary"
                          className="rounded-xl border border-border/70 hover:border-border transition-all duration-300"
                        >
                          Manage
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
