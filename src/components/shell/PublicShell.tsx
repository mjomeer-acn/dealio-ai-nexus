import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useAuth, usePermissions } from "@/lib/auth-store";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Home" },
  { to: "/browse", label: "Browse Cars" },
  { to: "/advisor", label: "AI Advisor" },
  { to: "/contact", label: "Contact" },
] as const;

export function PublicShell() {
  const { user } = useAuth();
  const perms = usePermissions();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-[var(--gradient-primary)] shadow-[var(--shadow-elegant)]" />
            <span className="text-base font-semibold tracking-tight">Dealio</span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                  pathname === n.to && "text-foreground",
                )}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            {user ? (
              <>
                {perms.isAdmin && (
                  <Button asChild variant="ghost" size="sm">
                    <Link to="/admin">Admin</Link>
                  </Button>
                )}
                {perms.isDealer && (
                  <Button asChild variant="ghost" size="sm">
                    <Link to="/dealer">Dealer</Link>
                  </Button>
                )}
                {perms.isCustomer && (
                  <Button asChild variant="ghost" size="sm">
                    <Link to="/my-inquiries">My Inquiries</Link>
                  </Button>
                )}
              </>
            ) : (
              <Button asChild variant="ghost" size="sm">
                <Link to="/login">Sign in</Link>
              </Button>
            )}
            <Button asChild size="sm" className="gap-1">
              <Link to="/advisor">
                <Sparkles className="h-3.5 w-3.5" /> Ask Dealio
              </Link>
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-border/60 bg-card/30">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-[var(--gradient-primary)]" />
            <span className="text-sm font-medium">Dealio · Match Smarter. Buy Better.</span>
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
            <Link to="/contact">Contact</Link>
            <span>© {new Date().getFullYear()} Dealio Mauritius</span>
          </div>
        </div>
      </footer>
    </div>
  );
}