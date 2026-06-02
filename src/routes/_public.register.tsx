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
