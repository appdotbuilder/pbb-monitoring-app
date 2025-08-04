
import { db } from '../db';
import { hamletsTable, villagesTable } from '../db/schema';
import { type Hamlet, type HamletFilter } from '../schema';
import { eq } from 'drizzle-orm';

export async function getHamlets(filter?: HamletFilter): Promise<Hamlet[]> {
  try {
    // Build base query with village join to ensure hamlet belongs to existing village
    const baseQuery = db.select({
      id: hamletsTable.id,
      village_id: hamletsTable.village_id,
      name: hamletsTable.name,
      head_name: hamletsTable.head_name,
      sppt_target: hamletsTable.sppt_target,
      pbb_target: hamletsTable.pbb_target,
      created_at: hamletsTable.created_at,
      updated_at: hamletsTable.updated_at,
    })
    .from(hamletsTable)
    .innerJoin(villagesTable, eq(hamletsTable.village_id, villagesTable.id));

    // Apply village filter conditionally
    const query = filter?.village_id 
      ? baseQuery.where(eq(hamletsTable.village_id, filter.village_id))
      : baseQuery;

    const results = await query.execute();

    // Convert numeric fields and return proper Hamlet objects
    return results.map(hamlet => ({
      ...hamlet,
      pbb_target: parseFloat(hamlet.pbb_target), // Convert numeric to number
    }));
  } catch (error) {
    console.error('Failed to fetch hamlets:', error);
    throw error;
  }
}
