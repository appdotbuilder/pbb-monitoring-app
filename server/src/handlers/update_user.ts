
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type UpdateUserInput, type User } from '../schema';
import { eq } from 'drizzle-orm';

export const updateUser = async (input: UpdateUserInput): Promise<User> => {
  try {
    // First, check if user exists
    const existingUsers = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.id))
      .execute();

    if (existingUsers.length === 0) {
      throw new Error('User not found');
    }

    // Build update object, only including provided fields
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.username !== undefined) {
      updateData.username = input.username;
    }

    if (input.password !== undefined) {
      // Simple hash for now - in real implementation would use proper bcrypt
      updateData.password_hash = `hashed_${input.password}_${Date.now()}`;
    }

    if (input.full_name !== undefined) {
      updateData.full_name = input.full_name;
    }

    if (input.role !== undefined) {
      updateData.role = input.role;
    }

    if (input.village_id !== undefined) {
      updateData.village_id = input.village_id;
    }

    if (input.is_active !== undefined) {
      updateData.is_active = input.is_active;
    }

    // Update user record
    const result = await db.update(usersTable)
      .set(updateData)
      .where(eq(usersTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('User update failed:', error);
    throw error;
  }
};
