
import { db } from '../db';
import { pbbPaymentsTable, hamletsTable, villagesTable } from '../db/schema';
import { type PbbReportItem, type PbbPaymentFilter } from '../schema';
import { eq, and, gte, lte, SQL } from 'drizzle-orm';

export async function getPbbReport(filter?: PbbPaymentFilter): Promise<PbbReportItem[]> {
  try {
    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];

    if (filter?.village_id) {
      conditions.push(eq(pbbPaymentsTable.village_id, filter.village_id));
    }

    if (filter?.hamlet_id) {
      conditions.push(eq(pbbPaymentsTable.hamlet_id, filter.hamlet_id));
    }

    if (filter?.start_date) {
      conditions.push(gte(pbbPaymentsTable.payment_date, filter.start_date));
    }

    if (filter?.end_date) {
      conditions.push(lte(pbbPaymentsTable.payment_date, filter.end_date));
    }

    if (filter?.payment_type) {
      conditions.push(eq(pbbPaymentsTable.payment_type, filter.payment_type));
    }

    // Build base query with joins
    const baseQuery = db.select({
      payment_date: pbbPaymentsTable.payment_date,
      village_name: villagesTable.name,
      hamlet_name: hamletsTable.name,
      payment_amount: pbbPaymentsTable.payment_amount,
      sppt_paid_count: pbbPaymentsTable.sppt_paid_count,
      payment_type: pbbPaymentsTable.payment_type,
      pbb_target: hamletsTable.pbb_target,
    })
    .from(pbbPaymentsTable)
    .innerJoin(hamletsTable, eq(pbbPaymentsTable.hamlet_id, hamletsTable.id))
    .innerJoin(villagesTable, eq(pbbPaymentsTable.village_id, villagesTable.id));

    // Execute query with or without conditions
    const results = conditions.length > 0
      ? await baseQuery.where(conditions.length === 1 ? conditions[0] : and(...conditions)).execute()
      : await baseQuery.execute();

    // Transform results to include achievement percentage calculation
    return results.map(result => {
      const paymentAmount = parseFloat(result.payment_amount);
      const pbbTarget = parseFloat(result.pbb_target);
      const achievementPercentage = pbbTarget > 0 ? (paymentAmount / pbbTarget) * 100 : 0;

      return {
        payment_date: result.payment_date,
        village_name: result.village_name,
        hamlet_name: result.hamlet_name,
        payment_amount: paymentAmount,
        sppt_paid_count: result.sppt_paid_count,
        payment_type: result.payment_type,
        achievement_percentage: Math.round(achievementPercentage * 100) / 100, // Round to 2 decimal places
      };
    });
  } catch (error) {
    console.error('PBB report generation failed:', error);
    throw error;
  }
}
