import { z } from "zod";

export const emailSchema = z.string().trim().email().max(255);
export const phoneSchema = z
  .string()
  .trim()
  .min(5)
  .max(32)
  .regex(/^[+0-9\s().-]+$/, "Invalid phone number");
export const passwordSchema = z
  .string()
  .min(8, "At least 8 characters")
  .max(72)
  .regex(/[A-Z]/, "Needs an uppercase letter")
  .regex(/[a-z]/, "Needs a lowercase letter")
  .regex(/[0-9]/, "Needs a number");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password required").max(72),
});

export const registerSchema = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  email: emailSchema,
  phone: phoneSchema.optional(),
  password: passwordSchema,
});

export const leadCaptureSchema = z.object({
  customerName: z.string().trim().min(2).max(120),
  customerEmail: emailSchema,
  customerPhone: phoneSchema,
  budgetMURMin: z.coerce.number().int().nonnegative().optional(),
  budgetMURMax: z.coerce.number().int().positive().max(50_000_000).optional(),
  preferredMake: z.string().trim().max(60).optional(),
  preferredModel: z.string().trim().max(60).optional(),
  timeline: z
    .enum(["IMMEDIATE", "WITHIN_1_MONTH", "WITHIN_3_MONTHS", "EXPLORING"])
    .optional(),
  financingNeeded: z.boolean().optional(),
  notes: z.string().trim().max(2000).optional(),
});

export const updateLeadStatusSchema = z.object({
  status: z.enum([
    "NEW",
    "QUALIFIED",
    "ASSIGNED",
    "CONTACTED",
    "NEGOTIATING",
    "SOLD",
    "LOST",
  ]),
  comment: z.string().trim().max(1000).optional(),
  saleAmountMUR: z.coerce.number().int().positive().max(50_000_000).optional(),
  lostReason: z.string().trim().max(500).optional(),
});

export const vehicleSchema = z.object({
  make: z.string().trim().min(1).max(60),
  model: z.string().trim().min(1).max(60),
  year: z.coerce.number().int().min(1980).max(new Date().getFullYear() + 1),
  bodyType: z.enum(["SEDAN", "SUV", "HATCHBACK", "COUPE", "PICKUP", "VAN", "CONVERTIBLE"]),
  fuelType: z.enum(["PETROL", "DIESEL", "HYBRID", "ELECTRIC"]),
  transmission: z.enum(["MANUAL", "AUTOMATIC", "CVT"]),
  mileageKm: z.coerce.number().int().nonnegative().max(1_000_000),
  priceMUR: z.coerce.number().int().positive().max(50_000_000),
  color: z.string().trim().min(1).max(40),
  description: z.string().trim().min(10).max(5000),
  features: z.array(z.string().trim().max(80)).max(40).default([]),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
export type LeadCaptureFormValues = z.infer<typeof leadCaptureSchema>;
export type UpdateLeadStatusFormValues = z.infer<typeof updateLeadStatusSchema>;
export type VehicleFormValues = z.infer<typeof vehicleSchema>;