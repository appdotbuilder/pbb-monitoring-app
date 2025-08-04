
import { db } from '../db';
import { hamletsTable } from '../db/schema';
import { type UpdateHamletInput, type Hamlet } from '../schema';
import { eq } from 'drizzle-orm';

export const updateHamlet = async (input: UpdateHamletInput): Promise<Hamlet> => {
  try {
    // Build update object with only provided fields
    const updateData: Record<string, any> = {};
    
    if (input.village_id !== undefined) updateData['village_id'] = input.village_id;
    if (input.name !== undefined) updateData['name'] = input.name;
    if (input.head_name !== undefined) updateData['head_name'] = input.head_name;
    if (input.sppt_target !== undefined) updateData['sppt_target'] = input.sppt_target;
    if (input.pbb_target !== undefined) updateData['pbb_target'] = input.pbb_target.toString();
    
    // Always update the updated_at timestamp
    updateData['updated_at'] = new Date();

    // Update hamlet record
    const result = await db.update(hamletsTable)
      .set(updateData)
      .where(eq(hamletsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Hamlet with id ${input.id} not found`);
    }

    // Convert numeric fields back to numbers before returning
    const hamlet = result[0];
    return {
      ...hamlet,
      pbb_target: parseFloat(hamlet.pbb_target)
    };
  } catch (error) {
    console.error('Hamlet update failed:', error);
    throw error;
  }
};
