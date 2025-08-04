
import { serial, text, pgTable, timestamp, numeric, integer, pgEnum, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enum for user roles
export const userRoleEnum = pgEnum('user_role', ['super_admin', 'village_user']);

// Enum for payment types
export const paymentTypeEnum = pgEnum('payment_type', ['tunai', 'transfer', 'setoran']);

// Users table for authentication and role management
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  full_name: text('full_name').notNull(),
  role: userRoleEnum('role').notNull(),
  village_id: integer('village_id'), // Only for village users, references villages table
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Villages table (12 villages)
export const villagesTable = pgTable('villages', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  code: text('code').notNull().unique(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Hamlets table (5 hamlets per village)
export const hamletsTable = pgTable('hamlets', {
  id: serial('id').primaryKey(),
  village_id: integer('village_id').notNull(),
  name: text('name').notNull(),
  head_name: text('head_name').notNull(), // Nama Kepala Dusun
  sppt_target: integer('sppt_target').notNull(), // Target SPPT
  pbb_target: numeric('pbb_target', { precision: 15, scale: 2 }).notNull(), // Target PBB amount
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// PBB payments table
export const pbbPaymentsTable = pgTable('pbb_payments', {
  id: serial('id').primaryKey(),
  payment_date: timestamp('payment_date').notNull(),
  village_id: integer('village_id').notNull(),
  hamlet_id: integer('hamlet_id').notNull(),
  payment_amount: numeric('payment_amount', { precision: 15, scale: 2 }).notNull(), // Jumlah Bayar
  sppt_paid_count: integer('sppt_paid_count').notNull(), // Jumlah SPPT Terbayar
  payment_type: paymentTypeEnum('payment_type').notNull(), // Jenis Bayar
  notes: text('notes'), // Optional notes
  created_by: integer('created_by').notNull(), // User who created the record
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(usersTable, ({ one }) => ({
  village: one(villagesTable, {
    fields: [usersTable.village_id],
    references: [villagesTable.id],
  }),
}));

export const villagesRelations = relations(villagesTable, ({ many }) => ({
  hamlets: many(hamletsTable),
  users: many(usersTable),
  pbbPayments: many(pbbPaymentsTable),
}));

export const hamletsRelations = relations(hamletsTable, ({ one, many }) => ({
  village: one(villagesTable, {
    fields: [hamletsTable.village_id],
    references: [villagesTable.id],
  }),
  pbbPayments: many(pbbPaymentsTable),
}));

export const pbbPaymentsRelations = relations(pbbPaymentsTable, ({ one }) => ({
  village: one(villagesTable, {
    fields: [pbbPaymentsTable.village_id],
    references: [villagesTable.id],
  }),
  hamlet: one(hamletsTable, {
    fields: [pbbPaymentsTable.hamlet_id],
    references: [hamletsTable.id],
  }),
  createdBy: one(usersTable, {
    fields: [pbbPaymentsTable.created_by],
    references: [usersTable.id],
  }),
}));

// Export all tables for relation queries
export const tables = {
  users: usersTable,
  villages: villagesTable,
  hamlets: hamletsTable,
  pbbPayments: pbbPaymentsTable,
};

// TypeScript types for table schemas
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;

export type Village = typeof villagesTable.$inferSelect;
export type NewVillage = typeof villagesTable.$inferInsert;

export type Hamlet = typeof hamletsTable.$inferSelect;
export type NewHamlet = typeof hamletsTable.$inferInsert;

export type PbbPayment = typeof pbbPaymentsTable.$inferSelect;
export type NewPbbPayment = typeof pbbPaymentsTable.$inferInsert;
