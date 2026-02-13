import { useEffect, useMemo, useState } from "react";
import { Seo } from "@/components/seo/Seo";
import { AppShell } from "@/components/layout/AppShell";
import { SectionHeader } from "@/components/common/SectionHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { InvoiceDialog } from "@/components/invoices/InvoiceDialog";
import { InvoiceStatusBadge } from "@/components/invoices/InvoiceStatusBadge";
import { formatMoney } from "@/components/format/money";
import { formatDateTime } from "@/components/format/time";
import { useToast } from "@/hooks/use-toast";
import { useMerchants } from "@/hooks/use-merchants";
import { useCreateInvoice, useDeleteInvoice, useInvoices, useUpdateInvoice } from "@/hooks/use-invoices";
import type { Invoice, Merchant } from "@shared/schema";
import { Link, useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Plus,
  Search,
  Filter,
  Pencil,
  Trash2,
  Loader2,
  TriangleAlert,
  ReceiptText,
  ArrowUpRight,
} from "lucide-react";

function merchantName(merchants: Merchant[], id: string) {
  return merchants.find((m) => m.id === id)?.name ?? "Unknown merchant";
}

export default function InvoicesPage() {
  const { toast } = useToast();
  const [loc] = useLocation();

  const merchantsQ = useMerchants();

  const url = new URL(window.location.href);
  const initialMerchantId = url.searchParams.get("merchantId") ?? "";
  const initialStatus = url.searchParams.get("status") ?? "";
  const initialNew = url.searchParams.get("new") === "1";

  const [q, setQ] = useState(url.searchParams.get("q") ?? "");
  const [merchantId, setMerchantId] = useState(initialMerchantId);
  const [status, setStatus] = useState(initialStatus);

  const invoicesQ = useInvoices({ merchantId: merchantId || undefined, status: status || undefined, q: q || undefined });

  const createInv = useCreateInvoice();
  const updateInv = useUpdateInvoice();
  const deleteInv = useDeleteInvoice();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<Invoice | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState<Invoice | null>(null);

  useEffect(() => {
    if (initialNew) {
      setDialogMode("create");
      setEditing(null);
      setDialogOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loc]);

  const merchants = merchantsQ.data ?? [];
  const invoices = invoicesQ.data ?? [];

  const filtered = useMemo(() => {
    return invoices
      .slice()
      .sort((a, b) => String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? "")));
  }, [invoices]);

  return (
    <AppShell>
      <Seo title="HotPay — Invoices" description="Create, filter, and reconcile AnyChain invoices." />

      <SectionHeader
        eyebrow="Ledger"
        title="Invoices"
        description="Draft, send, and track settlement—then mark paid when funds land on-chain."
        right={
          <Button
            data-testid="invoices-new"
            onClick={() => {
              setDialogMode("create");
              setEditing(null);
              setDialogOpen(true);
            }}
            className={cn(
              "rounded-2xl bg-gradient-to-r from-primary to-accent text-primary-foreground",
              "shadow-lg shadow-black/30 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300",
            )}
          >
            <Plus className="h-4 w-4 mr-2" />
            New invoice
          </Button>
        }
      />

      <div className="mt-6 grid gap-4">
        <Card className="glass grain rounded-3xl border-border/70 p-4 sm:p-5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
            <div className="relative lg:col-span-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                data-testid="invoices-search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search title / description…"
                className="h-11 pl-9 rounded-2xl bg-background/30 border-border/70 focus-visible:ring-4 focus-visible:ring-ring/20"
              />
            </div>

            <div className="lg:col-span-3">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <select
                  data-testid="invoices-filter-merchant"
                  className={cn(
                    "h-11 w-full rounded-2xl pl-9 pr-3",
                    "bg-background/30 border border-border/70",
                    "focus:outline-none focus:ring-4 focus:ring-ring/20 focus:border-primary/50 transition-all duration-200",
                  )}
                  value={merchantId}
                  onChange={(e) => setMerchantId(e.target.value)}
                >
                  <option value="">All merchants</option>
                  {merchants.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="lg:col-span-3">
              <select
                data-testid="invoices-filter-status"
                className={cn(
                  "h-11 w-full rounded-2xl px-3",
                  "bg-background/30 border border-border/70",
                  "focus:outline-none focus:ring-4 focus:ring-ring/20 focus:border-primary/50 transition-all duration-200",
                )}
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">All statuses</option>
                <option value="draft">Draft</option>
                <option value="unpaid">Unpaid</option>
                <option value="paid">Paid</option>
                <option value="expired">Expired</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="mt-3 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
            <div className="text-xs text-muted-foreground">
              {filtered.length} invoices
            </div>
            <div className="flex gap-2">
              <Button
                data-testid="invoices-clear-filters"
                variant="secondary"
                className="rounded-2xl border border-border/70 hover:border-border transition-all duration-300"
                onClick={() => {
                  setQ("");
                  setMerchantId("");
                  setStatus("");
                }}
              >
                Clear
              </Button>
              <Button
                data-testid="invoices-apply-url"
                variant="secondary"
                className="rounded-2xl border border-border/70 hover:border-border transition-all duration-300"
                onClick={() => {
                  const params = new URLSearchParams();
                  if (q) params.set("q", q);
                  if (merchantId) params.set("merchantId", merchantId);
                  if (status) params.set("status", status);
                  window.history.replaceState(null, "", `/invoices?${params.toString()}`);
                  toast({ title: "Filters saved to URL" });
                }}
              >
                Save URL
              </Button>
            </div>
          </div>
        </Card>

        {invoicesQ.isLoading || merchantsQ.isLoading ? (
          <Card className="glass grain rounded-3xl border-border/70 p-8">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading invoices…
            </div>
          </Card>
        ) : invoicesQ.error || merchantsQ.error ? (
          <Card className="glass grain rounded-3xl border-border/70 p-6">
            <div className="flex items-start gap-3">
              <TriangleAlert className="h-5 w-5 text-destructive mt-0.5" />
              <div>
                <div className="font-medium text-destructive">Failed to load invoices</div>
                <div className="text-sm text-muted-foreground">
                  {String(((invoicesQ.error || merchantsQ.error) as Error).message ?? (invoicesQ.error || merchantsQ.error))}
                </div>
              </div>
            </div>
          </Card>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<ReceiptText className="h-6 w-6 text-foreground/85" />}
            title="No invoices found"
            description="Create your first invoice or broaden your filters."
            actionLabel="Create invoice"
            onAction={() => {
              setDialogMode("create");
              setEditing(null);
              setDialogOpen(true);
            }}
            testId="invoices-empty-create"
          />
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filtered.map((inv) => (
              <Card
                key={inv.id}
                className={cn(
                  "glass grain rounded-3xl border-border/70 p-4 sm:p-5",
                  "transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_22px_70px_rgba(0,0,0,.45)]",
                )}
              >
                <div className="flex flex-col md:flex-row md:items-center gap-4 md:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <Link
                        href={`/invoices/${inv.id}`}
                        data-testid={`invoices-open-${inv.id}`}
                        className="group inline-flex items-center gap-2 min-w-0"
                      >
                        <div className="truncate font-display text-xl">
                          {inv.title}
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-muted-foreground/80 group-hover:text-foreground transition-colors" />
                      </Link>
                      <InvoiceStatusBadge status={inv.status as any} />
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      {merchantName(merchants, inv.merchantId)} • {formatMoney(inv.amount, inv.currency)} • Created{" "}
                      {formatDateTime(inv.createdAt)}
                    </div>
                    {inv.description ? (
                      <div className="mt-2 text-sm text-foreground/80 line-clamp-2">
                        {inv.description}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-2 justify-end">
                    <Button
                      data-testid={`invoices-edit-${inv.id}`}
                      variant="secondary"
                      className="rounded-2xl border border-border/70 hover:border-border transition-all duration-300"
                      onClick={() => {
                        setDialogMode("edit");
                        setEditing(inv);
                        setDialogOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      data-testid={`invoices-delete-${inv.id}`}
                      variant="secondary"
                      className="rounded-2xl border border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/16 transition-all duration-300"
                      onClick={() => {
                        setDeleting(inv);
                        setConfirmOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <InvoiceDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        initial={editing}
        merchants={merchants}
        isSubmitting={createInv.isPending || updateInv.isPending}
        onSubmit={(values) => {
          const payload: any = {
            merchantId: values.merchantId,
            status: values.status,
            title: values.title,
            description: values.description || null,
            currency: values.currency,
            amount: values.amount, // keep string
            memo: values.memo || null,
            metadata: values.metadata ?? {},
            expiresAt: values.expiresAt ? values.expiresAt : null,
          };

          if (dialogMode === "create") {
            createInv.mutate(payload, {
              onSuccess: (created) => {
                toast({ title: "Invoice created", description: "Open it to track payments." });
                setDialogOpen(false);
                window.location.href = `/invoices/${created.id}`;
              },
              onError: (e) =>
                toast({
                  title: "Create failed",
                  description: String((e as Error).message ?? e),
                  variant: "destructive",
                }),
            });
          } else if (editing) {
            updateInv.mutate(
              { id: editing.id, updates: payload },
              {
                onSuccess: () => {
                  toast({ title: "Invoice updated" });
                  setDialogOpen(false);
                },
                onError: (e) =>
                  toast({
                    title: "Update failed",
                    description: String((e as Error).message ?? e),
                    variant: "destructive",
                  }),
              },
            );
          }
        }}
      />

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Delete invoice${deleting ? ` “${deleting.title}”` : ""}?`}
        description="This will also delete related payment records."
        confirmLabel={deleteInv.isPending ? "Deleting..." : "Delete"}
        destructive
        testIdConfirm="invoices-confirm-delete"
        testIdCancel="invoices-cancel-delete"
        onConfirm={() => {
          if (!deleting) return;
          deleteInv.mutate(deleting.id, {
            onSuccess: () => {
              toast({ title: "Invoice deleted" });
              setConfirmOpen(false);
              setDeleting(null);
            },
            onError: (e) =>
              toast({
                title: "Delete failed",
                description: String((e as Error).message ?? e),
                variant: "destructive",
              }),
          });
        }}
      />
    </AppShell>
  );
}
