
import { db } from '../db';
import { usersTable, villagesTable } from '../db/schema';
import { type LoginInput, type LoginResponse } from '../schema';
import { eq } from 'drizzle-orm';

export async function login(input: LoginInput): Promise<LoginResponse> {
  try {
    // Find user by username with village data if applicable
    const results = await db.select({
      user: usersTable,
      village: villagesTable,
    })
    .from(usersTable)
    .leftJoin(villagesTable, eq(usersTable.village_id, villagesTable.id))
    .where(eq(usersTable.username, input.username))
    .execute();

    if (results.length === 0) {
      throw new Error('Invalid username or password');
    }

    const result = results[0];
    const user = result.user;

    // Check if user is active
    if (!user.is_active) {
      throw new Error('User account is not active');
    }

    // In a real implementation, you would verify the password hash here
    // For now, we'll do a simple comparison (this should use bcrypt in production)
    if (user.password_hash !== input.password) {
      throw new Error('Invalid username or password');
    }

    // Return user data (password_hash is included in the schema but should be handled securely)
    return {
      user: {
        id: user.id,
        username: user.username,
        password_hash: user.password_hash,
        full_name: user.full_name,
        role: user.role,
        village_id: user.village_id,
        is_active: user.is_active,
        created_at: user.created_at,
        updated_at: user.updated_at,
      }
    };
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
}
