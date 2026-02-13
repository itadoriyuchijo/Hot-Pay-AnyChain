import { useEffect, useMemo } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { SupportedPaymentOption, Merchant } from "@shared/schema";
import { insertSupportedPaymentOptionSchema } from "@shared/schema";

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
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

const formSchema = insertSupportedPaymentOptionSchema.extend({
  sortOrder: z.coerce.number().int().min(0).default(0),
  enabled: z.coerce.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

export function PaymentOptionDialog({
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
  initial?: SupportedPaymentOption | null;
  merchants: Merchant[];
  onSubmit: (values: FormValues) => void;
  isSubmitting?: boolean;
}) {
  const defaults = useMemo<FormValues>(
    () => ({
      merchantId: initial?.merchantId ?? (merchants[0]?.id ?? ""),
      chain: initial?.chain ?? "Ethereum",
      assetSymbol: initial?.assetSymbol ?? "USDC",
      receiveAddress: initial?.receiveAddress ?? "",
      enabled: initial?.enabled ?? true,
      sortOrder: (initial?.sortOrder as unknown as number) ?? 0,
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
      <DialogContent className="glass border border-border/70 sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            {mode === "create" ? "Add payment option" : "Edit payment option"}
          </DialogTitle>
          <DialogDescription>
            Configure which chain & asset a payer can use, plus the receive address.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <FormField
              control={form.control}
              name="merchantId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Merchant</FormLabel>
                  <FormControl>
                    <select
                      data-testid="payment-option-merchant"
                      className={cn(
                        "h-11 w-full rounded-2xl px-3",
                        "bg-background/30 border border-border/70",
                        "focus:outline-none focus:ring-4 focus:ring-ring/20 focus:border-primary/50",
                        "transition-all duration-200",
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="chain"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chain</FormLabel>
                    <FormControl>
                      <Input
                        data-testid="payment-option-chain"
                        placeholder="Ethereum / Polygon / Solana"
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
                name="assetSymbol"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asset</FormLabel>
                    <FormControl>
                      <Input
                        data-testid="payment-option-asset"
                        placeholder="USDC"
                        className="h-11 rounded-2xl bg-background/30 border-border/70 focus-visible:ring-4 focus-visible:ring-ring/20"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="receiveAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Receive address</FormLabel>
                  <FormControl>
                    <Input
                      data-testid="payment-option-address"
                      placeholder="0x..."
                      className="h-11 rounded-2xl bg-background/30 border-border/70 focus-visible:ring-4 focus-visible:ring-ring/20 font-mono"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <FormField
                control={form.control}
                name="sortOrder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sort order</FormLabel>
                    <FormControl>
                      <Input
                        data-testid="payment-option-sortOrder"
                        type="number"
                        className="h-11 rounded-2xl bg-background/30 border-border/70 focus-visible:ring-4 focus-visible:ring-ring/20"
                        value={field.value ?? 0}
                        onChange={(e) => field.onChange(e.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="sm:col-span-2 flex items-center justify-between rounded-2xl border border-border/70 bg-secondary/30 px-4 py-3">
                <div>
                  <div className="text-sm font-medium">Enabled</div>
                  <div className="text-xs text-muted-foreground">
                    Show this option on invoice checkout.
                  </div>
                </div>
                <FormField
                  control={form.control}
                  name="enabled"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Switch
                          data-testid="payment-option-enabled"
                          checked={!!field.value}
                          onCheckedChange={(v) => field.onChange(v)}
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
                data-testid="payment-option-cancel"
                type="button"
                variant="secondary"
                className="rounded-2xl border border-border/70"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                data-testid="payment-option-submit"
                type="submit"
                disabled={isSubmitting}
                className="rounded-2xl bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg shadow-black/30 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
              >
                {isSubmitting ? (mode === "create" ? "Adding..." : "Saving...") : mode === "create" ? "Add option" : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
