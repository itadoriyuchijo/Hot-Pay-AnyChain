import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SectionHeader({
  eyebrow,
  title,
  description,
  right,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  right?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        {eyebrow ? (
          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground/80">
            {eyebrow}
          </div>
        ) : null}
        <h1 className={cn("mt-1 text-3xl sm:text-4xl leading-[1.05]")}>{title}</h1>
        {description ? (
          <p className="mt-3 max-w-2xl text-sm sm:text-base text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}
