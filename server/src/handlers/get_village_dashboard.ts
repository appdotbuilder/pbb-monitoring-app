
import { db } from '../db';
import { villagesTable, hamletsTable, pbbPaymentsTable } from '../db/schema';
import { type VillageDashboardData } from '../schema';
import { sql } from 'drizzle-orm';

export async function getVillageDashboard(): Promise<VillageDashboardData[]> {
  try {
    // Use subqueries to avoid double-counting when joining payments
    const results = await db.execute(sql`
      SELECT 
        v.id as village_id,
        v.name as village_name,
        COALESCE(hamlet_totals.total_sppt_target, 0) as total_sppt_target,
        COALESCE(hamlet_totals.total_pbb_target, 0) as total_pbb_target,
        COALESCE(payment_totals.total_sppt_paid, 0) as total_sppt_paid,
        COALESCE(payment_totals.total_pbb_paid, 0) as total_pbb_paid,
        CASE 
          WHEN COALESCE(hamlet_totals.total_pbb_target, 0) > 0 
          THEN (COALESCE(payment_totals.total_pbb_paid, 0) / COALESCE(hamlet_totals.total_pbb_target, 0) * 100)
          ELSE 0 
        END as achievement_percentage
      FROM ${villagesTable} v
      LEFT JOIN (
        SELECT 
          village_id,
          SUM(sppt_target)::int as total_sppt_target,
          SUM(pbb_target) as total_pbb_target
        FROM ${hamletsTable}
        GROUP BY village_id
      ) hamlet_totals ON v.id = hamlet_totals.village_id
      LEFT JOIN (
        SELECT 
          village_id,
          SUM(sppt_paid_count)::int as total_sppt_paid,
          SUM(payment_amount) as total_pbb_paid
        FROM ${pbbPaymentsTable}
        GROUP BY village_id
      ) payment_totals ON v.id = payment_totals.village_id
      ORDER BY v.name
    `);

    return results.rows.map((row: any) => ({
      village_id: row.village_id as number,
      village_name: row.village_name as string,
      total_sppt_target: row.total_sppt_target as number,
      total_pbb_target: parseFloat(row.total_pbb_target as string),
      total_sppt_paid: row.total_sppt_paid as number,
      total_pbb_paid: parseFloat(row.total_pbb_paid as string),
      achievement_percentage: parseFloat(row.achievement_percentage as string),
    }));
  } catch (error) {
    console.error('Village dashboard calculation failed:', error);
    throw error;
  }
}
