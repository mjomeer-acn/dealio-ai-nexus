# Dealio API Contract

> Frontend ↔ Backend (Python/Flask) contract. The frontend ships an in-memory
> mock implementation behind `VITE_USE_MOCKS=true`. Flipping it to `false` and
> setting `VITE_API_BASE_URL` makes the app talk to the real backend with
> zero component changes.

## Conventions

- All responses use an envelope:
  - Success: `{ "data": <payload>, "meta"?: { page, limit, total, totalPages } }`
  - Error:   `{ "error": { "code": string, "message": string, "details"?: object } }`
- Auth via `Authorization: Bearer <jwt>` header. Refresh via `/auth/refresh`.
- Pagination/filter query params: `?page=&limit=&sort=&q=&<filter>=`.
- All entities have `id` (UUID), `createdAt`, `updatedAt`, `deletedAt?` (soft delete).
- Currency is MUR (integer, no decimals).

Full TypeScript types live in `src/api/types/index.ts` — those are the canonical schemas.

## Auth
| Method | Path                       | Roles  | Body                                               | Returns         |
|--------|----------------------------|--------|----------------------------------------------------|-----------------|
| POST   | /auth/login                | public | `{ email, password }`                              | `AuthResponse`  |
| POST   | /auth/register             | public | `{ email, password, firstName, lastName, phone? }` | `AuthResponse`  |
| POST   | /auth/google               | public | OAuth payload                                      | `AuthResponse`  |
| POST   | /auth/refresh              | user   | —                                                  | `{ tokens }`    |
| POST   | /auth/logout               | user   | —                                                  | `{ success }`   |
| POST   | /auth/mfa/verify           | user   | `{ challengeId, code }`                            | `AuthResponse`  |
| POST   | /auth/password/forgot      | public | `{ email }`                                        | `{ sent }`      |
| POST   | /auth/password/reset       | public | `{ token, password }`                              | `{ success }`   |
| GET    | /auth/me                   | user   | —                                                  | `User`          |

## Vehicles
| Method | Path             | Roles            | Notes                                                          |
|--------|------------------|------------------|----------------------------------------------------------------|
| GET    | /vehicles        | public           | Filters: `q, make, bodyType, fuelType, transmission, minPrice, maxPrice, featured` |
| GET    | /vehicles/:id    | public           |                                                                |
| POST   | /vehicles        | DEALER, ADMIN    | Body: `Vehicle` (partial)                                      |
| PATCH  | /vehicles/:id    | DEALER, ADMIN    |                                                                |
| DELETE | /vehicles/:id    | DEALER, ADMIN    | Soft delete                                                    |

## Leads
| Method | Path                        | Roles                  | Body / Notes                                                 |
|--------|-----------------------------|------------------------|--------------------------------------------------------------|
| GET    | /leads                      | role-scoped            | Customer: own; Dealer: assigned; Admin: all                  |
| GET    | /leads/:id                  | role-scoped            |                                                              |
| POST   | /leads                      | public + user          | `CreateLeadRequest` (see types)                              |
| PATCH  | /leads/:id/status           | DEALER, ADMIN          | `UpdateLeadStatusRequest`. Generates Commission on SOLD.     |
| POST   | /leads/:id/assign           | ADMIN                  | `{ dealerId }`. Resets 90-day ownership.                     |
| POST   | /leads/:id/accept           | DEALER                 | Moves to CONTACTED                                           |
| POST   | /leads/:id/decline          | DEALER                 | Releases ownership                                           |

## Dealers
| Method | Path                  | Roles  |
|--------|-----------------------|--------|
| GET    | /dealers              | user   |
| GET    | /dealers/:id          | user   |
| POST   | /dealers              | ADMIN  |
| PATCH  | /dealers/:id          | ADMIN  | also handles approve/suspend via `status` field |

## Users & Roles
| Method | Path           | Roles  |
|--------|----------------|--------|
| GET    | /users         | ADMIN  |
| PATCH  | /users/:id     | ADMIN  | edit roles, `active`, reset `mfaEnabled` |

## Commissions
| Method | Path             | Roles                 | Notes                          |
|--------|------------------|-----------------------|--------------------------------|
| GET    | /commissions     | DEALER (own), ADMIN   | Filter: `status`               |

## Knowledge Base (RAG)
| Method | Path                          | Roles  | Notes                                       |
|--------|-------------------------------|--------|---------------------------------------------|
| GET    | /knowledge-documents          | ADMIN  | Returns `KnowledgeDocument[]` w/ `status`   |
| POST   | /knowledge-documents          | ADMIN  | Async indexing (PROCESSING → INDEXED)       |
| DELETE | /knowledge-documents/:id      | ADMIN  | Soft delete                                 |

## AI / Conversations
| Method | Path                                       | Roles  | Notes                                    |
|--------|--------------------------------------------|--------|------------------------------------------|
| POST   | /ai/conversations                          | public | Creates new `Conversation`               |
| GET    | /ai/conversations/:id                      | owner  |                                          |
| POST   | /ai/conversations/:id/messages             | owner  | `{ content }` → `{ conversation, assistantMessage }`. Should stream (SSE) in real backend. |

## Notifications / Audit / Referral
| Method | Path              | Roles |
|--------|-------------------|-------|
| GET    | /notifications    | user  |
| GET    | /audit-logs       | ADMIN |
| GET    | /referral-codes   | ADMIN |

## Analytics
| Method | Path                | Roles  | Returns                  |
|--------|---------------------|--------|--------------------------|
| GET    | /analytics/admin    | ADMIN  | `AdminDashboardKpis`     |
| GET    | /analytics/dealer   | DEALER | `DealerDashboardKpis`    |

## Error codes used

`UNAUTHENTICATED`, `INVALID_CREDENTIALS`, `EMAIL_TAKEN`, `MFA_INVALID`, `NOT_FOUND`, `FORBIDDEN`, `RATE_LIMITED`, `VALIDATION_ERROR`.
