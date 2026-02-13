import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { InvoiceStatus } from "@shared/schema";

const map: Record<string, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-secondary/40 text-foreground border-border/70" },
  unpaid: { label: "Unpaid", className: "bg-accent/12 text-accent border-accent/25" },
  paid: { label: "Paid", className: "bg-primary/14 text-primary border-primary/30" },
  expired: { label: "Expired", className: "bg-muted/30 text-muted-foreground border-border/70" },
  cancelled: { label: "Cancelled", className: "bg-destructive/12 text-destructive border-destructive/25" },
};

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus | string }) {
  const v = map[status] ?? { label: status, className: "bg-secondary/40 text-foreground border-border/70" };
  return (
    <Badge className={cn("rounded-full px-3 py-1 border", v.className)}>
      {v.label}
    </Badge>
  );
}
