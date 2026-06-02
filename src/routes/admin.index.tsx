import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { analyticsService } from "@/api/services";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { LoadingBlock } from "@/components/common/Loading";
import { formatMUR, formatPercent } from "@/lib/formatters";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

const COLORS = ["var(--primary)", "var(--secondary)", "var(--info)", "var(--success)", "var(--muted-foreground)"];

function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: () => analyticsService.admin(),
  });
  if (isLoading || !data) return <LoadingBlock />;
  const targetPct = data.monthlyTargetMUR ? data.monthlyProgressMUR / data.monthlyTargetMUR : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Platform overview</h1>
        <p className="text-sm text-muted-foreground">All leads, dealers, and commissions at a glance.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Total leads" value={data.totalLeads} />
        <Kpi label="Qualified rate" value={formatPercent(data.qualifiedRate)} />
        <Kpi label="Conversion" value={formatPercent(data.conversionRate)} />
        <Kpi label="Revenue (MTD)" value={formatMUR(data.revenueMUR)} tone="primary" />
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-baseline justify-between">
            <div>
              <h2 className="text-sm font-semibold">Monthly commission target</h2>
              <p className="text-xs text-muted-foreground">Goal: {formatMUR(data.monthlyTargetMUR)}</p>
            </div>
            <div className="text-right">
              <div className="text-xl font-semibold text-primary">{formatMUR(data.monthlyProgressMUR)}</div>
              <div className="text-xs text-muted-foreground">{formatPercent(targetPct)} of target</div>
            </div>
          </div>
          <Progress value={Math.min(100, targetPct * 100)} className="mt-3" />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <h2 className="mb-4 text-sm font-semibold">Conversion funnel</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.funnel}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="stage" stroke="var(--muted-foreground)" fontSize={11} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="count" fill="var(--primary)" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="mb-4 text-sm font-semibold">Lead source</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.sourceBreakdown} dataKey="count" nameKey="source" innerRadius={50} outerRadius={90}>
                    {data.sourceBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <h2 className="mb-4 text-sm font-semibold">Top dealers</h2>
          <div className="space-y-2">
            {data.topDealers.map((d) => (
              <div key={d.dealerId} className="flex items-center justify-between rounded-md border border-border bg-card p-3">
                <div>
                  <div className="font-medium">{d.name}</div>
                  <div className="text-xs text-muted-foreground">{d.sales} sales</div>
                </div>
                <div className="font-semibold text-primary">{formatMUR(d.revenueMUR)}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Kpi({ label, value, tone }: { label: string; value: string | number; tone?: "primary" }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className={`mt-2 text-2xl font-semibold ${tone === "primary" ? "text-primary" : ""}`}>{value}</div>
      </CardContent>
    </Card>
  );
}
