
import { db } from '../db';
import { usersTable, villagesTable } from '../db/schema';
import { type CreateUserInput, type User } from '../schema';
import { eq } from 'drizzle-orm';

export const createUser = async (input: CreateUserInput): Promise<User> => {
  try {
    // Validate village exists if village_id is provided
    if (input.village_id) {
      const village = await db.select()
        .from(villagesTable)
        .where(eq(villagesTable.id, input.village_id))
        .execute();
      
      if (village.length === 0) {
        throw new Error('Village not found');
      }
    }

    // Hash password (simple hash for demo - in production use bcrypt)
    const password_hash = await Bun.password.hash(input.password);

    // Insert user record
    const result = await db.insert(usersTable)
      .values({
        username: input.username,
        password_hash,
        full_name: input.full_name,
        role: input.role,
        village_id: input.village_id || null,
        is_active: true
      })
      .returning()
      .execute();

    const user = result[0];
    return user;
  } catch (error) {
    console.error('User creation failed:', error);
    throw error;
  }
};
