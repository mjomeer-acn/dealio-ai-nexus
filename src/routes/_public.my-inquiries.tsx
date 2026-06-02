import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { leadsService } from "@/api/services";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { LoadingBlock } from "@/components/common/Loading";
import { EmptyState } from "@/components/common/EmptyState";
import { ScoreBadge, StatusBadge } from "@/components/common/StatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/formatters";
import { Inbox } from "lucide-react";

export const Route = createFileRoute("/_public/my-inquiries")({
  head: () => ({ meta: [{ title: "My inquiries — Dealio" }] }),
  component: () => (
    <ProtectedRoute requiredRoles={["CUSTOMER", "ADMIN", "SUPER_ADMIN", "DEALER", "DEALER_STAFF"]}>
      <MyInquiriesPage />
    </ProtectedRoute>
  ),
});

function MyInquiriesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["my-leads"],
    queryFn: () => leadsService.list({ limit: 20 }),
  });
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight">My inquiries</h1>
      <p className="mt-1 text-sm text-muted-foreground">Track every lead you've submitted.</p>
      <div className="mt-6 space-y-3">
        {isLoading && <LoadingBlock />}
        {!isLoading && (!data || data.length === 0) && (
          <EmptyState
            icon={<Inbox className="h-8 w-8" />}
            title="No inquiries yet"
            description="Try the AI advisor or contact a dealer."
            action={<Link to="/advisor" className="text-primary underline">Talk to the AI</Link>}
          />
        )}
        {(data ?? []).map((l) => (
          <Card key={l.id} className="border-border">
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
              <div>
                <div className="font-medium">Ref · {l.referralCode}</div>
                <div className="text-xs text-muted-foreground">Submitted {formatDate(l.createdAt)}</div>
              </div>
              <div className="flex items-center gap-2">
                <ScoreBadge score={l.score} />
                <StatusBadge status={l.currentStatus} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
