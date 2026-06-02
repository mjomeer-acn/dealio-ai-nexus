import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, ShieldCheck, Gauge, Handshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { vehiclesService } from "@/api/services";
import { formatMUR } from "@/lib/formatters";

export const Route = createFileRoute("/_public/")({
  head: () => ({
    meta: [
      { title: "Dealio — Match Smarter. Buy Better." },
      { name: "description", content: "AI-powered car buying advisor in Mauritius. Tell our AI what you need and we'll match you with the right vehicle and dealer." },
      { property: "og:title", content: "Dealio — Match Smarter. Buy Better." },
      { property: "og:description", content: "AI advisor that matches you to the right car and the right dealer in Mauritius." },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  const { data: vehicles } = useQuery({
    queryKey: ["vehicles", "featured"],
    queryFn: () => vehiclesService.list({ limit: 4, filter: { featured: true } }),
  });

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-[var(--gradient-hero)] text-white">
        <div className="absolute inset-0 opacity-30" style={{
          background: "radial-gradient(800px 400px at 80% 20%, color-mix(in oklab, var(--primary) 60%, transparent), transparent), radial-gradient(600px 300px at 10% 80%, color-mix(in oklab, var(--secondary) 50%, transparent), transparent)",
        }} />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/80">
              <Sparkles className="h-3 w-3" /> AI Buying Advisor · Mauritius
            </div>
            <h1 className="mt-6 text-5xl font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl">
              Match Smarter.
              <br />
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: "var(--gradient-gold)" }}>
                Buy Better.
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-white/75">
              Stop scrolling endless listings. Tell Dealio what you need — our AI matches
              you to the right vehicle and the right dealer, with financing options that fit.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Button asChild size="lg" className="gap-2 shadow-[var(--shadow-elegant)]">
                <Link to="/advisor">
                  Talk to the AI advisor <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/30 bg-white/0 text-white hover:bg-white/10">
                <Link to="/browse">Or browse manually</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-y border-border/60 bg-card/50">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-8 sm:grid-cols-4 sm:px-6">
          {[
            { icon: <ShieldCheck className="h-5 w-5" />, label: "Verified dealers" },
            { icon: <Gauge className="h-5 w-5" />, label: "Sub-minute matching" },
            { icon: <Handshake className="h-5 w-5" />, label: "90-day ownership" },
            { icon: <Sparkles className="h-5 w-5" />, label: "AI + human dealer" },
          ].map((it) => (
            <div key={it.label} className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="text-primary">{it.icon}</span>
              <span className="font-medium text-foreground">{it.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-primary">Featured</p>
            <h2 className="mt-1 text-3xl font-semibold tracking-tight">Hand-picked by Dealio</h2>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link to="/browse">View all →</Link>
          </Button>
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {(vehicles ?? []).slice(0, 4).map((v) => (
            <Link key={v.id} to="/vehicles/$id" params={{ id: v.id }}>
              <Card className="group overflow-hidden border-border/60 transition-shadow hover:shadow-[var(--shadow-elegant)]">
                <div className="aspect-[4/3] w-full overflow-hidden bg-muted">
                  <img
                    src={v.images[0]}
                    alt={`${v.make} ${v.model}`}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <CardContent className="space-y-1 p-4">
                  <div className="text-xs text-muted-foreground">{v.year} · {v.bodyType}</div>
                  <div className="font-semibold">{v.make} {v.model}</div>
                  <div className="text-sm font-medium text-primary">{formatMUR(v.priceMUR)}</div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-border/60 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-medium uppercase tracking-wider text-primary">How it works</p>
            <h2 className="mt-1 text-3xl font-semibold tracking-tight">Acquire. Qualify. Match. Refer. Track. Monetize.</h2>
            <p className="mt-3 text-muted-foreground">
              Dealio is a lead-generation engine — not just a listings site. The AI qualifies your needs,
              routes you to the right dealer, and tracks every step so the deal closes faster.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              { n: "01", t: "Talk to the AI", d: "Tell our AI what you're looking for — budget, type, timeline. It learns silently." },
              { n: "02", t: "Get matched", d: "Dealio scores your need and routes a HOT lead to the best dealer for it." },
              { n: "03", t: "Close the deal", d: "The dealer reaches out, financing options included. You track every step." },
            ].map((step) => (
              <Card key={step.n} className="border-border/60">
                <CardContent className="space-y-2 p-6">
                  <div className="text-xs font-mono text-primary">{step.n}</div>
                  <div className="text-lg font-semibold">{step.t}</div>
                  <p className="text-sm text-muted-foreground">{step.d}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-[var(--gradient-hero)] p-10 text-white">
          <h2 className="text-3xl font-semibold tracking-tight">Ready to match smarter?</h2>
          <p className="mt-3 max-w-xl text-white/75">
            Two minutes with the AI replaces a week of browsing.
          </p>
          <Button asChild size="lg" className="mt-6 gap-2 shadow-[var(--shadow-elegant)]">
            <Link to="/advisor">
              Start with the AI <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}