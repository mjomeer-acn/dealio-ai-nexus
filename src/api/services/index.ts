import { apiRequest } from "../client";
import "../mocks/handlers";
import type {
  AdminDashboardKpis,
  AuthResponse,
  Commission,
  Conversation,
  CreateLeadRequest,
  Dealer,
  DealerDashboardKpis,
  KnowledgeDocument,
  Lead,
  ListParams,
  Message,
  Notification,
  UpdateLeadStatusRequest,
  User,
  Vehicle,
} from "../types";

const qs = (p?: ListParams): Record<string, string | number | boolean | undefined> => {
  if (!p) return {};
  return { page: p.page, limit: p.limit, sort: p.sort, q: p.q, ...(p.filter ?? {}) };
};

export const authService = {
  login: (email: string, password: string) =>
    apiRequest<AuthResponse>("/auth/login", { method: "POST", body: { email, password } }),
  register: (data: { email: string; password: string; firstName: string; lastName: string; phone?: string }) =>
    apiRequest<AuthResponse>("/auth/register", { method: "POST", body: data }),
  loginWithGoogle: () => apiRequest<AuthResponse>("/auth/google", { method: "POST" }),
  refresh: () => apiRequest<{ tokens: AuthResponse["tokens"] }>("/auth/refresh", { method: "POST" }),
  logout: () => apiRequest("/auth/logout", { method: "POST" }),
  verifyMfa: (challengeId: string, code: string) =>
    apiRequest<AuthResponse>("/auth/mfa/verify", { method: "POST", body: { challengeId, code } }),
  forgotPassword: (email: string) => apiRequest("/auth/password/forgot", { method: "POST", body: { email } }),
  resetPassword: (token: string, password: string) =>
    apiRequest("/auth/password/reset", { method: "POST", body: { token, password } }),
  me: () => apiRequest<User>("/auth/me"),
};

export const vehiclesService = {
  list: (params?: ListParams) => apiRequest<Vehicle[]>("/vehicles", { query: qs(params) }),
  get: (id: string) => apiRequest<Vehicle>(`/vehicles/${id}`),
  create: (data: Partial<Vehicle>) => apiRequest<Vehicle>("/vehicles", { method: "POST", body: data }),
  update: (id: string, data: Partial<Vehicle>) =>
    apiRequest<Vehicle>(`/vehicles/${id}`, { method: "PATCH", body: data }),
  remove: (id: string) => apiRequest(`/vehicles/${id}`, { method: "DELETE" }),
};

export const leadsService = {
  list: (params?: ListParams) => apiRequest<Lead[]>("/leads", { query: qs(params) }),
  get: (id: string) => apiRequest<Lead>(`/leads/${id}`),
  create: (data: CreateLeadRequest) => apiRequest<Lead>("/leads", { method: "POST", body: data }),
  updateStatus: (id: string, data: UpdateLeadStatusRequest) =>
    apiRequest<Lead>(`/leads/${id}/status`, { method: "PATCH", body: data }),
  assign: (id: string, dealerId: string) =>
    apiRequest<Lead>(`/leads/${id}/assign`, { method: "POST", body: { dealerId } }),
  accept: (id: string) => apiRequest<Lead>(`/leads/${id}/accept`, { method: "POST" }),
  decline: (id: string) => apiRequest<Lead>(`/leads/${id}/decline`, { method: "POST" }),
};

export const dealersService = {
  list: (params?: ListParams) => apiRequest<Dealer[]>("/dealers", { query: qs(params) }),
  get: (id: string) => apiRequest<Dealer>(`/dealers/${id}`),
  create: (data: Partial<Dealer>) => apiRequest<Dealer>("/dealers", { method: "POST", body: data }),
  update: (id: string, data: Partial<Dealer>) =>
    apiRequest<Dealer>(`/dealers/${id}`, { method: "PATCH", body: data }),
};

export const usersService = {
  list: (params?: ListParams) => apiRequest<User[]>("/users", { query: qs(params) }),
  update: (id: string, data: Partial<User>) =>
    apiRequest<User>(`/users/${id}`, { method: "PATCH", body: data }),
};

export const commissionsService = {
  list: (params?: ListParams) => apiRequest<Commission[]>("/commissions", { query: qs(params) }),
};

export const knowledgeService = {
  list: (params?: ListParams) => apiRequest<KnowledgeDocument[]>("/knowledge-documents", { query: qs(params) }),
  upload: (data: Partial<KnowledgeDocument>) =>
    apiRequest<KnowledgeDocument>("/knowledge-documents", { method: "POST", body: data }),
  remove: (id: string) => apiRequest(`/knowledge-documents/${id}`, { method: "DELETE" }),
};

export const auditService = {
  list: (params?: ListParams) => apiRequest("/audit-logs", { query: qs(params) }),
};

export const notificationsService = {
  list: () => apiRequest<Notification[]>("/notifications"),
};

export const aiService = {
  startConversation: () => apiRequest<Conversation>("/ai/conversations", { method: "POST" }),
  getConversation: (id: string) => apiRequest<Conversation>(`/ai/conversations/${id}`),
  sendMessage: (id: string, content: string) =>
    apiRequest<{ conversation: Conversation; assistantMessage: Message }>(
      `/ai/conversations/${id}/messages`,
      { method: "POST", body: { content } },
    ),
};

export const analyticsService = {
  admin: () => apiRequest<AdminDashboardKpis>("/analytics/admin"),
  dealer: () => apiRequest<DealerDashboardKpis>("/analytics/dealer"),
};