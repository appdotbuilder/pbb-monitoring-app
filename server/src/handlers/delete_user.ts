
import { db } from '../db';
import { usersTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const deleteUserInputSchema = z.object({
    id: z.number(),
});

type DeleteUserInput = z.infer<typeof deleteUserInputSchema>;

export async function deleteUser(input: DeleteUserInput): Promise<{ success: boolean }> {
    try {
        // Check if user exists first
        const existingUser = await db.select()
            .from(usersTable)
            .where(eq(usersTable.id, input.id))
            .execute();

        if (existingUser.length === 0) {
            throw new Error(`User with id ${input.id} not found`);
        }

        // Soft delete by setting is_active to false
        await db.update(usersTable)
            .set({ 
                is_active: false,
                updated_at: new Date()
            })
            .where(eq(usersTable.id, input.id))
            .execute();

        return { success: true };
    } catch (error) {
        console.error('User deletion failed:', error);
        throw error;
    }
}
