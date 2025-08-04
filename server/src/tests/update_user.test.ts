
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, villagesTable } from '../db/schema';
import { type UpdateUserInput, type CreateUserInput, type CreateVillageInput } from '../schema';
import { updateUser } from '../handlers/update_user';
import { eq } from 'drizzle-orm';

// Helper function to create user directly
const createTestUser = async (input: CreateUserInput) => {
  const result = await db.insert(usersTable)
    .values({
      username: input.username,
      password_hash: `hashed_${input.password}`,
      full_name: input.full_name,
      role: input.role,
      village_id: input.village_id || null,
    })
    .returning()
    .execute();
  
  return result[0];
};

// Helper function to create village directly
const createTestVillage = async (input: CreateVillageInput) => {
  const result = await db.insert(villagesTable)
    .values({
      name: input.name,
      code: input.code,
    })
    .returning()
    .execute();
  
  return result[0];
};

describe('updateUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update basic user information', async () => {
    // Create a test user first
    const createInput: CreateUserInput = {
      username: 'testuser',
      password: 'password123',
      full_name: 'Test User',
      role: 'village_user',
    };
    const createdUser = await createTestUser(createInput);

    // Update the user
    const updateInput: UpdateUserInput = {
      id: createdUser.id,
      username: 'updateduser',
      full_name: 'Updated Test User',
    };

    const result = await updateUser(updateInput);

    expect(result.id).toEqual(createdUser.id);
    expect(result.username).toEqual('updateduser');
    expect(result.full_name).toEqual('Updated Test User');
    expect(result.role).toEqual('village_user'); // Unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > createdUser.updated_at).toBe(true);
  });

  it('should update password with proper hashing', async () => {
    // Create a test user first
    const createInput: CreateUserInput = {
      username: 'testuser',
      password: 'password123',
      full_name: 'Test User',
      role: 'village_user',
    };
    const createdUser = await createTestUser(createInput);

    // Update the password
    const updateInput: UpdateUserInput = {
      id: createdUser.id,
      password: 'newpassword456',
    };

    const result = await updateUser(updateInput);

    // Verify password was hashed and changed
    expect(result.password_hash).not.toEqual(createdUser.password_hash);
    expect(result.password_hash).not.toEqual('newpassword456'); // Should be hashed
    expect(result.password_hash).toContain('hashed_'); // Our simple hash format
    expect(result.password_hash).toContain('newpassword456'); // Contains original password
  });

  it('should update role and village assignment', async () => {
    // Create a village first
    const village = await createTestVillage({
      name: 'Test Village',
      code: 'TV001',
    });

    // Create a test user
    const createInput: CreateUserInput = {
      username: 'testuser',
      password: 'password123',
      full_name: 'Test User',
      role: 'super_admin',
    };
    const createdUser = await createTestUser(createInput);

    // Update role and village
    const updateInput: UpdateUserInput = {
      id: createdUser.id,
      role: 'village_user',
      village_id: village.id,
    };

    const result = await updateUser(updateInput);

    expect(result.role).toEqual('village_user');
    expect(result.village_id).toEqual(village.id);
  });

  it('should update is_active status', async () => {
    // Create a test user first
    const createInput: CreateUserInput = {
      username: 'testuser',
      password: 'password123',
      full_name: 'Test User',
      role: 'village_user',
    };
    const createdUser = await createTestUser(createInput);

    // Deactivate the user
    const updateInput: UpdateUserInput = {
      id: createdUser.id,
      is_active: false,
    };

    const result = await updateUser(updateInput);

    expect(result.is_active).toBe(false);
    expect(result.username).toEqual('testuser'); // Other fields unchanged
  });

  it('should save changes to database', async () => {
    // Create a test user first
    const createInput: CreateUserInput = {
      username: 'testuser',
      password: 'password123',
      full_name: 'Test User',
      role: 'village_user',
    };
    const createdUser = await createTestUser(createInput);

    // Update the user
    const updateInput: UpdateUserInput = {
      id: createdUser.id,
      username: 'updateduser',
      full_name: 'Updated Test User',
    };

    await updateUser(updateInput);

    // Verify changes were saved to database
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, createdUser.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].username).toEqual('updateduser');
    expect(users[0].full_name).toEqual('Updated Test User');
    expect(users[0].updated_at).toBeInstanceOf(Date);
  });

  it('should set village_id to null when explicitly provided', async () => {
    // Create a village first
    const village = await createTestVillage({
      name: 'Test Village',
      code: 'TV001',
    });

    // Create a test user with village assignment
    const createInput: CreateUserInput = {
      username: 'testuser',
      password: 'password123',
      full_name: 'Test User',
      role: 'village_user',
      village_id: village.id,
    };
    const createdUser = await createTestUser(createInput);

    // Remove village assignment
    const updateInput: UpdateUserInput = {
      id: createdUser.id,
      village_id: null,
    };

    const result = await updateUser(updateInput);

    expect(result.village_id).toBeNull();
  });

  it('should throw error for non-existent user', async () => {
    const updateInput: UpdateUserInput = {
      id: 99999,
      username: 'nonexistent',
    };

    expect(updateUser(updateInput)).rejects.toThrow(/user not found/i);
  });

  it('should update only provided fields', async () => {
    // Create a test user first
    const createInput: CreateUserInput = {
      username: 'testuser',
      password: 'password123',
      full_name: 'Test User',
      role: 'village_user',
    };
    const createdUser = await createTestUser(createInput);

    // Update only username
    const updateInput: UpdateUserInput = {
      id: createdUser.id,
      username: 'newusername',
    };

    const result = await updateUser(updateInput);

    // Verify only username changed
    expect(result.username).toEqual('newusername');
    expect(result.full_name).toEqual('Test User'); // Unchanged
    expect(result.role).toEqual('village_user'); // Unchanged
    expect(result.password_hash).toEqual(createdUser.password_hash); // Unchanged
  });

  it('should handle partial updates correctly', async () => {
    // Create a test user first
    const createInput: CreateUserInput = {
      username: 'testuser',
      password: 'password123',
      full_name: 'Test User',
      role: 'super_admin',
    };
    const createdUser = await createTestUser(createInput);

    // Update multiple fields but not all
    const updateInput: UpdateUserInput = {
      id: createdUser.id,
      full_name: 'Partially Updated User',
      is_active: false,
    };

    const result = await updateUser(updateInput);

    // Verify specified fields changed
    expect(result.full_name).toEqual('Partially Updated User');
    expect(result.is_active).toBe(false);
    
    // Verify other fields unchanged
    expect(result.username).toEqual('testuser');
    expect(result.role).toEqual('super_admin');
    expect(result.password_hash).toEqual(createdUser.password_hash);
  });
});
