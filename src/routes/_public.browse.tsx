import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { vehiclesService } from "@/api/services";
import { formatMUR } from "@/lib/formatters";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { LoadingBlock } from "@/components/common/Loading";
import { EmptyState } from "@/components/common/EmptyState";
import { Car } from "lucide-react";

export const Route = createFileRoute("/_public/browse")({
  head: () => ({
    meta: [
      { title: "Browse cars — Dealio Mauritius" },
      { name: "description", content: "Search verified vehicles from trusted Mauritius dealers. Or skip the browse and talk to the Dealio AI advisor." },
    ],
  }),
  component: BrowsePage,
});

function BrowsePage() {
  const [q, setQ] = useState("");
  const [bodyType, setBodyType] = useState<string>("");
  const [fuelType, setFuelType] = useState<string>("");
  const { data, isLoading } = useQuery({
    queryKey: ["vehicles", q, bodyType, fuelType],
    queryFn: () => vehiclesService.list({ q, filter: { bodyType: bodyType || undefined, fuelType: fuelType || undefined } }),
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Browse vehicles</h1>
        <p className="text-sm text-muted-foreground">
          Prefer guidance? <Link to="/advisor" className="text-primary underline">Talk to the AI advisor</Link>.
        </p>
      </div>
      <div className="mt-6 flex flex-wrap gap-3 rounded-xl border border-border bg-card p-4">
        <Input
          placeholder="Search make, model, color…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-sm"
        />
        <Select value={bodyType} onValueChange={(v) => setBodyType(v === "all" ? "" : v)}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Body type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any body</SelectItem>
            {["SUV", "SEDAN", "HATCHBACK", "PICKUP", "COUPE", "VAN"].map((b) => (
              <SelectItem key={b} value={b}>{b}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={fuelType} onValueChange={(v) => setFuelType(v === "all" ? "" : v)}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Fuel" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any fuel</SelectItem>
            {["PETROL", "DIESEL", "HYBRID", "ELECTRIC"].map((b) => (
              <SelectItem key={b} value={b}>{b}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="ghost" onClick={() => { setQ(""); setBodyType(""); setFuelType(""); }}>
          Reset
        </Button>
      </div>

      {isLoading ? (
        <LoadingBlock />
      ) : !data || data.length === 0 ? (
        <EmptyState icon={<Car className="h-8 w-8" />} title="No vehicles match" description="Try widening your filters or ask the AI advisor for help." />
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((v) => (
            <Link key={v.id} to="/vehicles/$id" params={{ id: v.id }}>
              <Card className="group overflow-hidden border-border/60 transition-shadow hover:shadow-[var(--shadow-elegant)]">
                <div className="aspect-[4/3] overflow-hidden bg-muted">
                  <img src={v.images[0]} alt={`${v.make} ${v.model}`} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                </div>
                <CardContent className="space-y-1 p-4">
                  <div className="text-xs text-muted-foreground">{v.year} · {v.bodyType} · {v.transmission}</div>
                  <div className="font-semibold">{v.make} {v.model}</div>
                  <div className="flex items-center justify-between pt-1">
                    <div className="text-sm font-medium text-primary">{formatMUR(v.priceMUR)}</div>
                    {v.monthlyFromMUR && <div className="text-xs text-muted-foreground">from {formatMUR(v.monthlyFromMUR)}/mo</div>}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}