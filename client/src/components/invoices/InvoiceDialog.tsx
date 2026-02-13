import { useEffect, useMemo } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Invoice, Merchant } from "@shared/schema";
import { insertInvoiceSchema } from "@shared/schema";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const formSchema = insertInvoiceSchema.extend({
  amount: z.string().min(1, "Amount is required"),
  expiresAt: z.string().optional().or(z.literal("")),
});

type FormValues = z.infer<typeof formSchema>;

export function InvoiceDialog({
  open,
  onOpenChange,
  mode,
  initial,
  merchants,
  onSubmit,
  isSubmitting,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  mode: "create" | "edit";
  initial?: Invoice | null;
  merchants: Merchant[];
  onSubmit: (values: FormValues) => void;
  isSubmitting?: boolean;
}) {
  const defaults = useMemo<FormValues>(
    () => ({
      merchantId: initial?.merchantId ?? (merchants[0]?.id ?? ""),
      status: (initial?.status as any) ?? "unpaid",
      title: initial?.title ?? "",
      description: initial?.description ?? "",
      currency: initial?.currency ?? "USD",
      amount: typeof initial?.amount === "string" ? initial.amount : String(initial?.amount ?? ""),
      memo: initial?.memo ?? "",
      metadata: (initial?.metadata as any) ?? {},
      expiresAt: initial?.expiresAt ? String(initial.expiresAt) : "",
    }),
    [initial, merchants],
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaults,
  });

  useEffect(() => {
    form.reset(defaults);
  }, [defaults, form]);

  const merchantOptions = merchants.map((m) => ({ id: m.id, name: m.name }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass border border-border/70 sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            {mode === "create" ? "Create invoice" : "Edit invoice"}
          </DialogTitle>
          <DialogDescription>
            Build a payment link that can be paid on multiple chains/assets. Amount is stored as a decimal string.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="merchantId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Merchant</FormLabel>
                    <FormControl>
                      <select
                        data-testid="invoice-merchant"
                        className={cn(
                          "h-11 w-full rounded-2xl px-3",
                          "bg-background/30 border border-border/70",
                          "focus:outline-none focus:ring-4 focus:ring-ring/20 focus:border-primary/50 transition-all duration-200",
                        )}
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                      >
                        {merchantOptions.length === 0 ? (
                          <option value="">No merchants found</option>
                        ) : null}
                        {merchantOptions.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <FormControl>
                        <Input
                          data-testid="invoice-currency"
                          placeholder="USD"
                          className="h-11 rounded-2xl bg-background/30 border-border/70 focus-visible:ring-4 focus-visible:ring-ring/20"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <Input
                          data-testid="invoice-amount"
                          placeholder="199.00"
                          className="h-11 rounded-2xl bg-background/30 border-border/70 focus-visible:ring-4 focus-visible:ring-ring/20"
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      </FormControl>
                      <div className="mt-1 text-xs text-muted-foreground">
                        Keep as a decimal string (e.g., 199.00).
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input
                      data-testid="invoice-title"
                      placeholder="On-chain subscription renewal"
                      className="h-11 rounded-2xl bg-background/30 border-border/70 focus-visible:ring-4 focus-visible:ring-ring/20"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        data-testid="invoice-description"
                        placeholder="What is this invoice for?"
                        className="min-h-28 rounded-2xl bg-background/30 border-border/70 focus-visible:ring-4 focus-visible:ring-ring/20"
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-4">
                <FormField
                  control={form.control}
                  name="memo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Memo</FormLabel>
                      <FormControl>
                        <Textarea
                          data-testid="invoice-memo"
                          placeholder="Optional internal memo"
                          className="min-h-28 rounded-2xl bg-background/30 border-border/70 focus-visible:ring-4 focus-visible:ring-ring/20"
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="expiresAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expires at (ISO or blank)</FormLabel>
                      <FormControl>
                        <Input
                          data-testid="invoice-expiresAt"
                          placeholder="2026-12-31T23:59:00Z"
                          className="h-11 rounded-2xl bg-background/30 border-border/70 focus-visible:ring-4 focus-visible:ring-ring/20 font-mono text-xs"
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DialogFooter className="mt-2 gap-2 sm:gap-3">
              <Button
                data-testid="invoice-cancel"
                type="button"
                variant="secondary"
                className="rounded-2xl border border-border/70"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                data-testid="invoice-submit"
                type="submit"
                disabled={isSubmitting}
                className="rounded-2xl bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg shadow-black/30 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
              >
                {isSubmitting ? (mode === "create" ? "Creating..." : "Saving...") : mode === "create" ? "Create invoice" : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
