import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { leadsService } from "@/api/services";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ScoreBadge, StatusBadge } from "@/components/common/StatusBadge";
import { LoadingBlock } from "@/components/common/Loading";
import { EmptyState } from "@/components/common/EmptyState";
import { Inbox } from "lucide-react";
import { formatDate } from "@/lib/formatters";

export const Route = createFileRoute("/dealer/leads")({
  component: LeadInbox,
});

function LeadInbox() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["dealer-leads"],
    queryFn: () => leadsService.list({ limit: 50 }),
  });
  const accept = useMutation({
    mutationFn: (id: string) => leadsService.accept(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dealer-leads"] }),
  });
  const decline = useMutation({
    mutationFn: (id: string) => leadsService.decline(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dealer-leads"] }),
  });

  if (isLoading) return <LoadingBlock />;
  if (!data || data.length === 0)
    return <EmptyState icon={<Inbox className="h-8 w-8" />} title="Inbox is empty" description="New leads will appear here." />;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Lead Inbox</h1>
        <p className="text-sm text-muted-foreground">Accept ownership within 90 days of assignment.</p>
      </div>
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assigned</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((l) => (
              <TableRow key={l.id}>
                <TableCell>
                  <Link to="/dealer/leads/$id" params={{ id: l.id }} className="font-medium hover:underline">
                    {l.customerName}
                  </Link>
                  <div className="text-xs text-muted-foreground">{l.referralCode}</div>
                </TableCell>
                <TableCell><ScoreBadge score={l.score} /></TableCell>
                <TableCell><StatusBadge status={l.currentStatus} /></TableCell>
                <TableCell className="text-sm text-muted-foreground">{formatDate(l.assignedAt)}</TableCell>
                <TableCell>
                  {l.currentStatus === "ASSIGNED" ? (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => accept.mutate(l.id)} disabled={accept.isPending}>Accept</Button>
                      <Button size="sm" variant="outline" onClick={() => decline.mutate(l.id)} disabled={decline.isPending}>Decline</Button>
                    </div>
                  ) : (
                    <Button asChild size="sm" variant="ghost">
                      <Link to="/dealer/leads/$id" params={{ id: l.id }}>Open</Link>
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
