
import { db } from '../db';
import { usersTable, villagesTable } from '../db/schema';
import { type User } from '../schema';
import { eq } from 'drizzle-orm';

export const getUsers = async (): Promise<User[]> => {
  try {
    // Join users with villages to get complete user information
    const results = await db.select()
      .from(usersTable)
      .leftJoin(villagesTable, eq(usersTable.village_id, villagesTable.id))
      .execute();

    // Map results to User schema format
    return results.map(result => ({
      id: result.users.id,
      username: result.users.username,
      password_hash: result.users.password_hash,
      full_name: result.users.full_name,
      role: result.users.role,
      village_id: result.users.village_id,
      is_active: result.users.is_active,
      created_at: result.users.created_at,
      updated_at: result.users.updated_at,
    }));
  } catch (error) {
    console.error('Failed to fetch users:', error);
    throw error;
  }
};
