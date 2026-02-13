import { useEffect, useState } from "react";
import { Seo } from "@/components/seo/Seo";
import { AppShell } from "@/components/layout/AppShell";
import { SectionHeader } from "@/components/common/SectionHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Moon, Sun, Sparkles, ShieldCheck, Eraser } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const { toast } = useToast();
  const [dark, setDark] = useState(true);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setDark(isDark);
  }, []);

  return (
    <AppShell>
      <Seo title="HotPay — Settings" description="Appearance and preferences for the HotPay dashboard." />

      <SectionHeader
        eyebrow="Preferences"
        title="Settings"
        description="Small switches. Big clarity."
      />

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="glass grain rounded-3xl border-border/70 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="font-display text-xl">Appearance</div>
              <p className="mt-2 text-sm text-muted-foreground">
                This app is designed for dark-mode operations. You can still toggle for testing.
              </p>
            </div>
            <div className="grid h-11 w-11 place-items-center rounded-2xl border border-border/70 bg-secondary/30">
              <Sparkles className="h-5 w-5 text-accent" />
            </div>
          </div>

          <div className="mt-5 flex flex-col sm:flex-row gap-2">
            <Button
              data-testid="settings-toggle-theme"
              className={cn(
                "rounded-2xl bg-gradient-to-r from-primary to-accent text-primary-foreground",
                "shadow-lg shadow-black/30 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300",
              )}
              onClick={() => {
                const next = !dark;
                setDark(next);
                document.documentElement.classList.toggle("dark", next);
                toast({ title: `Theme: ${next ? "Dark" : "Light"}` });
              }}
            >
              {dark ? <Moon className="h-4 w-4 mr-2" /> : <Sun className="h-4 w-4 mr-2" />}
              Toggle theme
            </Button>

            <Button
              data-testid="settings-reset-url"
              variant="secondary"
              className="rounded-2xl border border-border/70 hover:border-border transition-all duration-300"
              onClick={() => {
                window.history.replaceState(null, "", window.location.pathname);
                toast({ title: "URL cleaned", description: "Removed query params." });
              }}
            >
              <Eraser className="h-4 w-4 mr-2" />
              Clean URL params
            </Button>
          </div>
        </Card>

        <Card className="glass grain rounded-3xl border-border/70 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="font-display text-xl">Security posture</div>
              <p className="mt-2 text-sm text-muted-foreground">
                MVP dashboard: session cookies are expected (credentials included in fetch). No tokens stored in localStorage.
              </p>
            </div>
            <div className="grid h-11 w-11 place-items-center rounded-2xl border border-primary/30 bg-primary/10">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-border/70 bg-secondary/20 p-4 text-sm text-muted-foreground">
            If you see 401/403 errors, confirm your backend auth/session middleware and CORS credentials settings.
          </div>

          <div className="mt-4">
            <Button
              data-testid="settings-reload"
              variant="secondary"
              className="rounded-2xl border border-border/70 hover:border-border transition-all duration-300"
              onClick={() => window.location.reload()}
            >
              Reload app
            </Button>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
