
import { db } from '../db';
import { hamletsTable, pbbPaymentsTable, villagesTable } from '../db/schema';
import { type HamletDashboardData, type HamletFilter } from '../schema';
import { eq, sum, and } from 'drizzle-orm';
import { type SQL } from 'drizzle-orm';

export async function getHamletDashboard(filter?: HamletFilter): Promise<HamletDashboardData[]> {
  try {
    // Build base query with all joins and groupBy first
    let baseQuery = db.select({
      hamlet_id: hamletsTable.id,
      hamlet_name: hamletsTable.name,
      village_name: villagesTable.name,
      sppt_target: hamletsTable.sppt_target,
      pbb_target: hamletsTable.pbb_target,
      sppt_paid: sum(pbbPaymentsTable.sppt_paid_count),
      pbb_paid: sum(pbbPaymentsTable.payment_amount),
    })
    .from(hamletsTable)
    .innerJoin(villagesTable, eq(hamletsTable.village_id, villagesTable.id))
    .leftJoin(pbbPaymentsTable, eq(hamletsTable.id, pbbPaymentsTable.hamlet_id))
    .groupBy(
      hamletsTable.id,
      hamletsTable.name,
      villagesTable.name,
      hamletsTable.sppt_target,
      hamletsTable.pbb_target
    );

    // Apply filters conditionally
    const conditions: SQL<unknown>[] = [];
    
    if (filter?.village_id) {
      conditions.push(eq(hamletsTable.village_id, filter.village_id));
    }

    // Apply where clause if we have conditions
    const finalQuery = conditions.length > 0 
      ? baseQuery.where(and(...conditions))
      : baseQuery;

    const results = await finalQuery.execute();

    // Process results and calculate achievement percentages
    return results.map(result => {
      const spptPaid = result.sppt_paid ? parseInt(result.sppt_paid.toString()) : 0;
      const pbbPaid = result.pbb_paid ? parseFloat(result.pbb_paid.toString()) : 0;
      const pbbTarget = parseFloat(result.pbb_target);
      
      // Calculate achievement percentage based on PBB amount
      const achievementPercentage = pbbTarget > 0 ? (pbbPaid / pbbTarget) * 100 : 0;

      return {
        hamlet_id: result.hamlet_id,
        hamlet_name: result.hamlet_name,
        village_name: result.village_name,
        sppt_target: result.sppt_target,
        pbb_target: pbbTarget,
        sppt_paid: spptPaid,
        pbb_paid: pbbPaid,
        achievement_percentage: Math.round(achievementPercentage * 100) / 100, // Round to 2 decimal places
      };
    });
  } catch (error) {
    console.error('Hamlet dashboard data retrieval failed:', error);
    throw error;
  }
}
