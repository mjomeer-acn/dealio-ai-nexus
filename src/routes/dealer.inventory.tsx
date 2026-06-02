import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { vehiclesService } from "@/api/services";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LoadingBlock } from "@/components/common/Loading";
import { formatMUR } from "@/lib/formatters";
import { vehicleSchema, type VehicleFormValues } from "@/api/schemas";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/dealer/inventory")({
  component: Inventory,
});

function Inventory() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["dealer-inventory"],
    queryFn: () => vehiclesService.list({ limit: 50 }),
  });
  const create = useMutation({
    mutationFn: (v: VehicleFormValues) => vehiclesService.create(v),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dealer-inventory"] });
      setOpen(false);
    },
  });
  const remove = useMutation({
    mutationFn: (id: string) => vehiclesService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dealer-inventory"] }),
  });

  const form = useForm<VehicleFormValues>({ resolver: zodResolver(vehicleSchema) });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Inventory</h1>
          <p className="text-sm text-muted-foreground">Your vehicles published on Dealio.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-1"><Plus className="h-4 w-4" /> Add vehicle</Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader><DialogTitle>New vehicle</DialogTitle></DialogHeader>
            <form className="grid gap-3" onSubmit={form.handleSubmit((v) => create.mutate(v))}>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Make"><Input {...form.register("make")} /></Field>
                <Field label="Model"><Input {...form.register("model")} /></Field>
                <Field label="Year"><Input type="number" {...form.register("year")} /></Field>
                <Field label="Color"><Input {...form.register("color")} /></Field>
                <Field label="Mileage (km)"><Input type="number" {...form.register("mileageKm")} /></Field>
                <Field label="Price (MUR)"><Input type="number" {...form.register("priceMUR")} /></Field>
                <Field label="Body type">
                  <Select onValueChange={(v) => form.setValue("bodyType", v as VehicleFormValues["bodyType"])}>
                    <SelectTrigger><SelectValue placeholder="Body" /></SelectTrigger>
                    <SelectContent>
                      {["SEDAN", "SUV", "HATCHBACK", "COUPE", "PICKUP", "VAN", "CONVERTIBLE"].map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Fuel">
                  <Select onValueChange={(v) => form.setValue("fuelType", v as VehicleFormValues["fuelType"])}>
                    <SelectTrigger><SelectValue placeholder="Fuel" /></SelectTrigger>
                    <SelectContent>
                      {["PETROL", "DIESEL", "HYBRID", "ELECTRIC"].map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Transmission">
                  <Select onValueChange={(v) => form.setValue("transmission", v as VehicleFormValues["transmission"])}>
                    <SelectTrigger><SelectValue placeholder="Transmission" /></SelectTrigger>
                    <SelectContent>
                      {["MANUAL", "AUTOMATIC", "CVT"].map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <Field label="Description"><Textarea rows={3} {...form.register("description")} /></Field>
              <Button type="submit" disabled={create.isPending}>{create.isPending ? "Saving…" : "Publish"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      {isLoading ? <LoadingBlock /> : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Body</TableHead>
                  <TableHead>Mileage</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data ?? []).map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="font-medium">{v.year} {v.make} {v.model}</TableCell>
                    <TableCell>{v.bodyType}</TableCell>
                    <TableCell>{v.mileageKm.toLocaleString()} km</TableCell>
                    <TableCell>{formatMUR(v.priceMUR)}</TableCell>
                    <TableCell>{v.status}</TableCell>
                    <TableCell>
                      <Button size="icon" variant="ghost" onClick={() => remove.mutate(v.id)} aria-label="Delete">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
