import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { leadCaptureSchema, type LeadCaptureFormValues } from "@/api/schemas";
import { leadsService } from "@/api/services";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { z } from "zod";

const searchSchema = z.object({ vehicleId: z.string().optional() });

export const Route = createFileRoute("/_public/lead-capture")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Get matched — Dealio" },
      { name: "description", content: "Tell us what you need and a verified Mauritius dealer will reach out." },
    ],
  }),
  component: LeadCapturePage,
});

function LeadCapturePage() {
  const { vehicleId } = Route.useSearch();
  const navigate = useNavigate();
  const [created, setCreated] = useState<{ referralCode: string } | null>(null);
  const form = useForm<LeadCaptureFormValues>({
    resolver: zodResolver(leadCaptureSchema),
    defaultValues: { financingNeeded: false },
  });
  const create = useMutation({
    mutationFn: (values: LeadCaptureFormValues) =>
      leadsService.create({
        customerName: values.customerName,
        customerEmail: values.customerEmail,
        customerPhone: values.customerPhone,
        vehicleId,
        source: vehicleId ? "VEHICLE_DETAIL" : "LANDING_FORM",
        qualification: {
          budgetMURMin: values.budgetMURMin,
          budgetMURMax: values.budgetMURMax,
          preferredMake: values.preferredMake,
          preferredModel: values.preferredModel,
          timeline: values.timeline,
          financingNeeded: values.financingNeeded,
          notes: values.notes,
        },
      }),
    onSuccess: (lead) => setCreated({ referralCode: lead.referralCode }),
  });

  if (created) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/15 text-success">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h1 className="mt-6 text-2xl font-semibold">You're matched.</h1>
        <p className="mt-2 text-muted-foreground">
          A verified dealer will reach out shortly. Track everything from your dashboard.
        </p>
        <div className="mt-6 inline-block rounded-lg border border-dashed border-border bg-muted/30 px-4 py-3 font-mono text-sm">
          Reference: <span className="font-semibold text-primary">{created.referralCode}</span>
        </div>
        <div className="mt-8 flex justify-center gap-3">
          <Button onClick={() => navigate({ to: "/my-inquiries" })}>View my inquiries</Button>
          <Button variant="outline" onClick={() => navigate({ to: "/" })}>Back home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">Get matched</h1>
      <p className="mt-2 text-muted-foreground">Takes 60 seconds. We never share your data without your consent.</p>
      <Card className="mt-6 border-border">
        <CardContent className="p-6">
          <form className="grid gap-4" onSubmit={form.handleSubmit((v) => create.mutate(v))}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" error={form.formState.errors.customerName?.message}>
                <Input {...form.register("customerName")} placeholder="Priya Sookhoo" />
              </Field>
              <Field label="Phone" error={form.formState.errors.customerPhone?.message}>
                <Input {...form.register("customerPhone")} placeholder="+230 5..." />
              </Field>
            </div>
            <Field label="Email" error={form.formState.errors.customerEmail?.message}>
              <Input type="email" {...form.register("customerEmail")} placeholder="you@example.mu" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Budget min (MUR)">
                <Input type="number" {...form.register("budgetMURMin")} placeholder="500000" />
              </Field>
              <Field label="Budget max (MUR)">
                <Input type="number" {...form.register("budgetMURMax")} placeholder="1500000" />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Preferred make">
                <Input {...form.register("preferredMake")} placeholder="Toyota" />
              </Field>
              <Field label="Timeline">
                <Select onValueChange={(v) => form.setValue("timeline", v as LeadCaptureFormValues["timeline"])}>
                  <SelectTrigger><SelectValue placeholder="When?" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IMMEDIATE">Immediate</SelectItem>
                    <SelectItem value="WITHIN_1_MONTH">Within 1 month</SelectItem>
                    <SelectItem value="WITHIN_3_MONTHS">Within 3 months</SelectItem>
                    <SelectItem value="EXPLORING">Just exploring</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <Field label="Anything else?">
              <Textarea rows={3} {...form.register("notes")} />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox onCheckedChange={(c) => form.setValue("financingNeeded", c === true)} />
              I'll need financing
            </label>
            {create.error && (
              <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                Could not submit. Please try again.
              </div>
            )}
            <Button type="submit" disabled={create.isPending} className="mt-2">
              {create.isPending ? "Submitting…" : "Get matched"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
      {children}
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
}