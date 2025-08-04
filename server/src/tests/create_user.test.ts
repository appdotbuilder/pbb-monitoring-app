
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, villagesTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { createUser } from '../handlers/create_user';
import { eq } from 'drizzle-orm';

// Test inputs
const superAdminInput: CreateUserInput = {
  username: 'admin',
  password: 'password123',
  full_name: 'Super Administrator',
  role: 'super_admin'
};

const villageUserInput: CreateUserInput = {
  username: 'village_user',
  password: 'password123',
  full_name: 'Village User',
  role: 'village_user',
  village_id: 1
};

describe('createUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a super admin user', async () => {
    const result = await createUser(superAdminInput);

    // Basic field validation
    expect(result.username).toEqual('admin');
    expect(result.full_name).toEqual('Super Administrator');
    expect(result.role).toEqual('super_admin');
    expect(result.village_id).toBeNull();
    expect(result.is_active).toBe(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    
    // Password should be hashed
    expect(result.password_hash).not.toEqual('password123');
    expect(result.password_hash.length).toBeGreaterThan(10);
  });

  it('should create a village user with village assignment', async () => {
    // First create a village
    const village = await db.insert(villagesTable)
      .values({
        name: 'Test Village',
        code: 'TV001'
      })
      .returning()
      .execute();

    const villageUserWithValidId = {
      ...villageUserInput,
      village_id: village[0].id
    };

    const result = await createUser(villageUserWithValidId);

    // Basic field validation
    expect(result.username).toEqual('village_user');
    expect(result.full_name).toEqual('Village User');
    expect(result.role).toEqual('village_user');
    expect(result.village_id).toEqual(village[0].id);
    expect(result.is_active).toBe(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save user to database', async () => {
    const result = await createUser(superAdminInput);

    // Query using proper drizzle syntax
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].username).toEqual('admin');
    expect(users[0].full_name).toEqual('Super Administrator');
    expect(users[0].role).toEqual('super_admin');
    expect(users[0].is_active).toBe(true);
    expect(users[0].created_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent village', async () => {
    const invalidVillageInput = {
      ...villageUserInput,
      village_id: 999
    };

    await expect(createUser(invalidVillageInput)).rejects.toThrow(/village not found/i);
  });

  it('should throw error for duplicate username', async () => {
    // Create first user
    await createUser(superAdminInput);

    // Try to create another user with same username
    await expect(createUser(superAdminInput)).rejects.toThrow();
  });

  it('should verify password is properly hashed', async () => {
    const result = await createUser(superAdminInput);

    // Verify password can be verified with Bun's password utility
    const isValid = await Bun.password.verify('password123', result.password_hash);
    expect(isValid).toBe(true);

    // Verify wrong password fails
    const isInvalid = await Bun.password.verify('wrongpassword', result.password_hash);
    expect(isInvalid).toBe(false);
  });
});
