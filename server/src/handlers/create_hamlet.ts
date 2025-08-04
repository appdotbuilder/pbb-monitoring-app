
import { db } from '../db';
import { hamletsTable, villagesTable } from '../db/schema';
import { type CreateHamletInput, type Hamlet } from '../schema';
import { eq, count } from 'drizzle-orm';

export const createHamlet = async (input: CreateHamletInput): Promise<Hamlet> => {
  try {
    // Validate that village exists
    const village = await db.select()
      .from(villagesTable)
      .where(eq(villagesTable.id, input.village_id))
      .execute();

    if (village.length === 0) {
      throw new Error(`Village with id ${input.village_id} not found`);
    }

    // Check hamlet count limit (max 5 per village)
    const hamletCount = await db.select({ count: count() })
      .from(hamletsTable)
      .where(eq(hamletsTable.village_id, input.village_id))
      .execute();

    if (hamletCount[0].count >= 5) {
      throw new Error(`Village can have maximum 5 hamlets`);
    }

    // Insert hamlet record
    const result = await db.insert(hamletsTable)
      .values({
        village_id: input.village_id,
        name: input.name,
        head_name: input.head_name,
        sppt_target: input.sppt_target,
        pbb_target: input.pbb_target.toString(), // Convert number to string for numeric column
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const hamlet = result[0];
    return {
      ...hamlet,
      pbb_target: parseFloat(hamlet.pbb_target) // Convert string back to number
    };
  } catch (error) {
    console.error('Hamlet creation failed:', error);
    throw error;
  }
};
