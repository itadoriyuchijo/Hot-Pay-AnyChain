import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "primary",
}: {
  label: string;
  value: string;
  hint?: string;
  icon: ReactNode;
  tone?: "primary" | "accent" | "neutral" | "danger";
}) {
  const toneStyles =
    tone === "primary"
      ? "from-primary/18 via-primary/8 to-transparent"
      : tone === "accent"
        ? "from-accent/18 via-accent/8 to-transparent"
        : tone === "danger"
          ? "from-destructive/18 via-destructive/8 to-transparent"
          : "from-secondary/60 via-secondary/25 to-transparent";

  const iconStyles =
    tone === "primary"
      ? "text-primary border-primary/30 bg-primary/10"
      : tone === "accent"
        ? "text-accent border-accent/30 bg-accent/10"
        : tone === "danger"
          ? "text-destructive border-destructive/30 bg-destructive/10"
          : "text-foreground/80 border-border/60 bg-secondary/30";

  return (
    <div
      className={cn(
        "glass grain rounded-3xl p-5 sm:p-6",
        "transition-all duration-300 ease-out",
        "hover:-translate-y-0.5 hover:shadow-[0_22px_70px_rgba(0,0,0,.45)]",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground/80">
            {label}
          </div>
          <div className="mt-2 text-3xl font-display">{value}</div>
          {hint ? <div className="mt-2 text-sm text-muted-foreground">{hint}</div> : null}
        </div>

        <div
          className={cn(
            "grid h-11 w-11 place-items-center rounded-2xl border",
            iconStyles,
          )}
        >
          {icon}
        </div>
      </div>

      <div className={cn("mt-5 h-px w-full bg-gradient-to-r", toneStyles)} />
    </div>
  );
}
