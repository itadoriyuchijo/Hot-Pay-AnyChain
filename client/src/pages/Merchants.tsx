import { useEffect, useMemo, useState } from "react";
import { Seo } from "@/components/seo/Seo";
import { AppShell } from "@/components/layout/AppShell";
import { SectionHeader } from "@/components/common/SectionHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { MerchantDialog } from "@/components/merchants/MerchantDialog";
import { useToast } from "@/hooks/use-toast";
import { useCreateMerchant, useDeleteMerchant, useMerchants, useUpdateMerchant } from "@/hooks/use-merchants";
import type { Merchant } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Building2, Plus, Search, Pencil, Trash2, Loader2, TriangleAlert, Globe, Mail } from "lucide-react";
import { useLocation } from "wouter";

export default function MerchantsPage() {
  const { toast } = useToast();
  const [loc] = useLocation();

  const merchantsQ = useMerchants();
  const createM = useCreateMerchant();
  const updateM = useUpdateMerchant();
  const deleteM = useDeleteMerchant();

  const [q, setQ] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<Merchant | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState<Merchant | null>(null);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("new") === "1") {
      setDialogMode("create");
      setEditing(null);
      setDialogOpen(true);
    }
  }, [loc]);

  const merchants = merchantsQ.data ?? [];

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return merchants;
    return merchants.filter((m) => {
      const hay = `${m.name} ${m.websiteUrl ?? ""} ${m.contactEmail ?? ""}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [merchants, q]);

  return (
    <AppShell>
      <Seo
        title="HotPay — Merchants"
        description="Create and manage merchants issuing invoices."
      />

      <SectionHeader
        eyebrow="Directory"
        title="Merchants"
        description="Each merchant has its own payment options. Keep identity and payout destinations consistent."
        right={
          <Button
            data-testid="merchants-new"
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
            New merchant
          </Button>
        }
      />

      <div className="mt-6 grid gap-4">
        <Card className="glass grain rounded-3xl border-border/70 p-4 sm:p-5">
          <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            <div className="relative md:max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                data-testid="merchants-search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search merchants…"
                className="h-11 pl-9 rounded-2xl bg-background/30 border-border/70 focus-visible:ring-4 focus-visible:ring-ring/20"
              />
            </div>
            <div className="text-xs text-muted-foreground">
              {filtered.length} of {merchants.length}
            </div>
          </div>
        </Card>

        {merchantsQ.isLoading ? (
          <Card className="glass grain rounded-3xl border-border/70 p-8">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading merchants…
            </div>
          </Card>
        ) : merchantsQ.error ? (
          <Card className="glass grain rounded-3xl border-border/70 p-6">
            <div className="flex items-start gap-3">
              <TriangleAlert className="h-5 w-5 text-destructive mt-0.5" />
              <div>
                <div className="font-medium text-destructive">Failed to load merchants</div>
                <div className="text-sm text-muted-foreground">
                  {String((merchantsQ.error as Error).message ?? merchantsQ.error)}
                </div>
              </div>
            </div>
          </Card>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Building2 className="h-6 w-6 text-foreground/85" />}
            title={merchants.length === 0 ? "No merchants yet" : "No results"}
            description={
              merchants.length === 0
                ? "Create your first merchant to begin issuing AnyChain invoices."
                : "Try a different search query."
            }
            actionLabel={merchants.length === 0 ? "Create merchant" : "Clear search"}
            onAction={() => {
              if (merchants.length === 0) {
                setDialogMode("create");
                setEditing(null);
                setDialogOpen(true);
              } else {
                setQ("");
              }
            }}
            testId={merchants.length === 0 ? "merchants-empty-create" : "merchants-empty-clear"}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filtered.map((m) => (
              <Card
                key={m.id}
                className={cn(
                  "glass grain rounded-3xl border-border/70 p-5 sm:p-6",
                  "transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_22px_70px_rgba(0,0,0,.45)]",
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="font-display text-xl truncate">{m.name}</div>
                    <div className="mt-2 grid gap-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2 min-w-0">
                        <Globe className="h-4 w-4 shrink-0" />
                        <span className="truncate">{m.websiteUrl || "—"}</span>
                      </div>
                      <div className="flex items-center gap-2 min-w-0">
                        <Mail className="h-4 w-4 shrink-0" />
                        <span className="truncate">{m.contactEmail || "—"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      data-testid={`merchants-edit-${m.id}`}
                      variant="secondary"
                      size="icon"
                      className="rounded-2xl border border-border/70 hover:border-border transition-all duration-300"
                      onClick={() => {
                        setDialogMode("edit");
                        setEditing(m);
                        setDialogOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      data-testid={`merchants-delete-${m.id}`}
                      variant="secondary"
                      size="icon"
                      className="rounded-2xl border border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/16 transition-all duration-300"
                      onClick={() => {
                        setDeleting(m);
                        setConfirmOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="mt-5 h-px bg-gradient-to-r from-primary/14 via-accent/8 to-transparent" />

                <div className="mt-4 flex flex-col sm:flex-row gap-2">
                  <Button
                    data-testid={`merchants-open-invoices-${m.id}`}
                    variant="secondary"
                    className="rounded-2xl border border-border/70 hover:border-border transition-all duration-300"
                    onClick={() => {
                      window.location.href = `/invoices?merchantId=${encodeURIComponent(m.id)}`;
                    }}
                  >
                    View invoices
                  </Button>
                  <Button
                    data-testid={`merchants-open-options-${m.id}`}
                    variant="secondary"
                    className="rounded-2xl border border-border/70 hover:border-border transition-all duration-300"
                    onClick={() => {
                      window.location.href = `/payment-options?merchantId=${encodeURIComponent(m.id)}`;
                    }}
                  >
                    Payment options
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <MerchantDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        initial={editing}
        isSubmitting={createM.isPending || updateM.isPending}
        onSubmit={(values) => {
          const payload = {
            name: values.name,
            websiteUrl: values.websiteUrl || null,
            contactEmail: values.contactEmail || null,
          } as any;

          if (dialogMode === "create") {
            createM.mutate(payload, {
              onSuccess: () => {
                toast({ title: "Merchant created", description: "You can now configure payment options." });
                setDialogOpen(false);
              },
              onError: (e) => toast({ title: "Create failed", description: String((e as Error).message ?? e), variant: "destructive" }),
            });
          } else if (editing) {
            updateM.mutate(
              { id: editing.id, updates: payload },
              {
                onSuccess: () => {
                  toast({ title: "Merchant updated" });
                  setDialogOpen(false);
                },
                onError: (e) => toast({ title: "Update failed", description: String((e as Error).message ?? e), variant: "destructive" }),
              },
            );
          }
        }}
      />

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Delete merchant${deleting ? ` “${deleting.name}”` : ""}?`}
        description="This also deletes invoices and payment options linked to the merchant."
        confirmLabel={deleteM.isPending ? "Deleting..." : "Delete"}
        destructive
        testIdConfirm="merchants-confirm-delete"
        testIdCancel="merchants-cancel-delete"
        onConfirm={() => {
          if (!deleting) return;
          deleteM.mutate(deleting.id, {
            onSuccess: () => {
              toast({ title: "Merchant deleted" });
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
