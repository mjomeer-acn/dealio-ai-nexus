import { Badge } from "@/components/ui/badge";
import type { LeadStatusType, LeadScore, CommissionStatus } from "@/api/types";
import { cn } from "@/lib/utils";

const statusStyles: Record<LeadStatusType, string> = {
  NEW: "bg-muted text-muted-foreground",
  QUALIFIED: "bg-info/15 text-info border-info/30",
  ASSIGNED: "bg-secondary/30 text-secondary-foreground border-secondary/40",
  CONTACTED: "bg-secondary/40 text-secondary-foreground border-secondary/50",
  NEGOTIATING: "bg-warning/20 text-warning-foreground border-warning/40",
  SOLD: "bg-success/15 text-success border-success/30",
  LOST: "bg-destructive/15 text-destructive border-destructive/30",
};

export function StatusBadge({ status }: { status: LeadStatusType }) {
  return (
    <Badge variant="outline" className={cn("font-medium", statusStyles[status])}>
      {status}
    </Badge>
  );
}

const scoreStyles: Record<LeadScore, string> = {
  HOT: "bg-primary text-primary-foreground border-primary",
  WARM: "bg-secondary text-secondary-foreground border-secondary",
  COLD: "bg-muted text-muted-foreground border-border",
};

export function ScoreBadge({ score }: { score: LeadScore }) {
  return (
    <Badge variant="outline" className={cn("font-semibold tracking-wide", scoreStyles[score])}>
      {score}
    </Badge>
  );
}

const commissionStyles: Record<CommissionStatus, string> = {
  PENDING: "bg-muted text-muted-foreground",
  INVOICED: "bg-info/15 text-info border-info/30",
  PAID: "bg-success/15 text-success border-success/30",
  DISPUTED: "bg-destructive/15 text-destructive border-destructive/30",
};

export function CommissionStatusBadge({ status }: { status: CommissionStatus }) {
  return (
    <Badge variant="outline" className={cn("font-medium", commissionStyles[status])}>
      {status}
    </Badge>
  );
}