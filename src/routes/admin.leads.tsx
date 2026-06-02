import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { leadsService, dealersService } from "@/api/services";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScoreBadge, StatusBadge } from "@/components/common/StatusBadge";
import { LoadingBlock } from "@/components/common/Loading";
import { formatDate } from "@/lib/formatters";
import { useState } from "react";

export const Route = createFileRoute("/admin/leads")({
  component: AdminLeads,
});

function AdminLeads() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-leads"],
    queryFn: () => leadsService.list({ limit: 50 }),
  });
  const { data: dealers } = useQuery({
    queryKey: ["dealers"],
    queryFn: () => dealersService.list({ limit: 50 }),
  });
  const [reassignTo, setReassignTo] = useState<Record<string, string>>({});
  const assign = useMutation({
    mutationFn: ({ id, dealerId }: { id: string; dealerId: string }) => leadsService.assign(id, dealerId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-leads"] }),
  });

  if (isLoading) return <LoadingBlock />;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">All leads</h1>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned dealer</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Reassign</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data ?? []).map((l) => (
                <TableRow key={l.id}>
                  <TableCell>
                    <div className="font-medium">{l.customerName}</div>
                    <div className="text-xs text-muted-foreground">{l.referralCode}</div>
                  </TableCell>
                  <TableCell><ScoreBadge score={l.score} /></TableCell>
                  <TableCell><StatusBadge status={l.currentStatus} /></TableCell>
                  <TableCell className="text-sm">{dealers?.find((d) => d.id === l.assignedDealerId)?.name ?? "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(l.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Select value={reassignTo[l.id] ?? ""} onValueChange={(v) => setReassignTo((s) => ({ ...s, [l.id]: v }))}>
                        <SelectTrigger className="w-44 text-xs"><SelectValue placeholder="Choose dealer" /></SelectTrigger>
                        <SelectContent>
                          {(dealers ?? []).map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Button size="sm" variant="outline" disabled={!reassignTo[l.id]} onClick={() => reassignTo[l.id] && assign.mutate({ id: l.id, dealerId: reassignTo[l.id]! })}>
                        Assign
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
