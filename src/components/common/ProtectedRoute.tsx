import { Navigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useAuthStore } from "@/lib/auth-store";
import type { Role } from "@/api/types";

interface Props {
  children: ReactNode;
  requiredRoles?: Role[];
}

export function ProtectedRoute({ children, requiredRoles }: Props) {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" />;
  if (requiredRoles && !user.roles.some((r) => requiredRoles.includes(r))) {
    return <Navigate to="/" />;
  }
  return <>{children}</>;
}