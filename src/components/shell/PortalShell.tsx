import { Link, Outlet, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Inbox,
  Car,
  Coins,
  Users,
  Building2,
  BookOpen,
  ScrollText,
  LogOut,
  Bell,
  User as UserIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth-store";
import { initials } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { authService } from "@/api/services";

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
}

const dealerNav: NavItem[] = [
  { to: "/dealer", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { to: "/dealer/leads", label: "Lead Inbox", icon: <Inbox className="h-4 w-4" /> },
  { to: "/dealer/inventory", label: "Inventory", icon: <Car className="h-4 w-4" /> },
  { to: "/dealer/commissions", label: "Commissions", icon: <Coins className="h-4 w-4" /> },
];

const adminNav: NavItem[] = [
  { to: "/admin", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { to: "/admin/leads", label: "Leads", icon: <Inbox className="h-4 w-4" /> },
  { to: "/admin/dealers", label: "Dealers", icon: <Building2 className="h-4 w-4" /> },
  { to: "/admin/users", label: "Users & Roles", icon: <Users className="h-4 w-4" /> },
  { to: "/admin/knowledge", label: "Knowledge Base", icon: <BookOpen className="h-4 w-4" /> },
  { to: "/admin/audit", label: "Audit Log", icon: <ScrollText className="h-4 w-4" /> },
];

export function PortalShell({ kind }: { kind: "dealer" | "admin" }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const items = kind === "admin" ? adminNav : dealerNav;
  const title = kind === "admin" ? "Admin Console" : "Dealer Portal";

  const handleLogout = async () => {
    await authService.logout().catch(() => undefined);
    logout();
    navigate({ to: "/" });
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
        <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6">
          <div className="h-6 w-6 rounded bg-[var(--gradient-primary)]" />
          <span className="font-semibold tracking-tight">Dealio</span>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          <div className="px-3 pb-2 pt-3 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/60">
            {title}
          </div>
          {items.map((it) => {
            const isRoot = it.to === "/admin" || it.to === "/dealer";
            const active = isRoot ? pathname === it.to : pathname.startsWith(it.to);
            return (
              <Link
                key={it.to}
                to={it.to}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                )}
              >
                {it.icon}
                {it.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-sidebar-border p-3">
          <Link
            to="/"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-xs text-sidebar-foreground/70 hover:text-sidebar-foreground"
          >
            ← Back to site
          </Link>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
          <div className="text-sm font-medium text-muted-foreground">{title}</div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" aria-label="Notifications">
              <Bell className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="text-xs">
                      {user ? initials(user.firstName, user.lastName) : "?"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden text-sm sm:inline">
                    {user ? `${user.firstName} ${user.lastName}` : "Account"}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem disabled>
                  <UserIcon className="mr-2 h-4 w-4" />
                  {user?.email}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}