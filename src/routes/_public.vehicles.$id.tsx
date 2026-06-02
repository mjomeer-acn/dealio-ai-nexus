import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { vehiclesService } from "@/api/services";
import { formatMUR } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingBlock } from "@/components/common/Loading";
import { Sparkles, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_public/vehicles/$id")({
  head: () => ({
    meta: [
      { title: "Vehicle details — Dealio" },
      { name: "description", content: "Vehicle details, financing estimate, and fast lead capture." },
    ],
  }),
  component: VehicleDetail,
});

function VehicleDetail() {
  const { id } = useParams({ from: "/_public/vehicles/$id" });
  const { data: v, isLoading } = useQuery({
    queryKey: ["vehicle", id],
    queryFn: () => vehiclesService.get(id),
  });
  if (isLoading) return <LoadingBlock />;
  if (!v) return null;
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="overflow-hidden rounded-2xl border border-border">
            <img src={v.images[0]} alt={`${v.make} ${v.model}`} className="aspect-[16/10] w-full object-cover" />
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              ["Year", v.year],
              ["Body", v.bodyType],
              ["Fuel", v.fuelType],
              ["Transmission", v.transmission],
              ["Mileage", `${v.mileageKm.toLocaleString()} km`],
              ["Color", v.color],
            ].map(([k, val]) => (
              <div key={String(k)} className="rounded-lg border border-border bg-card p-3">
                <div className="text-xs text-muted-foreground">{k}</div>
                <div className="text-sm font-medium">{val}</div>
              </div>
            ))}
          </div>
          <div className="mt-8">
            <h2 className="text-lg font-semibold">About this vehicle</h2>
            <p className="mt-2 text-muted-foreground">{v.description}</p>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {v.features.map((f) => (
              <Badge key={f} variant="secondary">{f}</Badge>
            ))}
          </div>
        </div>
        <aside className="space-y-4">
          <Card className="border-border shadow-[var(--shadow-card)]">
            <CardContent className="space-y-3 p-6">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">{v.make}</div>
              <h1 className="text-2xl font-semibold leading-tight">{v.model}{v.trim ? ` · ${v.trim}` : ""}</h1>
              <div className="text-3xl font-semibold text-primary">{formatMUR(v.priceMUR)}</div>
              {v.monthlyFromMUR && (
                <div className="text-sm text-muted-foreground">
                  From <span className="font-medium text-foreground">{formatMUR(v.monthlyFromMUR)}</span>/month
                </div>
              )}
              <div className="pt-2 space-y-2">
                <Button asChild className="w-full gap-2">
                  <Link to="/lead-capture" search={{ vehicleId: v.id }}>
                    Contact dealer <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full gap-2">
                  <Link to="/advisor">
                    <Sparkles className="h-4 w-4" /> Ask AI about this car
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="p-6 text-sm text-muted-foreground">
              All Dealio vehicles are listed by verified dealers. Once you contact us,
              you'll get a referral code and live status updates from the assigned dealer.
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}