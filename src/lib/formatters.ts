export const formatMUR = (amount: number | undefined | null): string => {
  if (amount == null) return "—";
  try {
    return new Intl.NumberFormat("en-MU", {
      style: "currency",
      currency: "MUR",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString()} MUR`;
  }
};

export const formatDate = (iso: string | undefined | null): string => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

export const formatDateTime = (iso: string | undefined | null): string => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatPercent = (value: number): string => `${Math.round(value * 100)}%`;

export const initials = (firstName: string, lastName: string): string =>
  `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();