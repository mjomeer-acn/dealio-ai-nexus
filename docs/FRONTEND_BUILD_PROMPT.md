# FRONTEND BUILD PROMPT — DEALIO

## 0. Context & Mission

You are building the **frontend** for **Dealio** — *"Match Smarter. Buy Better."* — an **AI-powered lead generation & referral marketplace** based in **Mauritius**.

**Critical:** This is **NOT a car listing website.** It is a **lead acquisition and referral tracking platform.** The first vertical is automotive, but the architecture must be **modular and industry-agnostic** because future verticals are Real Estate, Insurance, Financing, Solar, Construction, and Professional Services. Assume a future **multi-tenant SaaS**.

The core lifecycle the entire product serves is:
**Acquire → Qualify → Match → Refer → Track → Monetize.**

The AI Buying Advisor is the **main differentiator** — users should prefer talking to the AI over browsing listings manually.

**Your job:** Build the entire frontend with a clean, typed, mocked API layer so that a separate engineer can plug in a Python/Flask backend later **without touching your components**. You build everything **API-ready**; you do not build the real backend.

---

## 1. Tech Stack (mandatory)

- **Framework:** React + **TypeScript** (strict mode), Vite
- **Styling:** Tailwind CSS
- **Components:** **shadcn/ui**
- **Animation:** **Framer Motion**
- **Routing:** React Router
- **Data fetching/cache:** TanStack Query (React Query)
- **Forms:** React Hook Form + **Zod** (validation schemas shared with API types)
- **State:** React Query for server state; Zustand or Context for minimal global UI/auth state
- **HTTP:** Axios instance (single configured client)
- **Testing:** Vitest + React Testing Library (unit/integration), Playwright (E2E)
- **Tooling:** ESLint, Prettier, Husky pre-commit hooks, TypeScript path aliases

Do **not** introduce other major libraries without justification.

---

## 2. THE MOST IMPORTANT RULE — API-Ready Architecture

The backend will be **Python / Flask / SQLite** with JWT auth. You must build the frontend so the backend slots in cleanly. Concretely:

1. **No `fetch`/axios calls inside components.** All server access goes through a typed **service layer** in `src/api/services/` (e.g. `leadsService`, `dealersService`, `authService`).
2. **Centralized API client** in `src/api/client.ts`: one Axios instance, base URL from `VITE_API_BASE_URL` env var, automatic JWT bearer injection, 401 refresh/redirect handling, and standardized error normalization.
3. **Mock backend layer.** Implement **MSW (Mock Service Worker)** that fulfills every endpoint defined in the API contract (Section 9) with realistic seeded data. Toggle with `VITE_USE_MOCKS=true`. When the real backend is ready, flipping this flag must make the app work against Flask with **zero component changes**.
4. **Shared types as the contract.** Define all entity and DTO types in `src/api/types/` (mirroring the DB entities in Section 8). Define request/response shapes for every endpoint. These types ARE the API contract.
5. **Zod schemas** for every request/response, co-located with types, used both for form validation and runtime response validation.
6. **Document the contract.** Produce `API_CONTRACT.md` listing every endpoint: method, path, request body, response body, auth/role required, error codes. This is the handoff document to the backend engineer.
7. **Consistent envelope.** Assume all API responses follow:
   - Success: `{ "data": <payload>, "meta": { pagination... } }`
   - Error: `{ "error": { "code": string, "message": string, "details"?: object } }`
   - Lists: paginated with `?page=&limit=&sort=&filter=` query params.

---

## 3. Design System

- **Style:** Premium Corporate — inspired by **Tesla, Stripe, Porsche, Linear.**
- **Feel:** Professional, Trustworthy, Luxury. **Must avoid any cheap-marketplace appearance.**
- **Color palette:**
  - Primary: `#bd2710` (deep red)
  - Secondary: `#e0b833` (gold)
  - Accent: `#d6d6d6` (light grey)
  - Add a neutral dark/light scale + semantic tokens (success/warning/danger/info).
- Define these as **Tailwind theme tokens + CSS variables**; support **light and dark mode**.
- Typography: clean, modern sans-serif; generous spacing; strong hierarchy.
- Motion: subtle, premium Framer Motion transitions (page transitions, list reveals, chat message entrance). No gimmicks.
- **i18n from day one:** English + French (Mauritius). Use `react-i18next`; no hardcoded strings.
- Fully **responsive** (mobile-first) and **WCAG AA accessible** (keyboard nav, focus states, aria labels, color contrast).

---

## 4. User Roles (RBAC)

Build role-aware routing and UI for these roles. Gate every route and action by role:

- **Guest / Customer** — public site + AI advisor + lead submission.
- **Registered Customer** — can track their own inquiries/leads.
- **Dealer / Vendor** — dealer portal (their leads, inventory, commissions).
- **Dealer Staff** — limited dealer-portal access.
- **Admin** — full admin portal.
- **Super Admin** — admin + system/tenant config (future multi-tenant).

Implement a `<ProtectedRoute requiredRoles={[...]}>` wrapper and a `usePermissions()` hook. Never rely on hiding UI alone — assume the backend enforces auth too, but the frontend must also guard.

---

## 5. Screens & Features

### A. Public / Customer Site

1. **Landing Page** — premium hero, value proposition ("talk to the AI advisor"), featured vehicles, how-it-works, trust signals, CTA into the AI advisor. Strong, animated, conversion-focused.
2. **AI Advisor Chat** (flagship feature, see Section 6) — full conversational UI.
3. **Vehicle Browse/Listings** — grid + filters (make, model, price, year, body type, fuel, transmission), sort, pagination. Secondary to the AI; positioned as "or browse manually."
4. **Vehicle Detail Page** — gallery, specs, price, financing estimate, "Ask the AI about this car" CTA, lead-capture CTA.
5. **Lead Capture Flow** — captures Name, Phone, Email + budget, vehicle preference, timeline, financing need; can be triggered from chat or listing. Confirmation screen with referral/tracking reference.
6. **Auth** — Login, Register, **Login with Google**, forgot/reset password, MFA challenge screen.
7. **Customer Dashboard** — "My Inquiries": list of their submitted leads with current status (read-only view of the status timeline).
8. **Static pages** — About, Contact, Privacy Policy / GDPR, Terms, FAQ.

### B. Dealer Portal

1. **Dealer Dashboard** — KPIs: assigned leads, accepted, in-progress, won/lost, commissions earned, conversion rate. Charts.
2. **Lead Inbox** — incoming assigned leads with HOT/WARM/COLD score badge; **Accept / Decline** action (ownership clock: 90 days).
3. **Lead Detail** — full customer + qualification data, AI conversation summary, and an **immutable status timeline**. Dealer advances status: `ASSIGNED → CONTACTED → NEGOTIATING → SOLD / LOST`. Each change requires timestamp + user + comment (frontend captures these).
4. **Record Sale** — form to mark SOLD, enter sale amount → triggers commission generation (backend).
5. **Inventory Management** — dealer's vehicles: CRUD (create/edit/soft-delete/list), image upload, mark featured.
6. **Commissions** — list of commissions per sale, status (pending/invoiced/paid), totals, invoice download.
7. **Dealer Analytics** — performance over time, lead quality breakdown, response-time metrics.
8. **Dealer Profile/Settings** — company info, staff management, notification preferences.

### C. Admin Portal (full control)

1. **Admin Dashboard** — platform-wide KPIs: total leads, qualified %, conversion funnel (Acquire→Qualify→Match→Refer→Track→Monetize), revenue/commission totals, **progress to the 100,000 MUR/month target**, top dealers, lead-source breakdown.
2. **Lead Management** — view/search/filter ALL leads, reassign leads, override status, inspect full status history & attribution, flag for fraud.
3. **Dealer Management** — CRUD dealers, approve/suspend, set commission rates, manage staff, view dealer performance.
4. **User & Role Management** — CRUD users, assign roles (RBAC), reset MFA, deactivate (soft-delete only).
5. **Vehicle / Inventory Oversight** — view/moderate all listings across dealers, feature/unfeature, remove.
6. **Commission & Finance** — view all commissions, generate/approve invoices, record payments, disputes. (Designed to later integrate with **Dolibarr ERP** — keep finance models clean.)
7. **Referral & Attribution** — manage referral codes, view attribution chains, 90-day ownership windows.
8. **AI Knowledge Base (RAG) Management** — upload/manage **KnowledgeDocuments** (vehicle specs, financing products, FAQs) that feed the RAG system; view ingestion status. (Frontend: upload UI, list, status, delete; backend handles embedding.)
9. **Conversation Oversight** — review AI conversations, quality/qualification audit, flag bad interactions.
10. **Audit Log Viewer** — searchable, filterable immutable audit log of all actions (mandatory).
11. **Notifications Center** — system notifications management.
12. **Platform Settings** — config: commission defaults, lead-ownership duration, verticals (feature-flag future verticals: Real Estate, Insurance, etc.), languages, branding. Build with **multi-tenant awareness** (tenant switcher placeholder).

> Build a shared, role-aware **Portal Shell** (sidebar nav, topbar, breadcrumbs, user menu, notifications bell, language switcher, theme toggle) reused by Dealer and Admin portals.

---

## 6. AI Advisor — Detailed Spec

Build the **chat UI** against a streaming-capable service interface (backend will be OpenAI + LangChain + RAG; you mock it):

- Conversational chat with message streaming (mock token streaming via MSW), typing indicator, conversation memory persisted per session/user.
- Renders AI **vehicle recommendation cards** and **financing suggestions** inline in chat.
- **Citation support** — when AI references a spec/FAQ, show a citation chip linking to the source doc.
- **Multi-language** (English/French) — chat respects selected language.
- **Silent lead qualification:** the conversation progressively captures **Name, Phone, Email** and determines **Budget, Vehicle preference, Purchase timeline, Financing requirements**. Show a subtle "qualification progress" indicator.
- On qualification, produce a **Qualified Lead Object** with a **HOT / WARM / COLD** score (score comes from backend; UI displays badge).
- Define the chat API contract clearly (Section 9) — message send, stream response, conversation history, lead-object emission — so the backend can implement RAG behind it.
- Graceful states: loading, error/retry, empty, rate-limited.

---

## 7. Cross-Cutting Requirements

### Security (frontend responsibilities)
- JWT stored securely (httpOnly cookie preferred; if using memory + refresh, document it). Auto-refresh + 401 handling.
- **RBAC** enforced on routes and actions.
- **MFA** challenge flow UI.
- **XSS protection:** never `dangerouslySetInnerHTML` with un-sanitized content; sanitize any rendered AI/markdown output.
- **CSRF:** include CSRF token handling for cookie-based auth.
- **Rate-limiting UX:** handle 429 gracefully.
- **PII protection:** never log PII to console; mask sensitive fields in UI where appropriate.
- **GDPR:** consent banner, privacy controls, "download/delete my data" UI hooks.
- Input validation on **every** form via Zod before submit.

### Clean Code & Architecture
- Strict TypeScript, **no `any`**. ESLint + Prettier enforced via Husky pre-commit.
- Feature-based folder structure (`src/features/leads/`, `src/features/dealers/`, etc.). Co-locate components, hooks, services, types, tests.
- Small, composable components; custom hooks for logic; no business logic in JSX.
- Centralized: API client, error handling, toasts/notifications, route definitions, role guards.
- Consistent naming, no dead code, no mocks left in production paths (mocks isolated behind the MSW flag).
- Conventional Commits.

### QA / Testing (mandatory before "done")
- **Unit tests** for utils, hooks, services, Zod schemas.
- **Integration tests** (RTL) for key flows: AI chat qualification, lead capture, dealer accept→sale, admin reassignment, auth+RBAC.
- **E2E tests** (Playwright) for critical journeys: customer chats→becomes lead; dealer processes lead to SOLD; admin manages dealer.
- Accessibility tests (axe) and meaningful coverage targets.
- **CI ready:** GitHub Actions config that runs lint, typecheck, tests, build on PR. Dockerfile for the frontend.
- Storybook for the design system / shadcn components (optional but encouraged).

### Production-grade discipline
- No shortcuts, no placeholder hacks. Every feature ships with: types, validation, error handling, loading/empty/error states, tests, and accessibility.
- Loading skeletons, optimistic updates where sensible, retry/error boundaries, 404/500 pages.

---

## 8. Data Entities (mirror in `src/api/types/`)

Model these TypeScript types. **Every entity** has: `id: string (UUID)`, `createdAt`, `updatedAt`, and soft-delete (`deletedAt?: string | null`). **No hard deletes.**

`User`, `Role`, `Dealer`, `Vehicle`, `Lead`, `LeadStatus` (history entry), `Commission`, `ReferralCode`, `Contract`, `Conversation`, `KnowledgeDocument`, `Notification`, `AuditLog`.

Key fields to capture (non-exhaustive):
- **Lead:** id, referralCode, customer data (name/phone/email), source, score (HOT/WARM/COLD), qualification data (budget, preference, timeline, financing), assignedDealerId, ownershipExpiresAt (90 days), current status, full immutable `statusHistory: LeadStatus[]`.
- **LeadStatus:** status, timestamp, userId, comment. (NEW, QUALIFIED, ASSIGNED, CONTACTED, NEGOTIATING, SOLD, LOST)
- **Commission:** leadId, dealerId, saleAmount, rate, amount, status (pending/invoiced/paid), invoiceId.
- **Conversation:** messages, language, linked leadId, citations.

Define enums for: `Role`, `LeadStatusType`, `LeadScore`, `CommissionStatus`, `Vertical`.

---

## 9. API Contract to Implement (mock now, document for backend)

Provide MSW handlers + types + `API_CONTRACT.md` for at least these endpoint groups (RESTful, JWT-protected, role-gated, paginated lists):

- **Auth:** `POST /auth/register`, `POST /auth/login`, `POST /auth/google`, `POST /auth/refresh`, `POST /auth/logout`, `POST /auth/mfa/verify`, `POST /auth/password/forgot|reset`, `GET /auth/me`
- **AI / Chat:** `POST /ai/conversations`, `POST /ai/conversations/:id/messages` (streaming), `GET /ai/conversations/:id`, `GET /ai/conversations` (admin)
- **Leads:** `GET /leads`, `GET /leads/:id`, `POST /leads`, `PATCH /leads/:id/status`, `POST /leads/:id/assign`, `POST /leads/:id/accept`, `POST /leads/:id/decline`
- **Vehicles:** `GET /vehicles`, `GET /vehicles/:id`, `POST /vehicles`, `PATCH /vehicles/:id`, `DELETE /vehicles/:id` (soft)
- **Dealers:** `GET /dealers`, `GET /dealers/:id`, `POST /dealers`, `PATCH /dealers/:id`, suspend/approve
- **Commissions:** `GET /commissions`, `GET /commissions/:id`, invoice + payment endpoints
- **Users/Roles (admin):** CRUD + role assignment
- **Knowledge docs (RAG):** `GET/POST/DELETE /knowledge-documents`, ingestion status
- **Referral codes**, **Notifications**, **Audit logs** (read/search)
- **Analytics:** dashboard aggregate endpoints for admin & dealer

Every endpoint must specify: method, path, auth/role, request schema, response schema (success + error), pagination/filtering. Seed MSW with realistic Mauritius automotive data (MUR pricing, local makes/models).

---

## 10. Deliverables

1. Full React + TS app implementing all screens above, behind the mock API layer.
2. `src/api/types/` — complete typed contract + Zod schemas.
3. `src/api/services/` — typed service layer (the only place that calls the API).
4. MSW mock backend covering every endpoint with seeded data; toggleable via env.
5. `API_CONTRACT.md` — full endpoint documentation for backend handoff.
6. Design system (Tailwind theme + shadcn components + dark mode + i18n EN/FR).
7. Tests (unit + integration + E2E) and GitHub Actions CI + Dockerfile.
8. `README.md` — setup, env vars (`VITE_API_BASE_URL`, `VITE_USE_MOCKS`), scripts, architecture overview, and **how the backend will plug in**.

**Start by:** scaffolding the project, the design system, the API client + types + MSW layer, and the `API_CONTRACT.md` — then build screens feature-by-feature (Public → AI Advisor → Dealer Portal → Admin Portal), shipping tests with each.
