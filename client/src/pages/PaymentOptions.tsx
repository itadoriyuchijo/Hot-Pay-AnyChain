import { useEffect, useMemo, useState } from "react";
import { Seo } from "@/components/seo/Seo";
import { AppShell } from "@/components/layout/AppShell";
import { SectionHeader } from "@/components/common/SectionHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { PaymentOptionDialog } from "@/components/payment-options/PaymentOptionDialog";
import { useToast } from "@/hooks/use-toast";
import { useMerchants } from "@/hooks/use-merchants";
import {
  useCreatePaymentOption,
  useDeletePaymentOption,
  usePaymentOptions,
  useUpdatePaymentOption,
} from "@/hooks/use-payment-options";
import type { SupportedPaymentOption } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Blocks, Plus, Search, Pencil, Trash2, Loader2, TriangleAlert, ToggleLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function PaymentOptionsPage() {
  const { toast } = useToast();
  const [loc] = useLocation();
  const url = new URL(window.location.href);
  const initialMerchantId = url.searchParams.get("merchantId") ?? "";
  const initialNew = url.searchParams.get("new") === "1";

  const merchantsQ = useMerchants();
  const [merchantId, setMerchantId] = useState(initialMerchantId);
  const optsQ = usePaymentOptions(merchantId || undefined);

  const createOpt = useCreatePaymentOption();
  const updateOpt = useUpdatePaymentOption();
  const deleteOpt = useDeletePaymentOption();

  const [q, setQ] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<SupportedPaymentOption | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState<SupportedPaymentOption | null>(null);

  useEffect(() => {
    if (initialNew) {
      setDialogMode("create");
      setEditing(null);
      setDialogOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loc]);

  const merchants = merchantsQ.data ?? [];
  const options = optsQ.data ?? [];

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const base = options
      .slice()
      .sort((a, b) => (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0));
    if (!needle) return base;
    return base.filter((o) => `${o.chain} ${o.assetSymbol} ${o.receiveAddress}`.toLowerCase().includes(needle));
  }, [options, q]);

  return (
    <AppShell>
      <Seo
        title="HotPay — Payment Options"
        description="Manage supported chains/assets and receive addresses per merchant."
      />

      <SectionHeader
        eyebrow="Routing"
        title="Payment Options"
        description="Define where funds should land. These options power a payer’s checkout experience."
        right={
          <Button
            data-testid="payment-options-new"
            onClick={() => {
              setDialogMode("create");
              setEditing(null);
              setDialogOpen(true);
            }}
            disabled={merchants.length === 0}
            className={cn(
              "rounded-2xl bg-gradient-to-r from-primary to-accent text-primary-foreground",
              "shadow-lg shadow-black/30 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none",
            )}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add option
          </Button>
        }
      />

      <div className="mt-6 grid gap-4">
        <Card className="glass grain rounded-3xl border-border/70 p-4 sm:p-5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
            <div className="lg:col-span-4">
              <select
                data-testid="payment-options-merchant"
                className={cn(
                  "h-11 w-full rounded-2xl px-3",
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
              <div className="mt-2 text-xs text-muted-foreground">
                Tip: filter by merchant to edit addresses quickly.
              </div>
            </div>

            <div className="relative lg:col-span-8">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                data-testid="payment-options-search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search chain / asset / address…"
                className="h-11 pl-9 rounded-2xl bg-background/30 border-border/70 focus-visible:ring-4 focus-visible:ring-ring/20"
              />
            </div>
          </div>
        </Card>

        {merchantsQ.isLoading || optsQ.isLoading ? (
          <Card className="glass grain rounded-3xl border-border/70 p-8">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading payment options…
            </div>
          </Card>
        ) : merchantsQ.error || optsQ.error ? (
          <Card className="glass grain rounded-3xl border-border/70 p-6">
            <div className="flex items-start gap-3">
              <TriangleAlert className="h-5 w-5 text-destructive mt-0.5" />
              <div>
                <div className="font-medium text-destructive">Failed to load</div>
                <div className="text-sm text-muted-foreground">
                  {String(((merchantsQ.error || optsQ.error) as Error).message ?? (merchantsQ.error || optsQ.error))}
                </div>
              </div>
            </div>
          </Card>
        ) : merchants.length === 0 ? (
          <EmptyState
            icon={<Blocks className="h-6 w-6 text-foreground/85" />}
            title="No merchants yet"
            description="Create a merchant first—payment options are scoped to a merchant."
            actionLabel="Create merchant"
            onAction={() => {
              window.location.href = "/merchants?new=1";
            }}
            testId="payment-options-empty-create-merchant"
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<ToggleLeft className="h-6 w-6 text-foreground/85" />}
            title="No payment options"
            description="Add your first chain/asset receive address."
            actionLabel="Add option"
            onAction={() => {
              setDialogMode("create");
              setEditing(null);
              setDialogOpen(true);
            }}
            testId="payment-options-empty-create"
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filtered.map((o) => (
              <Card
                key={o.id}
                className={cn(
                  "glass grain rounded-3xl border-border/70 p-5 sm:p-6",
                  "transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_22px_70px_rgba(0,0,0,.45)]",
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="font-display text-xl truncate">
                        {o.chain} • {o.assetSymbol}
                      </div>
                      <span
                        className={cn(
                          "text-xs rounded-full px-2 py-1 border",
                          o.enabled
                            ? "border-primary/30 bg-primary/12 text-primary"
                            : "border-border/70 bg-secondary/25 text-muted-foreground",
                        )}
                      >
                        {o.enabled ? "Enabled" : "Disabled"}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      Sort order: {o.sortOrder}
                    </div>
                    <div className="mt-3 rounded-2xl border border-border/70 bg-secondary/20 p-3">
                      <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground/80">
                        Receive address
                      </div>
                      <div className="mt-2 font-mono text-xs text-foreground/90 break-all">
                        {o.receiveAddress}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      data-testid={`payment-options-edit-${o.id}`}
                      variant="secondary"
                      size="icon"
                      className="rounded-2xl border border-border/70 hover:border-border transition-all duration-300"
                      onClick={() => {
                        setDialogMode("edit");
                        setEditing(o);
                        setDialogOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      data-testid={`payment-options-delete-${o.id}`}
                      variant="secondary"
                      size="icon"
                      className="rounded-2xl border border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/16 transition-all duration-300"
                      onClick={() => {
                        setDeleting(o);
                        setConfirmOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <PaymentOptionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        initial={editing}
        merchants={merchants}
        isSubmitting={createOpt.isPending || updateOpt.isPending}
        onSubmit={(values) => {
          const payload: any = {
            merchantId: values.merchantId,
            chain: values.chain,
            assetSymbol: values.assetSymbol,
            receiveAddress: values.receiveAddress,
            enabled: values.enabled,
            sortOrder: values.sortOrder,
          };

          if (dialogMode === "create") {
            createOpt.mutate(payload, {
              onSuccess: () => {
                toast({ title: "Payment option added" });
                setDialogOpen(false);
              },
              onError: (e) =>
                toast({
                  title: "Create failed",
                  description: String((e as Error).message ?? e),
                  variant: "destructive",
                }),
            });
          } else if (editing) {
            updateOpt.mutate(
              { id: editing.id, updates: payload },
              {
                onSuccess: () => {
                  toast({ title: "Payment option updated" });
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
        title="Delete payment option?"
        description="This removes the option from checkout for new payments."
        confirmLabel={deleteOpt.isPending ? "Deleting..." : "Delete"}
        destructive
        testIdConfirm="payment-options-confirm-delete"
        testIdCancel="payment-options-cancel-delete"
        onConfirm={() => {
          if (!deleting) return;
          deleteOpt.mutate(deleting.id, {
            onSuccess: () => {
              toast({ title: "Payment option deleted" });
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
