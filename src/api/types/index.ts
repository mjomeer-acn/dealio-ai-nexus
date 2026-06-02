/**
 * Dealio API contract — entity types and DTOs.
 * These types ARE the contract with the backend (Python/Flask).
 * Every entity has id (UUID), createdAt, updatedAt and soft-delete deletedAt.
 */

export type UUID = string;
export type ISODate = string;

export type Vertical = "AUTOMOTIVE" | "REAL_ESTATE" | "INSURANCE" | "FINANCING" | "SOLAR" | "CONSTRUCTION" | "PROFESSIONAL_SERVICES";

export type Role =
  | "GUEST"
  | "CUSTOMER"
  | "DEALER"
  | "DEALER_STAFF"
  | "ADMIN"
  | "SUPER_ADMIN";

export type LeadStatusType =
  | "NEW"
  | "QUALIFIED"
  | "ASSIGNED"
  | "CONTACTED"
  | "NEGOTIATING"
  | "SOLD"
  | "LOST";

export type LeadScore = "HOT" | "WARM" | "COLD";

export type CommissionStatus = "PENDING" | "INVOICED" | "PAID" | "DISPUTED";

export type DealerStatus = "PENDING" | "ACTIVE" | "SUSPENDED";

export type KnowledgeDocStatus = "UPLOADED" | "PROCESSING" | "INDEXED" | "FAILED";

export interface BaseEntity {
  id: UUID;
  createdAt: ISODate;
  updatedAt: ISODate;
  deletedAt?: ISODate | null;
}

export interface User extends BaseEntity {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  roles: Role[];
  dealerId?: UUID;
  avatarUrl?: string;
  mfaEnabled: boolean;
  lastLoginAt?: ISODate;
  active: boolean;
}

export interface Dealer extends BaseEntity {
  name: string;
  legalName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  logoUrl?: string;
  status: DealerStatus;
  commissionRate: number; // 0..1
  verticals: Vertical[];
  staffCount: number;
  rating?: number;
}

export interface Vehicle extends BaseEntity {
  dealerId: UUID;
  make: string;
  model: string;
  year: number;
  trim?: string;
  bodyType: "SEDAN" | "SUV" | "HATCHBACK" | "COUPE" | "PICKUP" | "VAN" | "CONVERTIBLE";
  fuelType: "PETROL" | "DIESEL" | "HYBRID" | "ELECTRIC";
  transmission: "MANUAL" | "AUTOMATIC" | "CVT";
  mileageKm: number;
  priceMUR: number;
  monthlyFromMUR?: number;
  color: string;
  vin?: string;
  description: string;
  images: string[];
  features: string[];
  featured: boolean;
  status: "DRAFT" | "PUBLISHED" | "SOLD" | "ARCHIVED";
}

export interface LeadQualification {
  budgetMURMin?: number;
  budgetMURMax?: number;
  preferredMake?: string;
  preferredModel?: string;
  preferredBodyType?: Vehicle["bodyType"];
  timeline?: "IMMEDIATE" | "WITHIN_1_MONTH" | "WITHIN_3_MONTHS" | "EXPLORING";
  financingNeeded?: boolean;
  tradeInVehicle?: string;
  notes?: string;
}

export interface LeadStatusEntry {
  id: UUID;
  status: LeadStatusType;
  timestamp: ISODate;
  userId: UUID;
  userName: string;
  comment?: string;
}

export interface Lead extends BaseEntity {
  referralCode: string;
  vertical: Vertical;
  // Customer
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerUserId?: UUID;
  // Source
  source: "AI_ADVISOR" | "VEHICLE_DETAIL" | "LANDING_FORM" | "REFERRAL" | "MANUAL";
  conversationId?: UUID;
  vehicleId?: UUID;
  // Qualification
  qualification: LeadQualification;
  score: LeadScore;
  scoreReason?: string;
  // Assignment / ownership
  assignedDealerId?: UUID;
  assignedAt?: ISODate;
  ownershipExpiresAt?: ISODate; // 90 days
  // Status
  currentStatus: LeadStatusType;
  statusHistory: LeadStatusEntry[];
  // Outcome
  saleAmountMUR?: number;
  saleClosedAt?: ISODate;
  lostReason?: string;
}

export interface Commission extends BaseEntity {
  leadId: UUID;
  dealerId: UUID;
  dealerName: string;
  saleAmountMUR: number;
  rate: number;
  amountMUR: number;
  status: CommissionStatus;
  invoiceId?: UUID;
  invoiceNumber?: string;
  paidAt?: ISODate;
}

export interface ReferralCode extends BaseEntity {
  code: string;
  ownerUserId?: UUID;
  ownerDealerId?: UUID;
  usageCount: number;
  active: boolean;
}

export interface Contract extends BaseEntity {
  leadId: UUID;
  dealerId: UUID;
  fileUrl: string;
  signedAt?: ISODate;
  totalMUR: number;
}

export interface ChatCitation {
  documentId: UUID;
  title: string;
  excerpt: string;
}

export interface ChatRecommendation {
  vehicleId: UUID;
  reason: string;
}

export interface Message extends BaseEntity {
  conversationId: UUID;
  role: "user" | "assistant" | "system";
  content: string;
  citations?: ChatCitation[];
  recommendations?: ChatRecommendation[];
}

export interface Conversation extends BaseEntity {
  userId?: UUID;
  sessionId: string;
  language: "en" | "fr";
  messages: Message[];
  linkedLeadId?: UUID;
  qualificationProgress: number; // 0..1
  qualification: LeadQualification;
  customerNameCaptured?: string;
  customerEmailCaptured?: string;
  customerPhoneCaptured?: string;
}

export interface KnowledgeDocument extends BaseEntity {
  title: string;
  description?: string;
  fileName: string;
  fileType: "PDF" | "DOCX" | "MD" | "TXT" | "CSV";
  sizeBytes: number;
  vertical: Vertical;
  status: KnowledgeDocStatus;
  chunkCount?: number;
  uploadedByUserId: UUID;
}

export interface Notification extends BaseEntity {
  userId: UUID;
  type: "LEAD_ASSIGNED" | "LEAD_STATUS_CHANGED" | "COMMISSION_PAID" | "SYSTEM";
  title: string;
  message: string;
  read: boolean;
  link?: string;
}

export interface AuditLog extends BaseEntity {
  actorUserId: UUID;
  actorName: string;
  action: string; // e.g. "lead.status.change", "dealer.suspend"
  entityType: string;
  entityId: UUID;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  ip?: string;
}

// ---- API envelopes ----

export interface ApiMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
}

export interface ApiSuccess<T> {
  data: T;
  meta?: ApiMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ApiErrorResponse {
  error: ApiError;
}

export interface ListParams {
  page?: number;
  limit?: number;
  sort?: string;
  q?: string;
  filter?: Record<string, string | number | boolean | undefined>;
}

// ---- Auth DTOs ----

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
  mfaRequired?: boolean;
  mfaChallengeId?: string;
}

// ---- Lead DTOs ----

export interface CreateLeadRequest {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  vehicleId?: UUID;
  conversationId?: UUID;
  source: Lead["source"];
  qualification?: LeadQualification;
  referralCode?: string;
}

export interface UpdateLeadStatusRequest {
  status: LeadStatusType;
  comment?: string;
  saleAmountMUR?: number;
  lostReason?: string;
}

// ---- Analytics ----

export interface AdminDashboardKpis {
  totalLeads: number;
  qualifiedLeads: number;
  qualifiedRate: number;
  conversionRate: number;
  revenueMUR: number;
  commissionMUR: number;
  monthlyTargetMUR: number;
  monthlyProgressMUR: number;
  funnel: { stage: string; count: number }[];
  topDealers: { dealerId: UUID; name: string; sales: number; revenueMUR: number }[];
  sourceBreakdown: { source: string; count: number }[];
}

export interface DealerDashboardKpis {
  assignedLeads: number;
  acceptedLeads: number;
  inProgress: number;
  won: number;
  lost: number;
  commissionMUR: number;
  conversionRate: number;
  avgResponseTimeMins: number;
  trend: { date: string; leads: number; sales: number }[];
}