
# Dealio — Frontend Build Plan

## Stack adjustments (vs. original spec)

- **Routing**: TanStack Router (file-based, already wired) instead of React Router DOM. Same DX, type-safe.
- **HTTP layer**: Single typed service layer in `src/api/services/`. Instead of MSW (service worker), I'll use an **in-memory mock adapter** flagged by `VITE_USE_MOCKS`. Same swap-to-real-backend story, simpler and works in SSR. Adapter pattern: `services` → `apiClient` → (`mockAdapter` | `axiosAdapter`).
- **AI Advisor**: mock streaming only (per your answer).
- **No i18n / no dark mode** in first pass. Tokens still defined so they can be added later.
- **Skipped from spec** (out of scope for one pass, can add later): Husky, Playwright E2E, Storybook, GitHub Actions CI, Dockerfile, full Vitest test suite. I'll structure code to be testable.

## Architecture

```text
src/
  api/
    client.ts              # single axios instance + interceptors + mock switch
    types/                 # entity types + DTOs (the contract)
    schemas/               # Zod schemas (mirror types)
    mocks/                 # seeded mock data + handlers
    services/              # authService, leadsService, dealersService, ...
  features/
    auth/                  # login, register, MFA, guards, useAuth, RBAC
    public/                # landing, browse, vehicle detail, lead capture
    advisor/               # AI chat UI + mock streaming
    dealer/                # dashboard, inbox, lead detail, inventory, commissions
    admin/                 # dashboard, leads, dealers, users, knowledge, audit
    customer/              # my inquiries
  components/
    ui/                    # shadcn (already present)
    shell/                 # PortalShell (sidebar, topbar, breadcrumbs)
    common/                # StatusBadge, ScoreBadge, EmptyState, ...
  routes/                  # TanStack file routes
  lib/
    auth-store.ts          # zustand store (user, token, roles)
    rbac.ts                # role/permission helpers
    formatters.ts          # MUR currency, dates
API_CONTRACT.md            # endpoint docs for backend handoff
```

## Design system

- Primary `#bd2710`, secondary `#e0b833`, accent `#d6d6d6` — converted to oklch in `src/styles.css`.
- Premium corporate tone: tight typography (Inter), generous spacing, restrained motion.
- Semantic tokens: success/warning/danger/info. Shadcn variants extended (button `hero`, `gold`, card `premium`).

## Data model

Typed in `src/api/types/`: `User`, `Role`, `Dealer`, `Vehicle`, `Lead`, `LeadStatusEntry`, `Commission`, `ReferralCode`, `Contract`, `Conversation`, `Message`, `KnowledgeDocument`, `Notification`, `AuditLog`. Enums: `Role`, `LeadStatusType`, `LeadScore`, `CommissionStatus`, `Vertical`. Every entity: `id`, `createdAt`, `updatedAt`, `deletedAt?`. Response envelope `{ data, meta }` / `{ error }`.

## Screens (first pass)

**Public:** Landing, Browse, Vehicle Detail, Lead Capture, Login, Register, Customer "My Inquiries".

**Dealer portal:** Dashboard (KPIs + chart), Lead Inbox, Lead Detail (timeline + status advance + record sale), Inventory list+CRUD, Commissions.

**Admin portal:** Dashboard (funnel + 100k MUR target), Leads (all + reassign), Dealers (CRUD + suspend), Users & Roles, Knowledge Documents (upload UI), Audit Log.

**Shared:** PortalShell, ProtectedRoute, NotFound, ErrorBoundary, toast system.

## API contract

`API_CONTRACT.md` lists every endpoint with method, path, role, request/response shapes, error codes. Mock layer implements all of them with seeded Mauritius data (MUR pricing, local makes).

## What I'll skip / stub

- Real Google OAuth (button + mock flow)
- Real MFA (UI + mock verify endpoint)
- File uploads (UI + mock acknowledgement, no storage)
- Streaming over real SSE (simulated with setInterval emitting tokens)
- Charts: lightweight (recharts already shadcn-compatible)

## Order of execution

1. Design tokens + theme
2. Types + Zod schemas + mock data + service layer + API_CONTRACT.md
3. Auth store + RBAC + ProtectedRoute + PortalShell
4. Public site (landing, browse, detail, lead capture, auth pages)
5. AI Advisor chat (mock streaming)
6. Customer dashboard
7. Dealer portal screens
8. Admin portal screens
9. README with backend handoff notes

This is a large amount of code (~60–80 files). I'll work straight through without pausing for confirmation between steps.
