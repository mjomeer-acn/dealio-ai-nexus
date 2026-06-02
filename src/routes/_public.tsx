import { createFileRoute } from "@tanstack/react-router";
import { PublicShell } from "@/components/shell/PublicShell";

export const Route = createFileRoute("/_public")({
  component: PublicShell,
});