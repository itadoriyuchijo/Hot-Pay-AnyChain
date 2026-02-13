import { useEffect, useMemo } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPaymentSchema } from "@shared/schema";
import type { Payment } from "@shared/schema";

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

const formSchema = insertPaymentSchema.extend({
  amount: z.string().min(1, "Amount is required"),
});

type FormValues = z.infer<typeof formSchema>;

export function CreatePaymentDialog({
  open,
  onOpenChange,
  invoiceId,
  onSubmit,
  isSubmitting,
  initial,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  invoiceId: string;
  onSubmit: (values: FormValues) => void;
  isSubmitting?: boolean;
  initial?: Partial<Payment> | null;
}) {
  const defaults = useMemo<FormValues>(
    () => ({
      invoiceId,
      chain: initial?.chain ?? "Ethereum",
      assetSymbol: initial?.assetSymbol ?? "USDC",
      toAddress: initial?.toAddress ?? "",
      fromAddress: initial?.fromAddress ?? "",
      amount: typeof initial?.amount === "string" ? initial.amount : String(initial?.amount ?? ""),
      txHash: initial?.txHash ?? "",
      status: (initial?.status as any) ?? "detected",
    }),
    [invoiceId, initial],
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaults,
  });

  useEffect(() => {
    form.reset(defaults);
  }, [defaults, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass border border-border/70 sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Add payment record</DialogTitle>
          <DialogDescription>
            MVP mode: manually record an on-chain payment detection/confirmation.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="chain"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chain</FormLabel>
                    <FormControl>
                      <Input
                        data-testid="payment-chain"
                        className="h-11 rounded-2xl bg-background/30 border-border/70 focus-visible:ring-4 focus-visible:ring-ring/20"
                        placeholder="Ethereum"
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
                        data-testid="payment-asset"
                        className="h-11 rounded-2xl bg-background/30 border-border/70 focus-visible:ring-4 focus-visible:ring-ring/20"
                        placeholder="USDC"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="toAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>To address</FormLabel>
                    <FormControl>
                      <Input
                        data-testid="payment-toAddress"
                        className="h-11 rounded-2xl bg-background/30 border-border/70 focus-visible:ring-4 focus-visible:ring-ring/20 font-mono text-xs"
                        placeholder="0x..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fromAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>From address (optional)</FormLabel>
                    <FormControl>
                      <Input
                        data-testid="payment-fromAddress"
                        className="h-11 rounded-2xl bg-background/30 border-border/70 focus-visible:ring-4 focus-visible:ring-ring/20 font-mono text-xs"
                        placeholder="0x..."
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input
                        data-testid="payment-amount"
                        className="h-11 rounded-2xl bg-background/30 border-border/70 focus-visible:ring-4 focus-visible:ring-ring/20"
                        placeholder="199.00"
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
                name="txHash"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Tx hash (optional)</FormLabel>
                    <FormControl>
                      <Input
                        data-testid="payment-txHash"
                        className="h-11 rounded-2xl bg-background/30 border-border/70 focus-visible:ring-4 focus-visible:ring-ring/20 font-mono text-xs"
                        placeholder="0x..."
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="mt-2 gap-2 sm:gap-3">
              <Button
                data-testid="payment-cancel"
                type="button"
                variant="secondary"
                className="rounded-2xl border border-border/70"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                data-testid="payment-submit"
                type="submit"
                disabled={isSubmitting}
                className="rounded-2xl bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg shadow-black/30 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
              >
                {isSubmitting ? "Saving..." : "Create payment"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
