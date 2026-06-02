import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { analyticsService } from "@/api/services";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingBlock } from "@/components/common/Loading";
import { formatMUR, formatPercent } from "@/lib/formatters";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export const Route = createFileRoute("/dealer/")({
  component: DealerDashboard,
});

function DealerDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["dealer-analytics"],
    queryFn: () => analyticsService.dealer(),
  });
  if (isLoading || !data) return <LoadingBlock />;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Lead pipeline and commission overview.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Assigned leads" value={data.assignedLeads} />
        <Kpi label="In progress" value={data.inProgress} />
        <Kpi label="Won" value={data.won} tone="success" />
        <Kpi label="Commission" value={formatMUR(data.commissionMUR)} tone="primary" />
      </div>
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardContent className="p-6">
            <h2 className="mb-4 text-sm font-semibold">Last 7 days</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={12} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="leads" fill="var(--primary)" radius={4} />
                  <Bar dataKey="sales" fill="var(--secondary)" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-3 p-6">
            <h2 className="text-sm font-semibold">Performance</h2>
            <Stat label="Conversion rate" value={formatPercent(data.conversionRate)} />
            <Stat label="Avg response time" value={`${data.avgResponseTimeMins} min`} />
            <Stat label="Lost leads" value={data.lost} />
            <Stat label="Accepted" value={data.acceptedLeads} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Kpi({ label, value, tone }: { label: string; value: string | number; tone?: "primary" | "success" }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className={`mt-2 text-2xl font-semibold ${tone === "primary" ? "text-primary" : tone === "success" ? "text-success" : ""}`}>{value}</div>
      </CardContent>
    </Card>
  );
}
function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
