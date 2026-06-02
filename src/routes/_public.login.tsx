import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginFormValues } from "@/api/schemas";
import { authService } from "@/api/services";
import { useAuth } from "@/lib/auth-store";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export const Route = createFileRoute("/_public/login")({
  head: () => ({ meta: [{ title: "Sign in — Dealio" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { setSession } = useAuth();
  const form = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  const login = useMutation({
    mutationFn: (v: LoginFormValues) => authService.login(v.email, v.password),
    onSuccess: (res) => {
      setSession(res.user, res.tokens);
      if (res.user.roles.includes("ADMIN") || res.user.roles.includes("SUPER_ADMIN")) navigate({ to: "/admin" });
      else if (res.user.roles.includes("DEALER") || res.user.roles.includes("DEALER_STAFF")) navigate({ to: "/dealer" });
      else navigate({ to: "/my-inquiries" });
    },
  });

  const google = useMutation({
    mutationFn: () => authService.loginWithGoogle(),
    onSuccess: (res) => {
      setSession(res.user, res.tokens);
      navigate({ to: "/my-inquiries" });
    },
  });

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
      <p className="mt-1 text-sm text-muted-foreground">Sign in to track your inquiries and matched dealers.</p>
      <Card className="mt-6 border-border">
        <CardContent className="p-6">
          <Button variant="outline" className="w-full" onClick={() => google.mutate()} disabled={google.isPending}>
            Continue with Google
          </Button>
          <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
            <Separator className="flex-1" /> or <Separator className="flex-1" />
          </div>
          <form className="grid gap-3" onSubmit={form.handleSubmit((v) => login.mutate(v))}>
            <div className="grid gap-1.5">
              <Label>Email</Label>
              <Input type="email" {...form.register("email")} placeholder="you@example.mu" />
              {form.formState.errors.email && <span className="text-xs text-destructive">{form.formState.errors.email.message}</span>}
            </div>
            <div className="grid gap-1.5">
              <Label>Password</Label>
              <Input type="password" {...form.register("password")} />
              {form.formState.errors.password && <span className="text-xs text-destructive">{form.formState.errors.password.message}</span>}
            </div>
            {login.error && <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">Invalid credentials.</div>}
            <Button type="submit" disabled={login.isPending}>{login.isPending ? "Signing in…" : "Sign in"}</Button>
          </form>
          <div className="mt-4 text-xs text-muted-foreground">
            Demo accounts: admin@dealio.mu · dealer@dealio.mu · customer@dealio.mu (any password)
          </div>
          <div className="mt-2 text-sm">
            No account? <Link to="/register" className="text-primary underline">Create one</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

*** Add File: src/routes/_public.register.tsx
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterFormValues } from "@/api/schemas";
import { authService } from "@/api/services";
import { useAuth } from "@/lib/auth-store";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/_public/register")({
  head: () => ({ meta: [{ title: "Create your account — Dealio" }] }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const { setSession } = useAuth();
  const form = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema) });
  const register = useMutation({
    mutationFn: (v: RegisterFormValues) => authService.register(v),
    onSuccess: (res) => {
      setSession(res.user, res.tokens);
      navigate({ to: "/my-inquiries" });
    },
  });

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
      <Card className="mt-6 border-border">
        <CardContent className="p-6">
          <form className="grid gap-3" onSubmit={form.handleSubmit((v) => register.mutate(v))}>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>First name</Label>
                <Input {...form.register("firstName")} />
              </div>
              <div className="grid gap-1.5">
                <Label>Last name</Label>
                <Input {...form.register("lastName")} />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>Email</Label>
              <Input type="email" {...form.register("email")} />
            </div>
            <div className="grid gap-1.5">
              <Label>Phone (optional)</Label>
              <Input {...form.register("phone")} placeholder="+230 5…" />
            </div>
            <div className="grid gap-1.5">
              <Label>Password</Label>
              <Input type="password" {...form.register("password")} />
              {form.formState.errors.password && (
                <span className="text-xs text-destructive">{form.formState.errors.password.message}</span>
              )}
            </div>
            <Button type="submit" disabled={register.isPending} className="mt-2">
              {register.isPending ? "Creating…" : "Create account"}
            </Button>
          </form>
          <div className="mt-4 text-sm">
            Already have an account? <Link to="/login" className="text-primary underline">Sign in</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

*** Add File: src/routes/_public.my-inquiries.tsx
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

*** Add File: src/routes/_public.contact.tsx
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_public/contact")({
  head: () => ({
    meta: [
      { title: "Contact Dealio" },
      { name: "description", content: "Reach the Dealio team in Mauritius." },
    ],
  }),
  component: () => (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Talk to us</h1>
      <p className="mt-3 text-muted-foreground">
        Dealio HQ · Port Louis, Mauritius · hello@dealio.mu · +230 211 4000
      </p>
    </div>
  ),
});

*** Add File: src/routes/_public.privacy.tsx
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_public/privacy")({
  head: () => ({ meta: [{ title: "Privacy — Dealio" }] }),
  component: () => (
    <article className="mx-auto max-w-3xl px-6 py-16 prose prose-neutral">
      <h1>Privacy Policy</h1>
      <p>Dealio is committed to protecting your personal data.</p>
      <h2>GDPR rights</h2>
      <p>You may request access, rectification, deletion or export of your data at any time.</p>
    </article>
  ),
});

*** Add File: src/routes/_public.terms.tsx
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_public/terms")({
  head: () => ({ meta: [{ title: "Terms — Dealio" }] }),
  component: () => (
    <article className="mx-auto max-w-3xl px-6 py-16 prose prose-neutral">
      <h1>Terms of Service</h1>
      <p>By using Dealio you agree to these terms.</p>
    </article>
  ),
});