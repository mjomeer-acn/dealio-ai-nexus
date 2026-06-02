import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { commissionsService } from "@/api/services";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CommissionStatusBadge } from "@/components/common/StatusBadge";
import { LoadingBlock } from "@/components/common/Loading";
import { formatDate, formatMUR } from "@/lib/formatters";

export const Route = createFileRoute("/dealer/commissions")({
  component: Commissions,
});

function Commissions() {
  const { data, isLoading } = useQuery({
    queryKey: ["dealer-commissions"],
    queryFn: () => commissionsService.list(),
  });
  if (isLoading) return <LoadingBlock />;
  const total = (data ?? []).reduce((s, c) => s + c.amountMUR, 0);
  const paid = (data ?? []).filter((c) => c.status === "PAID").reduce((s, c) => s + c.amountMUR, 0);
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Commissions</h1>
        <p className="text-sm text-muted-foreground">Earned per sale.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="p-5"><div className="text-xs uppercase tracking-wider text-muted-foreground">Total</div><div className="mt-2 text-2xl font-semibold text-primary">{formatMUR(total)}</div></CardContent></Card>
        <Card><CardContent className="p-5"><div className="text-xs uppercase tracking-wider text-muted-foreground">Paid</div><div className="mt-2 text-2xl font-semibold text-success">{formatMUR(paid)}</div></CardContent></Card>
        <Card><CardContent className="p-5"><div className="text-xs uppercase tracking-wider text-muted-foreground">Outstanding</div><div className="mt-2 text-2xl font-semibold">{formatMUR(total - paid)}</div></CardContent></Card>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Sale amount</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead>Commission</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Paid</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data ?? []).map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.invoiceNumber ?? "—"}</TableCell>
                  <TableCell>{formatMUR(c.saleAmountMUR)}</TableCell>
                  <TableCell>{Math.round(c.rate * 1000) / 10}%</TableCell>
                  <TableCell className="font-medium text-primary">{formatMUR(c.amountMUR)}</TableCell>
                  <TableCell><CommissionStatusBadge status={c.status} /></TableCell>
                  <TableCell>{formatDate(c.paidAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
