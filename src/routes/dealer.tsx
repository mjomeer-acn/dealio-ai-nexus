import { createFileRoute } from "@tanstack/react-router";
import { PortalShell } from "@/components/shell/PortalShell";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";

export const Route = createFileRoute("/dealer")({
  head: () => ({ meta: [{ title: "Dealer Portal — Dealio" }] }),
  component: () => (
    <ProtectedRoute requiredRoles={["DEALER", "DEALER_STAFF", "ADMIN", "SUPER_ADMIN"]}>
      <PortalShell kind="dealer" />
    </ProtectedRoute>
  ),
});
