import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dealersService } from "@/api/services";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingBlock } from "@/components/common/Loading";

export const Route = createFileRoute("/admin/dealers")({
  component: AdminDealers,
});

function AdminDealers() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["dealers-admin"],
    queryFn: () => dealersService.list({ limit: 50 }),
  });
  const update = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Parameters<typeof dealersService.update>[1] }) =>
      dealersService.update(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dealers-admin"] }),
  });
  if (isLoading) return <LoadingBlock />;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Dealers</h1>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dealer</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead>Staff</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data ?? []).map((d) => (
                <TableRow key={d.id}>
                  <TableCell>
                    <div className="font-medium">{d.name}</div>
                    <div className="text-xs text-muted-foreground">{d.email}</div>
                  </TableCell>
                  <TableCell>{d.city}</TableCell>
                  <TableCell>
                    <Badge variant={d.status === "ACTIVE" ? "default" : d.status === "PENDING" ? "secondary" : "destructive"}>
                      {d.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{Math.round(d.commissionRate * 1000) / 10}%</TableCell>
                  <TableCell>{d.staffCount}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {d.status !== "ACTIVE" && (
                        <Button size="sm" onClick={() => update.mutate({ id: d.id, patch: { status: "ACTIVE" } })}>Approve</Button>
                      )}
                      {d.status !== "SUSPENDED" && (
                        <Button size="sm" variant="outline" onClick={() => update.mutate({ id: d.id, patch: { status: "SUSPENDED" } })}>Suspend</Button>
                      )}
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
