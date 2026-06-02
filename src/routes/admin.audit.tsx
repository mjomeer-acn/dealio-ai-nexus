import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { auditService } from "@/api/services";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LoadingBlock } from "@/components/common/Loading";
import { formatDateTime } from "@/lib/formatters";
import { useState } from "react";
import type { AuditLog } from "@/api/types";

export const Route = createFileRoute("/admin/audit")({
  component: Audit,
});

function Audit() {
  const [q, setQ] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["audit", q],
    queryFn: () => auditService.list({ q, limit: 100 }),
  });
  if (isLoading) return <LoadingBlock />;
  const rows = (data ?? []) as AuditLog[];
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Audit log</h1>
      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search actions, entity, actor…" className="max-w-sm" />
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-sm">{formatDateTime(r.createdAt)}</TableCell>
                  <TableCell>{r.actorName}</TableCell>
                  <TableCell className="font-mono text-xs">{r.action}</TableCell>
                  <TableCell className="text-sm">{r.entityType} · {r.entityId.slice(0, 10)}…</TableCell>
                  <TableCell className="font-mono text-xs">{r.ip}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
