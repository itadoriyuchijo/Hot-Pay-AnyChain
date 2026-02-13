import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  testId,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  testId?: string;
}) {
  return (
    <div className={cn("glass grain rounded-3xl p-8 sm:p-10 text-center")}>
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-border/70 bg-secondary/30">
        {icon}
      </div>
      <h3 className="mt-5 text-xl font-display">{title}</h3>
      {description ? (
        <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
          {description}
        </p>
      ) : null}
      {actionLabel && onAction ? (
        <div className="mt-6">
          <Button
            data-testid={testId}
            onClick={onAction}
            className={cn(
              "rounded-2xl px-6",
              "bg-gradient-to-r from-primary to-accent text-primary-foreground",
              "shadow-lg shadow-black/30 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0",
              "transition-all duration-300 ease-out",
            )}
          >
            {actionLabel}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
