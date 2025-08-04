
import { z } from 'zod';

// Enum schemas
export const userRoleSchema = z.enum(['super_admin', 'village_user']);
export const paymentTypeSchema = z.enum(['tunai', 'transfer', 'setoran']);

// User schemas
export const userSchema = z.object({
  id: z.number(),
  username: z.string(),
  password_hash: z.string(),
  full_name: z.string(),
  role: userRoleSchema,
  village_id: z.number().nullable(),
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export type User = z.infer<typeof userSchema>;

export const createUserInputSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
  full_name: z.string().min(1),
  role: userRoleSchema,
  village_id: z.number().optional(),
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export const updateUserInputSchema = z.object({
  id: z.number(),
  username: z.string().min(3).optional(),
  password: z.string().min(6).optional(),
  full_name: z.string().min(1).optional(),
  role: userRoleSchema.optional(),
  village_id: z.number().nullable().optional(),
  is_active: z.boolean().optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserInputSchema>;

// Village schemas
export const villageSchema = z.object({
  id: z.number(),
  name: z.string(),
  code: z.string(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export type Village = z.infer<typeof villageSchema>;

export const createVillageInputSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
});

export type CreateVillageInput = z.infer<typeof createVillageInputSchema>;

// Hamlet schemas
export const hamletSchema = z.object({
  id: z.number(),
  village_id: z.number(),
  name: z.string(),
  head_name: z.string(),
  sppt_target: z.number().int(),
  pbb_target: z.number(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export type Hamlet = z.infer<typeof hamletSchema>;

export const createHamletInputSchema = z.object({
  village_id: z.number(),
  name: z.string().min(1),
  head_name: z.string().min(1),
  sppt_target: z.number().int().nonnegative(),
  pbb_target: z.number().positive(),
});

export type CreateHamletInput = z.infer<typeof createHamletInputSchema>;

export const updateHamletInputSchema = z.object({
  id: z.number(),
  village_id: z.number().optional(),
  name: z.string().min(1).optional(),
  head_name: z.string().min(1).optional(),
  sppt_target: z.number().int().nonnegative().optional(),
  pbb_target: z.number().positive().optional(),
});

export type UpdateHamletInput = z.infer<typeof updateHamletInputSchema>;

// PBB Payment schemas
export const pbbPaymentSchema = z.object({
  id: z.number(),
  payment_date: z.coerce.date(),
  village_id: z.number(),
  hamlet_id: z.number(),
  payment_amount: z.number(),
  sppt_paid_count: z.number().int(),
  payment_type: paymentTypeSchema,
  notes: z.string().nullable(),
  created_by: z.number(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export type PbbPayment = z.infer<typeof pbbPaymentSchema>;

export const createPbbPaymentInputSchema = z.object({
  payment_date: z.coerce.date(),
  village_id: z.number(),
  hamlet_id: z.number(),
  payment_amount: z.number().positive(),
  sppt_paid_count: z.number().int().positive(),
  payment_type: paymentTypeSchema,
  notes: z.string().nullable().optional(),
  created_by: z.number(),
});

export type CreatePbbPaymentInput = z.infer<typeof createPbbPaymentInputSchema>;

export const updatePbbPaymentInputSchema = z.object({
  id: z.number(),
  payment_date: z.coerce.date().optional(),
  village_id: z.number().optional(),
  hamlet_id: z.number().optional(),
  payment_amount: z.number().positive().optional(),
  sppt_paid_count: z.number().int().positive().optional(),
  payment_type: paymentTypeSchema.optional(),
  notes: z.string().nullable().optional(),
});

export type UpdatePbbPaymentInput = z.infer<typeof updatePbbPaymentInputSchema>;

// Filter schemas for queries
export const hamletFilterSchema = z.object({
  village_id: z.number().optional(),
});

export type HamletFilter = z.infer<typeof hamletFilterSchema>;

export const pbbPaymentFilterSchema = z.object({
  village_id: z.number().optional(),
  hamlet_id: z.number().optional(),
  start_date: z.coerce.date().optional(),
  end_date: z.coerce.date().optional(),
  payment_type: paymentTypeSchema.optional(),
});

export type PbbPaymentFilter = z.infer<typeof pbbPaymentFilterSchema>;

// Dashboard data schemas
export const villageDashboardDataSchema = z.object({
  village_id: z.number(),
  village_name: z.string(),
  total_sppt_target: z.number().int(),
  total_pbb_target: z.number(),
  total_sppt_paid: z.number().int(),
  total_pbb_paid: z.number(),
  achievement_percentage: z.number(),
});

export type VillageDashboardData = z.infer<typeof villageDashboardDataSchema>;

export const hamletDashboardDataSchema = z.object({
  hamlet_id: z.number(),
  hamlet_name: z.string(),
  village_name: z.string(),
  sppt_target: z.number().int(),
  pbb_target: z.number(),
  sppt_paid: z.number().int(),
  pbb_paid: z.number(),
  achievement_percentage: z.number(),
});

export type HamletDashboardData = z.infer<typeof hamletDashboardDataSchema>;

// Report schemas
export const pbbReportItemSchema = z.object({
  payment_date: z.coerce.date(),
  village_name: z.string(),
  hamlet_name: z.string(),
  payment_amount: z.number(),
  sppt_paid_count: z.number().int(),
  payment_type: paymentTypeSchema,
  achievement_percentage: z.number(),
});

export type PbbReportItem = z.infer<typeof pbbReportItemSchema>;

// Login schema
export const loginInputSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export type LoginInput = z.infer<typeof loginInputSchema>;

export const loginResponseSchema = z.object({
  user: userSchema,
  token: z.string().optional(), // If implementing JWT
});

export type LoginResponse = z.infer<typeof loginResponseSchema>;
