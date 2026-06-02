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
