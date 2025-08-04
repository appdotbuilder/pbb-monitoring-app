
import { db } from '../db';
import { villagesTable } from '../db/schema';
import { type Village } from '../schema';
import { asc } from 'drizzle-orm';

export const getVillages = async (): Promise<Village[]> => {
  try {
    const results = await db.select()
      .from(villagesTable)
      .orderBy(asc(villagesTable.name))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch villages:', error);
    throw error;
  }
};
