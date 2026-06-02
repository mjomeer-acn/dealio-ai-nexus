import { createFileRoute, useParams } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { leadsService } from "@/api/services";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { LoadingBlock } from "@/components/common/Loading";
import { ScoreBadge, StatusBadge } from "@/components/common/StatusBadge";
import { formatDateTime, formatMUR } from "@/lib/formatters";
import { useState } from "react";
import type { LeadStatusType } from "@/api/types";

export const Route = createFileRoute("/dealer/leads/$id")({
  component: LeadDetail,
});

const NEXT: Record<LeadStatusType, LeadStatusType[]> = {
  NEW: ["QUALIFIED"],
  QUALIFIED: ["ASSIGNED"],
  ASSIGNED: ["CONTACTED", "LOST"],
  CONTACTED: ["NEGOTIATING", "LOST"],
  NEGOTIATING: ["SOLD", "LOST"],
  SOLD: [],
  LOST: [],
};

function LeadDetail() {
  const { id } = useParams({ from: "/dealer/leads/$id" });
  const qc = useQueryClient();
  const { data: lead, isLoading } = useQuery({
    queryKey: ["lead", id],
    queryFn: () => leadsService.get(id),
  });
  const [nextStatus, setNextStatus] = useState<LeadStatusType | "">("");
  const [comment, setComment] = useState("");
  const [saleAmount, setSaleAmount] = useState<string>("");
  const [lostReason, setLostReason] = useState("");

  const update = useMutation({
    mutationFn: (data: Parameters<typeof leadsService.updateStatus>[1]) =>
      leadsService.updateStatus(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lead", id] });
      qc.invalidateQueries({ queryKey: ["dealer-leads"] });
      setNextStatus("");
      setComment("");
      setSaleAmount("");
      setLostReason("");
    },
  });

  if (isLoading || !lead) return <LoadingBlock />;
  const options = NEXT[lead.currentStatus];

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{lead.customerName}</h1>
            <p className="text-sm text-muted-foreground">Ref · {lead.referralCode}</p>
          </div>
          <div className="flex gap-2">
            <ScoreBadge score={lead.score} />
            <StatusBadge status={lead.currentStatus} />
          </div>
        </div>

        <Card>
          <CardContent className="grid gap-4 p-6 sm:grid-cols-2">
            <Info label="Email" value={lead.customerEmail} />
            <Info label="Phone" value={lead.customerPhone} />
            <Info label="Source" value={lead.source} />
            <Info label="Budget" value={lead.qualification.budgetMURMax ? `${formatMUR(lead.qualification.budgetMURMin ?? 0)} – ${formatMUR(lead.qualification.budgetMURMax)}` : "—"} />
            <Info label="Timeline" value={lead.qualification.timeline ?? "—"} />
            <Info label="Financing" value={lead.qualification.financingNeeded ? "Yes" : "No"} />
            <Info label="Preferred make" value={lead.qualification.preferredMake ?? "—"} />
            <Info label="Body type" value={lead.qualification.preferredBodyType ?? "—"} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="text-sm font-semibold">Status timeline</h2>
            <ol className="mt-4 space-y-4">
              {[...lead.statusHistory].reverse().map((s) => (
                <li key={s.id} className="flex gap-3">
                  <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <StatusBadge status={s.status} />
                      <span className="text-xs text-muted-foreground">{formatDateTime(s.timestamp)}</span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">By {s.userName}</div>
                    {s.comment && <p className="mt-1 text-sm">{s.comment}</p>}
                  </div>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>

      <aside className="space-y-4">
        <Card>
          <CardContent className="space-y-3 p-6">
            <h2 className="text-sm font-semibold">Advance status</h2>
            {options.length === 0 ? (
              <p className="text-sm text-muted-foreground">No further status changes available.</p>
            ) : (
              <>
                <div className="grid gap-1.5">
                  <Label>Next status</Label>
                  <Select value={nextStatus} onValueChange={(v) => setNextStatus(v as LeadStatusType)}>
                    <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                    <SelectContent>
                      {options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {nextStatus === "SOLD" && (
                  <div className="grid gap-1.5">
                    <Label>Sale amount (MUR)</Label>
                    <Input type="number" value={saleAmount} onChange={(e) => setSaleAmount(e.target.value)} placeholder="2500000" />
                  </div>
                )}
                {nextStatus === "LOST" && (
                  <div className="grid gap-1.5">
                    <Label>Lost reason</Label>
                    <Input value={lostReason} onChange={(e) => setLostReason(e.target.value)} />
                  </div>
                )}
                <div className="grid gap-1.5">
                  <Label>Comment</Label>
                  <Textarea rows={3} value={comment} onChange={(e) => setComment(e.target.value)} />
                </div>
                <Button
                  className="w-full"
                  disabled={!nextStatus || update.isPending || (nextStatus === "SOLD" && !saleAmount)}
                  onClick={() => nextStatus && update.mutate({
                    status: nextStatus,
                    comment: comment || undefined,
                    saleAmountMUR: saleAmount ? Number(saleAmount) : undefined,
                    lostReason: lostReason || undefined,
                  })}
                >
                  {update.isPending ? "Saving…" : "Update status"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {lead.saleAmountMUR && (
          <Card className="border-success/30 bg-success/5">
            <CardContent className="p-6">
              <h2 className="text-sm font-semibold text-success">Sale closed</h2>
              <Separator className="my-2" />
              <Info label="Amount" value={formatMUR(lead.saleAmountMUR)} />
              <Info label="Closed at" value={formatDateTime(lead.saleClosedAt)} />
            </CardContent>
          </Card>
        )}
      </aside>
    </div>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}
