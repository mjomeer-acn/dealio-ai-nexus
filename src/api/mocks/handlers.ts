import { ApiClientError, registerMock } from "../client";
import { db, newId, nowIso } from "./seed";
import type {
  AdminDashboardKpis,
  ApiSuccess,
  AuthResponse,
  Commission,
  Conversation,
  CreateLeadRequest,
  Dealer,
  DealerDashboardKpis,
  KnowledgeDocument,
  Lead,
  LeadStatusEntry,
  Message,
  Notification,
  UpdateLeadStatusRequest,
  User,
  Vehicle,
} from "../types";

const ok = <T>(data: T, meta?: ApiSuccess<T>["meta"]): ApiSuccess<T> => ({ data, meta });

function paginate<T>(items: T[], query: Record<string, string | undefined>): { rows: T[]; meta: ApiSuccess<T>["meta"] } {
  const page = Math.max(1, Number(query.page ?? 1));
  const limit = Math.min(100, Math.max(1, Number(query.limit ?? 20)));
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit;
  return { rows: items.slice(start, start + limit), meta: { page, limit, total, totalPages } };
}

function search<T>(items: T[], q: string | undefined, fields: (keyof T)[]): T[] {
  if (!q) return items;
  const lower = q.toLowerCase();
  return items.filter((it) =>
    fields.some((f) => String((it as Record<string, unknown>)[f as string] ?? "").toLowerCase().includes(lower)),
  );
}

function notDeleted<T extends { deletedAt?: string | null }>(items: T[]): T[] {
  return items.filter((i) => !i.deletedAt);
}

function requireAuth(): User {
  if (typeof window === "undefined") {
    throw new ApiClientError({ code: "UNAUTHENTICATED", message: "No session" }, 401);
  }
  const id = window.localStorage.getItem("dealio.userId");
  const u = db.users.find((x) => x.id === id);
  if (!u) throw new ApiClientError({ code: "UNAUTHENTICATED", message: "No session" }, 401);
  return u;
}

// ---------- Auth ----------

function fakeTokens(userId: string) {
  return {
    accessToken: `mock.${userId}.${Date.now()}`,
    refreshToken: `refresh.${userId}.${Date.now()}`,
    expiresIn: 3600,
  };
}

registerMock("POST", "/auth/login", async ({ body }) => {
  const { email } = (body ?? {}) as { email?: string; password?: string };
  const user = db.users.find((u) => u.email.toLowerCase() === (email ?? "").toLowerCase());
  if (!user) throw new ApiClientError({ code: "INVALID_CREDENTIALS", message: "Invalid email or password" }, 401);
  return ok<AuthResponse>({ user, tokens: fakeTokens(user.id) });
});

registerMock("POST", "/auth/google", async () => {
  const user = db.users.find((u) => u.roles.includes("CUSTOMER"))!;
  return ok<AuthResponse>({ user, tokens: fakeTokens(user.id) });
});

registerMock("POST", "/auth/register", async ({ body }) => {
  const b = (body ?? {}) as { email: string; firstName: string; lastName: string; phone?: string };
  if (db.users.some((u) => u.email === b.email)) {
    throw new ApiClientError({ code: "EMAIL_TAKEN", message: "Email already registered" }, 409);
  }
  const user: User = {
    id: newId("usr"),
    email: b.email,
    firstName: b.firstName,
    lastName: b.lastName,
    phone: b.phone,
    roles: ["CUSTOMER"],
    mfaEnabled: false,
    active: true,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  db.users.push(user);
  return ok<AuthResponse>({ user, tokens: fakeTokens(user.id) });
});

registerMock("POST", "/auth/refresh", async () => {
  const user = requireAuth();
  return ok({ tokens: fakeTokens(user.id) });
});
registerMock("POST", "/auth/logout", async () => ok({ success: true }));
registerMock("POST", "/auth/mfa/verify", async ({ body }) => {
  const { code } = (body ?? {}) as { code?: string };
  if (code !== "123456") throw new ApiClientError({ code: "MFA_INVALID", message: "Invalid code" }, 401);
  const user = requireAuth();
  return ok({ user, tokens: fakeTokens(user.id) });
});
registerMock("POST", "/auth/password/forgot", async () => ok({ sent: true }));
registerMock("POST", "/auth/password/reset", async () => ok({ success: true }));
registerMock("GET", "/auth/me", async () => ok(requireAuth()));

// ---------- Vehicles ----------

registerMock("GET", "/vehicles", async ({ query }) => {
  let items = notDeleted(db.vehicles).filter((v) => v.status === "PUBLISHED");
  items = search(items, query.q, ["make", "model", "color", "description"]);
  if (query.make) items = items.filter((v) => v.make === query.make);
  if (query.bodyType) items = items.filter((v) => v.bodyType === query.bodyType);
  if (query.fuelType) items = items.filter((v) => v.fuelType === query.fuelType);
  if (query.transmission) items = items.filter((v) => v.transmission === query.transmission);
  if (query.minPrice) items = items.filter((v) => v.priceMUR >= Number(query.minPrice));
  if (query.maxPrice) items = items.filter((v) => v.priceMUR <= Number(query.maxPrice));
  if (query.featured) items = items.filter((v) => v.featured);
  const { rows, meta } = paginate(items, query);
  return ok<Vehicle[]>(rows, meta);
});

registerMock("GET", "/vehicles/:id", async ({ pathParams }) => {
  const v = db.vehicles.find((x) => x.id === pathParams.id && !x.deletedAt);
  if (!v) throw new ApiClientError({ code: "NOT_FOUND", message: "Vehicle not found" }, 404);
  return ok(v);
});

registerMock("POST", "/vehicles", async ({ body }) => {
  const u = requireAuth();
  const b = (body ?? {}) as Partial<Vehicle>;
  const v: Vehicle = {
    ...b,
    id: newId("veh"),
    dealerId: u.dealerId ?? db.dealers[0]!.id,
    images: b.images ?? [],
    featured: b.featured ?? false,
    status: b.status ?? "PUBLISHED",
    createdAt: nowIso(),
    updatedAt: nowIso(),
  } as Vehicle;
  db.vehicles.unshift(v);
  return ok(v);
});

registerMock("PATCH", "/vehicles/:id", async ({ pathParams, body }) => {
  const i = db.vehicles.findIndex((x) => x.id === pathParams.id);
  if (i < 0) throw new ApiClientError({ code: "NOT_FOUND", message: "Vehicle not found" }, 404);
  db.vehicles[i] = { ...db.vehicles[i], ...(body as Partial<Vehicle>), updatedAt: nowIso() };
  return ok(db.vehicles[i]);
});

registerMock("DELETE", "/vehicles/:id", async ({ pathParams }) => {
  const i = db.vehicles.findIndex((x) => x.id === pathParams.id);
  if (i < 0) throw new ApiClientError({ code: "NOT_FOUND", message: "Vehicle not found" }, 404);
  db.vehicles[i] = { ...db.vehicles[i], deletedAt: nowIso(), updatedAt: nowIso() };
  return ok({ success: true });
});

// ---------- Leads ----------

registerMock("GET", "/leads", async ({ query }) => {
  const u = requireAuth();
  let items = notDeleted(db.leads);
  if (u.roles.includes("DEALER") || u.roles.includes("DEALER_STAFF")) {
    items = items.filter((l) => l.assignedDealerId === u.dealerId);
  } else if (u.roles.includes("CUSTOMER") && !u.roles.includes("ADMIN")) {
    items = items.filter((l) => l.customerUserId === u.id || l.customerEmail === u.email);
  }
  if (query.status) items = items.filter((l) => l.currentStatus === query.status);
  if (query.score) items = items.filter((l) => l.score === query.score);
  items = search(items, query.q, ["customerName", "customerEmail", "referralCode"]);
  const { rows, meta } = paginate(items, query);
  return ok<Lead[]>(rows, meta);
});

registerMock("GET", "/leads/:id", async ({ pathParams }) => {
  const l = db.leads.find((x) => x.id === pathParams.id);
  if (!l) throw new ApiClientError({ code: "NOT_FOUND", message: "Lead not found" }, 404);
  return ok(l);
});

registerMock("POST", "/leads", async ({ body }) => {
  const b = body as CreateLeadRequest;
  const score: Lead["score"] = (() => {
    const max = b.qualification?.budgetMURMax ?? 0;
    const timeline = b.qualification?.timeline;
    if (max >= 1_500_000 && (timeline === "IMMEDIATE" || timeline === "WITHIN_1_MONTH")) return "HOT";
    if (max >= 600_000) return "WARM";
    return "COLD";
  })();
  const lead: Lead = {
    id: newId("led"),
    referralCode: `DLO-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    vertical: "AUTOMOTIVE",
    customerName: b.customerName,
    customerEmail: b.customerEmail,
    customerPhone: b.customerPhone,
    source: b.source,
    conversationId: b.conversationId,
    vehicleId: b.vehicleId,
    qualification: b.qualification ?? {},
    score,
    currentStatus: "NEW",
    statusHistory: [
      {
        id: newId("lsh"),
        status: "NEW",
        timestamp: nowIso(),
        userId: "system",
        userName: "System",
      },
    ],
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  db.leads.unshift(lead);
  return ok(lead);
});

registerMock("PATCH", "/leads/:id/status", async ({ pathParams, body }) => {
  const u = requireAuth();
  const b = body as UpdateLeadStatusRequest;
  const i = db.leads.findIndex((x) => x.id === pathParams.id);
  if (i < 0) throw new ApiClientError({ code: "NOT_FOUND", message: "Lead not found" }, 404);
  const lead = db.leads[i]!;
  const entry: LeadStatusEntry = {
    id: newId("lsh"),
    status: b.status,
    timestamp: nowIso(),
    userId: u.id,
    userName: `${u.firstName} ${u.lastName}`,
    comment: b.comment,
  };
  lead.currentStatus = b.status;
  lead.statusHistory = [...lead.statusHistory, entry];
  if (b.status === "SOLD" && b.saleAmountMUR) {
    lead.saleAmountMUR = b.saleAmountMUR;
    lead.saleClosedAt = nowIso();
    // generate commission
    const dealer = db.dealers.find((d) => d.id === lead.assignedDealerId);
    if (dealer) {
      db.commissions.unshift({
        id: newId("com"),
        leadId: lead.id,
        dealerId: dealer.id,
        dealerName: dealer.name,
        saleAmountMUR: b.saleAmountMUR,
        rate: dealer.commissionRate,
        amountMUR: Math.round(b.saleAmountMUR * dealer.commissionRate),
        status: "PENDING",
        createdAt: nowIso(),
        updatedAt: nowIso(),
      });
    }
  }
  if (b.status === "LOST") lead.lostReason = b.lostReason;
  lead.updatedAt = nowIso();
  return ok(lead);
});

registerMock("POST", "/leads/:id/assign", async ({ pathParams, body }) => {
  const { dealerId } = (body ?? {}) as { dealerId?: string };
  const i = db.leads.findIndex((x) => x.id === pathParams.id);
  if (i < 0) throw new ApiClientError({ code: "NOT_FOUND", message: "Lead not found" }, 404);
  const lead = db.leads[i]!;
  lead.assignedDealerId = dealerId;
  lead.assignedAt = nowIso();
  lead.ownershipExpiresAt = new Date(Date.now() + 90 * 86400_000).toISOString();
  lead.currentStatus = "ASSIGNED";
  lead.statusHistory = [
    ...lead.statusHistory,
    {
      id: newId("lsh"),
      status: "ASSIGNED",
      timestamp: nowIso(),
      userId: "admin",
      userName: "Admin reassignment",
    },
  ];
  lead.updatedAt = nowIso();
  return ok(lead);
});

registerMock("POST", "/leads/:id/accept", async ({ pathParams }) => {
  const u = requireAuth();
  const lead = db.leads.find((x) => x.id === pathParams.id);
  if (!lead) throw new ApiClientError({ code: "NOT_FOUND", message: "Lead not found" }, 404);
  lead.statusHistory.push({
    id: newId("lsh"),
    status: "CONTACTED",
    timestamp: nowIso(),
    userId: u.id,
    userName: `${u.firstName} ${u.lastName}`,
    comment: "Lead accepted",
  });
  lead.currentStatus = "CONTACTED";
  lead.updatedAt = nowIso();
  return ok(lead);
});

registerMock("POST", "/leads/:id/decline", async ({ pathParams }) => {
  const lead = db.leads.find((x) => x.id === pathParams.id);
  if (!lead) throw new ApiClientError({ code: "NOT_FOUND", message: "Lead not found" }, 404);
  lead.assignedDealerId = undefined;
  lead.currentStatus = "QUALIFIED";
  lead.updatedAt = nowIso();
  return ok(lead);
});

// ---------- Dealers ----------

registerMock("GET", "/dealers", async ({ query }) => {
  let items = notDeleted(db.dealers);
  items = search(items, query.q, ["name", "legalName", "city"]);
  if (query.status) items = items.filter((d) => d.status === query.status);
  const { rows, meta } = paginate(items, query);
  return ok<Dealer[]>(rows, meta);
});
registerMock("GET", "/dealers/:id", async ({ pathParams }) => {
  const d = db.dealers.find((x) => x.id === pathParams.id);
  if (!d) throw new ApiClientError({ code: "NOT_FOUND", message: "Dealer not found" }, 404);
  return ok(d);
});
registerMock("POST", "/dealers", async ({ body }) => {
  const b = (body ?? {}) as Partial<Dealer>;
  const d: Dealer = {
    ...b,
    id: newId("dlr"),
    status: b.status ?? "PENDING",
    commissionRate: b.commissionRate ?? 0.03,
    verticals: b.verticals ?? ["AUTOMOTIVE"],
    staffCount: b.staffCount ?? 0,
    country: b.country ?? "Mauritius",
    createdAt: nowIso(),
    updatedAt: nowIso(),
  } as Dealer;
  db.dealers.unshift(d);
  return ok(d);
});
registerMock("PATCH", "/dealers/:id", async ({ pathParams, body }) => {
  const i = db.dealers.findIndex((x) => x.id === pathParams.id);
  if (i < 0) throw new ApiClientError({ code: "NOT_FOUND", message: "Dealer not found" }, 404);
  db.dealers[i] = { ...db.dealers[i], ...(body as Partial<Dealer>), updatedAt: nowIso() };
  return ok(db.dealers[i]);
});

// ---------- Users ----------

registerMock("GET", "/users", async ({ query }) => {
  let items = notDeleted(db.users);
  items = search(items, query.q, ["email", "firstName", "lastName"]);
  if (query.role) items = items.filter((u) => u.roles.includes(query.role as User["roles"][number]));
  const { rows, meta } = paginate(items, query);
  return ok<User[]>(rows, meta);
});
registerMock("PATCH", "/users/:id", async ({ pathParams, body }) => {
  const i = db.users.findIndex((x) => x.id === pathParams.id);
  if (i < 0) throw new ApiClientError({ code: "NOT_FOUND", message: "User not found" }, 404);
  db.users[i] = { ...db.users[i], ...(body as Partial<User>), updatedAt: nowIso() };
  return ok(db.users[i]);
});

// ---------- Commissions ----------

registerMock("GET", "/commissions", async ({ query }) => {
  const u = requireAuth();
  let items = db.commissions.slice();
  if (u.roles.includes("DEALER")) items = items.filter((c) => c.dealerId === u.dealerId);
  if (query.status) items = items.filter((c) => c.status === query.status);
  const { rows, meta } = paginate(items, query);
  return ok<Commission[]>(rows, meta);
});

// ---------- Knowledge Docs ----------

registerMock("GET", "/knowledge-documents", async ({ query }) => {
  const { rows, meta } = paginate(notDeleted(db.knowledgeDocs), query);
  return ok<KnowledgeDocument[]>(rows, meta);
});
registerMock("POST", "/knowledge-documents", async ({ body }) => {
  const u = requireAuth();
  const b = body as Partial<KnowledgeDocument>;
  const doc: KnowledgeDocument = {
    id: newId("kdb"),
    title: b.title ?? "Untitled",
    fileName: b.fileName ?? "file.pdf",
    fileType: b.fileType ?? "PDF",
    sizeBytes: b.sizeBytes ?? 0,
    vertical: b.vertical ?? "AUTOMOTIVE",
    status: "PROCESSING",
    uploadedByUserId: u.id,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  db.knowledgeDocs.unshift(doc);
  // simulate indexing
  setTimeout(() => {
    const d = db.knowledgeDocs.find((x) => x.id === doc.id);
    if (d) {
      d.status = "INDEXED";
      d.chunkCount = 64;
      d.updatedAt = nowIso();
    }
  }, 4000);
  return ok(doc);
});
registerMock("DELETE", "/knowledge-documents/:id", async ({ pathParams }) => {
  const i = db.knowledgeDocs.findIndex((x) => x.id === pathParams.id);
  if (i >= 0) db.knowledgeDocs[i] = { ...db.knowledgeDocs[i], deletedAt: nowIso() };
  return ok({ success: true });
});

// ---------- Notifications / Audit / Referral ----------

registerMock("GET", "/notifications", async () => {
  const u = requireAuth();
  return ok<Notification[]>(db.notifications.filter((n) => n.userId === u.id));
});
registerMock("GET", "/audit-logs", async ({ query }) => {
  let items = db.auditLogs.slice().reverse();
  items = search(items, query.q, ["action", "entityType", "actorName"]);
  const { rows, meta } = paginate(items, query);
  return ok(rows, meta);
});
registerMock("GET", "/referral-codes", async ({ query }) => {
  const { rows, meta } = paginate(db.referralCodes, query);
  return ok(rows, meta);
});

// ---------- Conversations / AI ----------

registerMock("POST", "/ai/conversations", async () => {
  const conv: Conversation = {
    id: newId("cnv"),
    sessionId: newId("sess"),
    language: "en",
    messages: [
      {
        id: newId("msg"),
        conversationId: "tmp",
        role: "assistant",
        content:
          "Hello — I'm Dealio, your AI buying advisor. Tell me what you're looking for and I'll match you with the right vehicle.",
        createdAt: nowIso(),
        updatedAt: nowIso(),
      },
    ],
    qualificationProgress: 0,
    qualification: {},
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  conv.messages[0]!.conversationId = conv.id;
  db.conversations.unshift(conv);
  return ok(conv);
});

registerMock("GET", "/ai/conversations/:id", async ({ pathParams }) => {
  const c = db.conversations.find((x) => x.id === pathParams.id);
  if (!c) throw new ApiClientError({ code: "NOT_FOUND", message: "Conversation not found" }, 404);
  return ok(c);
});

registerMock("POST", "/ai/conversations/:id/messages", async ({ pathParams, body }) => {
  const c = db.conversations.find((x) => x.id === pathParams.id);
  if (!c) throw new ApiClientError({ code: "NOT_FOUND", message: "Conversation not found" }, 404);
  const b = (body ?? {}) as { content: string };
  const userMsg: Message = {
    id: newId("msg"),
    conversationId: c.id,
    role: "user",
    content: b.content,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  c.messages.push(userMsg);
  // naive qualification capture
  const txt = b.content.toLowerCase();
  const budgetMatch = txt.match(/(\d{1,3}(?:[,.\s]?\d{3})+|\d+\s*m(?:illion)?)/);
  if (budgetMatch) {
    const n = Number(budgetMatch[1]!.replace(/[^0-9]/g, ""));
    if (n > 1000) c.qualification.budgetMURMax = n;
  }
  if (/suv/i.test(txt)) c.qualification.preferredBodyType = "SUV";
  if (/hybrid/i.test(txt)) c.qualification.notes = "interested in hybrid";
  if (/\b(immediate|asap|now|this week)\b/i.test(txt)) c.qualification.timeline = "IMMEDIATE";
  const emailM = txt.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
  if (emailM) c.customerEmailCaptured = emailM[0];
  const phoneM = txt.match(/\+?\d[\d\s().-]{6,}/);
  if (phoneM) c.customerPhoneCaptured = phoneM[0].trim();

  // progress estimate
  let prog = 0;
  if (c.qualification.budgetMURMax) prog += 0.3;
  if (c.qualification.preferredBodyType || c.qualification.preferredMake) prog += 0.2;
  if (c.qualification.timeline) prog += 0.2;
  if (c.customerEmailCaptured) prog += 0.15;
  if (c.customerPhoneCaptured) prog += 0.15;
  c.qualificationProgress = Math.min(1, prog);

  // assistant reply (deterministic mock)
  const recs = db.vehicles
    .filter((v) => v.status === "PUBLISHED")
    .slice(0, 3)
    .map((v) => ({ vehicleId: v.id, reason: `Matches your interest and stays within your budget.` }));
  const assistant: Message = {
    id: newId("msg"),
    conversationId: c.id,
    role: "assistant",
    content: assistantReplyFor(b.content, c),
    recommendations: c.qualificationProgress > 0.4 ? recs : undefined,
    citations:
      c.qualificationProgress > 0.5
        ? [
            {
              documentId: db.knowledgeDocs[0]!.id,
              title: db.knowledgeDocs[0]!.title,
              excerpt: "Toyota RAV4 Hybrid offers up to 4.8L/100km combined consumption…",
            },
          ]
        : undefined,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  c.messages.push(assistant);
  c.updatedAt = nowIso();
  return ok({ conversation: c, assistantMessage: assistant });
});

function assistantReplyFor(input: string, c: Conversation): string {
  if (!c.qualification.budgetMURMax)
    return "Got it. What's your approximate budget in MUR? A rough range is fine.";
  if (!c.qualification.preferredBodyType && !c.qualification.preferredMake)
    return "Great. Any preference on body type — SUV, sedan, hatchback, pickup?";
  if (!c.qualification.timeline)
    return "When are you hoping to buy? Immediately, within the month, or just exploring?";
  if (!c.customerEmailCaptured || !c.customerPhoneCaptured)
    return "Perfect. To send tailored matches and have a dealer reach out, could you share your email and phone?";
  return "Here are the best matches I found. A specialist dealer will follow up shortly with availability and financing options.";
}

// ---------- Analytics ----------

registerMock("GET", "/analytics/admin", async () => {
  const totalLeads = db.leads.length;
  const qualified = db.leads.filter((l) => l.currentStatus !== "NEW").length;
  const sold = db.leads.filter((l) => l.currentStatus === "SOLD");
  const revenueMUR = sold.reduce((s, l) => s + (l.saleAmountMUR ?? 0), 0);
  const commissionMUR = db.commissions.reduce((s, c) => s + c.amountMUR, 0);
  const kpis: AdminDashboardKpis = {
    totalLeads,
    qualifiedLeads: qualified,
    qualifiedRate: totalLeads ? qualified / totalLeads : 0,
    conversionRate: totalLeads ? sold.length / totalLeads : 0,
    revenueMUR,
    commissionMUR,
    monthlyTargetMUR: 100_000,
    monthlyProgressMUR: Math.min(100_000, commissionMUR),
    funnel: ["NEW", "QUALIFIED", "ASSIGNED", "CONTACTED", "NEGOTIATING", "SOLD"].map((s) => ({
      stage: s,
      count: db.leads.filter((l) => l.statusHistory.some((h) => h.status === s)).length,
    })),
    topDealers: db.dealers
      .map((d) => {
        const dSales = sold.filter((l) => l.assignedDealerId === d.id);
        return {
          dealerId: d.id,
          name: d.name,
          sales: dSales.length,
          revenueMUR: dSales.reduce((s, l) => s + (l.saleAmountMUR ?? 0), 0),
        };
      })
      .sort((a, b) => b.revenueMUR - a.revenueMUR),
    sourceBreakdown: ["AI_ADVISOR", "VEHICLE_DETAIL", "LANDING_FORM", "REFERRAL"].map((s) => ({
      source: s,
      count: db.leads.filter((l) => l.source === s).length,
    })),
  };
  return ok(kpis);
});

registerMock("GET", "/analytics/dealer", async () => {
  const u = requireAuth();
  const mine = db.leads.filter((l) => l.assignedDealerId === u.dealerId);
  const won = mine.filter((l) => l.currentStatus === "SOLD");
  const lost = mine.filter((l) => l.currentStatus === "LOST");
  const trend = Array.from({ length: 7 }).map((_, i) => ({
    date: new Date(Date.now() - (6 - i) * 86400_000).toISOString().slice(5, 10),
    leads: Math.floor(Math.random() * 5),
    sales: Math.floor(Math.random() * 2),
  }));
  const kpis: DealerDashboardKpis = {
    assignedLeads: mine.length,
    acceptedLeads: mine.filter((l) => l.currentStatus !== "ASSIGNED" && l.currentStatus !== "NEW" && l.currentStatus !== "QUALIFIED").length,
    inProgress: mine.filter((l) => ["CONTACTED", "NEGOTIATING"].includes(l.currentStatus)).length,
    won: won.length,
    lost: lost.length,
    commissionMUR: db.commissions.filter((c) => c.dealerId === u.dealerId).reduce((s, c) => s + c.amountMUR, 0),
    conversionRate: mine.length ? won.length / mine.length : 0,
    avgResponseTimeMins: 42,
    trend,
  };
  return ok(kpis);
});

export const __mocksRegistered = true;