
import { db } from '../db';
import { pbbPaymentsTable, villagesTable, hamletsTable } from '../db/schema';
import { type PbbPayment, type PbbPaymentFilter } from '../schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

export async function getPbbPayments(filter?: PbbPaymentFilter): Promise<PbbPayment[]> {
  try {
    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];

    if (filter?.village_id !== undefined) {
      conditions.push(eq(pbbPaymentsTable.village_id, filter.village_id));
    }

    if (filter?.hamlet_id !== undefined) {
      conditions.push(eq(pbbPaymentsTable.hamlet_id, filter.hamlet_id));
    }

    if (filter?.start_date !== undefined) {
      conditions.push(gte(pbbPaymentsTable.payment_date, filter.start_date));
    }

    if (filter?.end_date !== undefined) {
      conditions.push(lte(pbbPaymentsTable.payment_date, filter.end_date));
    }

    if (filter?.payment_type !== undefined) {
      conditions.push(eq(pbbPaymentsTable.payment_type, filter.payment_type));
    }

    // Build query with all parts at once to avoid type issues
    const baseQuery = db.select({
      id: pbbPaymentsTable.id,
      payment_date: pbbPaymentsTable.payment_date,
      village_id: pbbPaymentsTable.village_id,
      hamlet_id: pbbPaymentsTable.hamlet_id,
      payment_amount: pbbPaymentsTable.payment_amount,
      sppt_paid_count: pbbPaymentsTable.sppt_paid_count,
      payment_type: pbbPaymentsTable.payment_type,
      notes: pbbPaymentsTable.notes,
      created_by: pbbPaymentsTable.created_by,
      created_at: pbbPaymentsTable.created_at,
      updated_at: pbbPaymentsTable.updated_at,
    })
    .from(pbbPaymentsTable)
    .innerJoin(villagesTable, eq(pbbPaymentsTable.village_id, villagesTable.id))
    .innerJoin(hamletsTable, eq(pbbPaymentsTable.hamlet_id, hamletsTable.id));

    // Execute query with or without conditions
    const results = conditions.length > 0
      ? await baseQuery
          .where(conditions.length === 1 ? conditions[0] : and(...conditions))
          .orderBy(desc(pbbPaymentsTable.payment_date))
          .execute()
      : await baseQuery
          .orderBy(desc(pbbPaymentsTable.payment_date))
          .execute();

    // Convert numeric fields back to numbers
    return results.map(payment => ({
      ...payment,
      payment_amount: parseFloat(payment.payment_amount)
    }));
  } catch (error) {
    console.error('Get PBB payments failed:', error);
    throw error;
  }
}
