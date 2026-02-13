import { useEffect, useMemo } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Merchant } from "@shared/schema";
import { insertMerchantSchema } from "@shared/schema";

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

const formSchema = insertMerchantSchema.extend({
  websiteUrl: z.string().url("Enter a valid URL").optional().or(z.literal("")),
  contactEmail: z.string().email("Enter a valid email").optional().or(z.literal("")),
});

type FormValues = z.infer<typeof formSchema>;

export function MerchantDialog({
  open,
  onOpenChange,
  mode,
  initial,
  onSubmit,
  isSubmitting,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  mode: "create" | "edit";
  initial?: Merchant | null;
  onSubmit: (values: FormValues) => void;
  isSubmitting?: boolean;
}) {
  const defaults = useMemo<FormValues>(
    () => ({
      name: initial?.name ?? "",
      websiteUrl: initial?.websiteUrl ?? "",
      contactEmail: initial?.contactEmail ?? "",
    }),
    [initial],
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
      <DialogContent className="glass border border-border/70 sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            {mode === "create" ? "Create merchant" : "Edit merchant"}
          </DialogTitle>
          <DialogDescription>
            Merchants are the identity behind your payment links. Add a website and contact for receipts.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((v) => onSubmit(v))}
            className="grid gap-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Merchant name</FormLabel>
                  <FormControl>
                    <Input
                      data-testid="merchant-name"
                      placeholder="Acme Labs"
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
                name="websiteUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <Input
                        data-testid="merchant-website"
                        placeholder="https://acme.com"
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
                name="contactEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact email</FormLabel>
                    <FormControl>
                      <Input
                        data-testid="merchant-email"
                        placeholder="billing@acme.com"
                        className="h-11 rounded-2xl bg-background/30 border-border/70 focus-visible:ring-4 focus-visible:ring-ring/20"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="mt-2 gap-2 sm:gap-3">
              <Button
                data-testid="merchant-cancel"
                type="button"
                variant="secondary"
                className="rounded-2xl border border-border/70"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                data-testid="merchant-submit"
                type="submit"
                disabled={isSubmitting}
                className="rounded-2xl bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg shadow-black/30 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
              >
                {isSubmitting ? (mode === "create" ? "Creating..." : "Saving...") : mode === "create" ? "Create merchant" : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
