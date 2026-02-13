import { PropsWithChildren, useMemo } from "react";
import { Link, useLocation } from "wouter";
import {
  Banknote,
  Blocks,
  ReceiptText,
  Settings2,
  LayoutDashboard,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  testId: string;
};

function useNavItems(): NavItem[] {
  return useMemo(
    () => [
      { href: "/", label: "Dashboard", icon: LayoutDashboard, testId: "nav-dashboard" },
      { href: "/invoices", label: "Invoices", icon: ReceiptText, testId: "nav-invoices" },
      { href: "/merchants", label: "Merchants", icon: Banknote, testId: "nav-merchants" },
      { href: "/payment-options", label: "Payment Options", icon: Blocks, testId: "nav-payment-options" },
      { href: "/settings", label: "Settings", icon: Settings2, testId: "nav-settings" },
    ],
    [],
  );
}

function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          "relative grid h-10 w-10 place-items-center rounded-2xl",
          "bg-gradient-to-br from-primary/90 via-accent/70 to-[hsl(268_78%_64%)]/70",
          "shadow-glow-primary grain overflow-hidden",
        )}
      >
        <Sparkles className="h-5 w-5 text-primary-foreground drop-shadow" />
        <div className="absolute inset-0 opacity-70 [mask-image:radial-gradient(circle_at_35%_20%,black,transparent_60%)] bg-white/10" />
      </div>
      <div className="leading-tight">
        <div className="font-display text-lg tracking-tight">HotPay</div>
        <div className="text-xs text-muted-foreground">AnyChain Invoices</div>
      </div>
    </div>
  );
}

export function AppShell({ children }: PropsWithChildren) {
  const [location] = useLocation();
  const nav = useNavItems();

  return (
    <div className="min-h-screen bg-mesh">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="py-6 lg:py-10">
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 lg:gap-10 items-start">
            <aside className="lg:sticky lg:top-8">
              <div className="glass grain rounded-3xl p-4 sm:p-5 shadow-glow-accent">
                <div className="flex items-center justify-between gap-3">
                  <BrandMark />
                  <div className="hidden sm:flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-secondary/40 px-2.5 py-1 text-xs text-muted-foreground">
                      <span className="inline-block h-2 w-2 rounded-full bg-primary shadow-[0_0_18px_hsl(var(--primary)/0.45)]" />
                      Live
                    </span>
                  </div>
                </div>

                <div className="mt-5 grid gap-2">
                  {nav.map((item) => {
                    const active = location === item.href || (item.href !== "/" && location.startsWith(item.href));
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        data-testid={item.testId}
                        className={cn(
                          "group relative flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm",
                          "transition-all duration-300 ease-out",
                          "outline-none focus-visible:ring-4 focus-visible:ring-ring/20 focus-visible:border-primary/40",
                          active
                            ? "bg-gradient-to-r from-primary/16 via-accent/10 to-transparent border border-border/70 shadow-[0_12px_40px_hsl(var(--primary)/0.09)]"
                            : "hover:bg-secondary/45 border border-transparent hover:border-border/60",
                        )}
                      >
                        <div
                          className={cn(
                            "grid h-9 w-9 place-items-center rounded-xl border",
                            active
                              ? "border-primary/30 bg-primary/12 text-primary"
                              : "border-border/70 bg-secondary/30 text-muted-foreground group-hover:text-foreground",
                            "transition-all duration-300",
                          )}
                        >
                          <Icon className="h-4.5 w-4.5" />
                        </div>
                        <div className="flex-1">
                          <div className={cn(active ? "text-foreground" : "text-foreground/90")}>
                            {item.label}
                          </div>
                          <div className="text-xs text-muted-foreground/80 hidden sm:block">
                            {item.href === "/"
                              ? "Overview & health"
                              : item.href === "/invoices"
                                ? "Create, track, reconcile"
                                : item.href === "/merchants"
                                  ? "Profiles & identity"
                                  : item.href === "/payment-options"
                                    ? "Chains, assets, addresses"
                                    : "Preferences"}
                          </div>
                        </div>
                        <ChevronRight
                          className={cn(
                            "h-4 w-4 text-muted-foreground/70 transition-all duration-300",
                            active ? "translate-x-0 opacity-100" : "-translate-x-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-0",
                          )}
                        />
                      </Link>
                    );
                  })}
                </div>

                <div className="mt-5 rounded-2xl border border-border/70 bg-gradient-to-br from-secondary/35 to-transparent p-4">
                  <div className="text-sm font-medium">Quick actions</div>
                  <div className="mt-3 flex flex-col sm:flex-row gap-2">
                    <Link href="/invoices?new=1" className="w-full">
                      <Button
                        data-testid="quick-new-invoice"
                        className={cn(
                          "w-full rounded-2xl",
                          "bg-gradient-to-r from-primary to-accent text-primary-foreground",
                          "shadow-lg shadow-black/30 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0",
                          "transition-all duration-300 ease-out",
                        )}
                      >
                        New invoice
                      </Button>
                    </Link>
                    <Link href="/merchants?new=1" className="w-full">
                      <Button
                        data-testid="quick-new-merchant"
                        variant="secondary"
                        className="w-full rounded-2xl border border-border/70 hover:border-border transition-all duration-300"
                      >
                        Add merchant
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </aside>

            <main className="min-w-0">
              <div className="animate-in-up">{children}</div>
              <footer className="mt-10 pb-10 text-xs text-muted-foreground/80">
                <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
                  <div>
                    Built for multi-chain payment links.{" "}
                    <span className="text-foreground/80">Dark-mode first.</span>
                  </div>
                  <div className="text-muted-foreground/70">
                    HotPay AnyChain • MVP UI
                  </div>
                </div>
              </footer>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
