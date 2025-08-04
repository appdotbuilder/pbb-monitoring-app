
import { db } from '../db';
import { villagesTable } from '../db/schema';
import { type CreateVillageInput, type Village } from '../schema';
import { eq } from 'drizzle-orm';

export const createVillage = async (input: CreateVillageInput): Promise<Village> => {
  try {
    // Check if village code already exists
    const existingVillage = await db.select()
      .from(villagesTable)
      .where(eq(villagesTable.code, input.code))
      .execute();

    if (existingVillage.length > 0) {
      throw new Error(`Village with code '${input.code}' already exists`);
    }

    // Insert village record
    const result = await db.insert(villagesTable)
      .values({
        name: input.name,
        code: input.code
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Village creation failed:', error);
    throw error;
  }
};
