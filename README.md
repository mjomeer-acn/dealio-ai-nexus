# Dealio Frontend

> Match Smarter. Buy Better. — AI-powered lead generation & referral marketplace for Mauritius.

This is the **frontend** for Dealio. It ships with a fully typed mock backend
so the app runs end-to-end before the Python/Flask backend is built.

## Quick start

```bash
bun install
bun run dev
```

Demo accounts (any password works in mock mode):
- `admin@dealio.mu` — Admin console
- `dealer@dealio.mu` — Dealer portal
- `customer@dealio.mu` — Customer dashboard

## Environment variables

| Variable                | Default | Meaning                                       |
|-------------------------|---------|-----------------------------------------------|
| `VITE_USE_MOCKS`        | `true`  | Use the in-memory mock backend                |
| `VITE_API_BASE_URL`     | `/api`  | Real backend base URL when mocks are off      |

To run against the real Flask backend:

```bash
VITE_USE_MOCKS=false VITE_API_BASE_URL=https://api.dealio.mu bun run dev
```

## Architecture

```
src/
  api/
    client.ts         # single request layer; routes calls to mock or HTTP
    types/            # entity types + DTOs (THE contract)
    schemas/          # Zod validation schemas (shared with forms)
    mocks/            # seeded mock DB + registered handlers
    services/         # typed services (authService, leadsService, …)
  features/           # feature folders (auth, public, dealer, admin, …)
  components/
    ui/               # shadcn primitives
    common/           # StatusBadge, EmptyState, ProtectedRoute, …
    shell/            # PublicShell, PortalShell (dealer + admin)
  lib/                # auth-store (zustand), formatters
  routes/             # TanStack Router file-based routes
API_CONTRACT.md       # endpoint documentation for backend handoff
```

### API-ready: how the Flask backend plugs in

Every component talks to the API through `src/api/services/*`. Services call
`apiRequest()` in `src/api/client.ts`, which routes to either:

- **mock adapter** — in-memory store in `src/api/mocks/` (seeded with realistic
  Mauritius automotive data); OR
- **HTTP adapter** — `fetch(VITE_API_BASE_URL + path)` with JWT auto-injection
  and standardized error envelope.

To swap: implement the endpoints in `API_CONTRACT.md`, set `VITE_USE_MOCKS=false`,
point `VITE_API_BASE_URL` at the Flask server. No component code changes.

### Roles & RBAC

- `GUEST | CUSTOMER | DEALER | DEALER_STAFF | ADMIN | SUPER_ADMIN`
- Route guards: `<ProtectedRoute requiredRoles={[...]}>`
- Permission hook: `usePermissions()` from `@/lib/auth-store`
- Auth state: zustand store persisted to `localStorage` (will move to httpOnly cookie when real backend is wired)

### What's implemented

**Public:** Landing, Browse, Vehicle Detail, Lead Capture (with referral code), Login, Register, Customer "My Inquiries", Contact / Privacy / Terms

**AI Advisor:** Conversational chat with mock token streaming, silent lead qualification (budget, body type, timeline, email/phone), recommendation cards, citation chips, qualification progress bar

**Dealer Portal:** Dashboard with KPIs + 7-day chart, Lead Inbox (accept/decline), Lead Detail with immutable status timeline + advance status + record sale → commission, Inventory CRUD, Commissions

**Admin Portal:** Platform dashboard (funnel, sources, top dealers, 100k MUR monthly target), All Leads with reassignment, Dealer management (approve/suspend), Users & Roles, Knowledge Base (RAG upload + indexing status), Audit Log

### Scope deferred for follow-up

- i18n EN/FR (`react-i18next`)
- Dark mode toggle (tokens already defined)
- Real Google OAuth, real MFA verification
- Real file uploads for inventory images & knowledge docs
- SSE streaming for AI responses (currently simulated client-side)
- Vitest + Playwright suites + Storybook + Husky + GitHub Actions CI
- Dolibarr ERP finance integration

### Design system

Tokens defined in `src/styles.css` using `oklch`. Primary `#bd2710` (deep red),
secondary `#e0b833` (gold), accent `#d6d6d6` (light grey). Plus semantic
`success/warning/info/destructive` tokens and gradient/shadow tokens for
hero, primary CTAs, and cards.
