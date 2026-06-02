import { createFileRoute } from "@tanstack/react-router";
import { PortalShell } from "@/components/shell/PortalShell";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin Console — Dealio" }] }),
  component: () => (
    <ProtectedRoute requiredRoles={["ADMIN", "SUPER_ADMIN"]}>
      <PortalShell kind="admin" />
    </ProtectedRoute>
  ),
});
