import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersService } from "@/api/services";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { LoadingBlock } from "@/components/common/Loading";
import { formatDate } from "@/lib/formatters";

export const Route = createFileRoute("/admin/users")({
  component: AdminUsers,
});

function AdminUsers() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => usersService.list({ limit: 50 }),
  });
  const update = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Parameters<typeof usersService.update>[1] }) =>
      usersService.update(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });
  if (isLoading) return <LoadingBlock />;
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Users & Roles</h1>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>MFA</TableHead>
                <TableHead>Last login</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Reset MFA</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data ?? []).map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="font-medium">{u.firstName} {u.lastName}</div>
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                  </TableCell>
                  <TableCell className="flex flex-wrap gap-1">
                    {u.roles.map((r) => <Badge key={r} variant="secondary">{r}</Badge>)}
                  </TableCell>
                  <TableCell>{u.mfaEnabled ? "On" : "Off"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(u.lastLoginAt)}</TableCell>
                  <TableCell>
                    <Switch checked={u.active} onCheckedChange={(c) => update.mutate({ id: u.id, patch: { active: c } })} />
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="ghost" onClick={() => update.mutate({ id: u.id, patch: { mfaEnabled: false } })}>Reset</Button>
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
