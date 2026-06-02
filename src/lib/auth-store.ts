import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Role, User } from "@/api/types";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  setSession: (user: User, tokens: { accessToken: string; refreshToken: string }) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      setSession: (user, tokens) => {
        if (typeof window !== "undefined") {
          window.localStorage.setItem("dealio.accessToken", tokens.accessToken);
          window.localStorage.setItem("dealio.userId", user.id);
        }
        set({ user, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken });
      },
      clear: () => {
        if (typeof window !== "undefined") {
          window.localStorage.removeItem("dealio.accessToken");
          window.localStorage.removeItem("dealio.userId");
        }
        set({ user: null, accessToken: null, refreshToken: null });
      },
    }),
    { name: "dealio.auth" },
  ),
);

export function useAuth() {
  const { user, setSession, clear } = useAuthStore();
  return { user, isAuthenticated: !!user, setSession, logout: clear };
}

export function hasAnyRole(user: User | null, roles: Role[]): boolean {
  if (!user) return false;
  return user.roles.some((r) => roles.includes(r));
}

export function usePermissions() {
  const user = useAuthStore((s) => s.user);
  return {
    isAdmin: hasAnyRole(user, ["ADMIN", "SUPER_ADMIN"]),
    isSuperAdmin: hasAnyRole(user, ["SUPER_ADMIN"]),
    isDealer: hasAnyRole(user, ["DEALER", "DEALER_STAFF"]),
    isCustomer: hasAnyRole(user, ["CUSTOMER"]),
    hasAnyRole: (roles: Role[]) => hasAnyRole(user, roles),
  };
}