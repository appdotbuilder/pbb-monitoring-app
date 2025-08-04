
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, villagesTable } from '../db/schema';
import { deleteUser } from '../handlers/delete_user';
import { eq } from 'drizzle-orm';

describe('deleteUser', () => {
    beforeEach(createDB);
    afterEach(resetDB);

    it('should soft delete a user by setting is_active to false', async () => {
        // Create a test village first (required for village_user role)
        const villageResult = await db.insert(villagesTable)
            .values({
                name: 'Test Village',
                code: 'TV001'
            })
            .returning()
            .execute();

        const village = villageResult[0];

        // Create a test user
        const userResult = await db.insert(usersTable)
            .values({
                username: 'testuser',
                password_hash: 'hashedpassword',
                full_name: 'Test User',
                role: 'village_user',
                village_id: village.id,
                is_active: true
            })
            .returning()
            .execute();

        const user = userResult[0];

        // Delete the user
        const result = await deleteUser({ id: user.id });

        expect(result.success).toBe(true);

        // Verify user is soft deleted (is_active = false)
        const deletedUser = await db.select()
            .from(usersTable)
            .where(eq(usersTable.id, user.id))
            .execute();

        expect(deletedUser).toHaveLength(1);
        expect(deletedUser[0].is_active).toBe(false);
        expect(deletedUser[0].username).toEqual('testuser');
        expect(deletedUser[0].updated_at).toBeInstanceOf(Date);
    });

    it('should throw error when user does not exist', async () => {
        const nonExistentId = 999;

        await expect(deleteUser({ id: nonExistentId }))
            .rejects.toThrow(/User with id 999 not found/i);
    });

    it('should handle super_admin user deletion', async () => {
        // Create a super admin user (no village_id required)
        const userResult = await db.insert(usersTable)
            .values({
                username: 'superadmin',
                password_hash: 'hashedpassword',
                full_name: 'Super Admin',
                role: 'super_admin',
                village_id: null,
                is_active: true
            })
            .returning()
            .execute();

        const user = userResult[0];

        // Delete the user
        const result = await deleteUser({ id: user.id });

        expect(result.success).toBe(true);

        // Verify user is soft deleted
        const deletedUser = await db.select()
            .from(usersTable)
            .where(eq(usersTable.id, user.id))
            .execute();

        expect(deletedUser).toHaveLength(1);
        expect(deletedUser[0].is_active).toBe(false);
        expect(deletedUser[0].role).toEqual('super_admin');
        expect(deletedUser[0].village_id).toBeNull();
    });

    it('should update the updated_at timestamp', async () => {
        // Create a test user
        const userResult = await db.insert(usersTable)
            .values({
                username: 'timestamptest',
                password_hash: 'hashedpassword',
                full_name: 'Timestamp Test',
                role: 'super_admin',
                village_id: null,
                is_active: true
            })
            .returning()
            .execute();

        const user = userResult[0];
        const originalUpdatedAt = user.updated_at;

        // Wait a bit to ensure timestamp difference
        await new Promise(resolve => setTimeout(resolve, 10));

        // Delete the user
        await deleteUser({ id: user.id });

        // Verify updated_at timestamp was changed
        const updatedUser = await db.select()
            .from(usersTable)
            .where(eq(usersTable.id, user.id))
            .execute();

        expect(updatedUser[0].updated_at).toBeInstanceOf(Date);
        expect(updatedUser[0].updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
});
