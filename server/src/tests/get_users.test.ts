
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, villagesTable } from '../db/schema';
import { type CreateUserInput, type CreateVillageInput } from '../schema';
import { getUsers } from '../handlers/get_users';

// Test data
const testVillage: CreateVillageInput = {
  name: 'Test Village',
  code: 'TV001'
};

const testUserSuperAdmin: CreateUserInput = {
  username: 'superadmin',
  password: 'password123',
  full_name: 'Super Administrator',
  role: 'super_admin'
};

const testUserVillageUser: CreateUserInput = {
  username: 'villageuser',
  password: 'password123',
  full_name: 'Village User',
  role: 'village_user',
  village_id: 1 // Will be set after creating village
};

describe('getUsers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no users exist', async () => {
    const result = await getUsers();
    expect(result).toEqual([]);
  });

  it('should return all users', async () => {
    // Create village first
    const village = await db.insert(villagesTable)
      .values({
        name: testVillage.name,
        code: testVillage.code
      })
      .returning()
      .execute();

    // Create users with simple password hash for testing
    const hashedPassword = 'hashed_password_123';
    
    await db.insert(usersTable).values([
      {
        username: testUserSuperAdmin.username,
        password_hash: hashedPassword,
        full_name: testUserSuperAdmin.full_name,
        role: testUserSuperAdmin.role,
        village_id: null,
        is_active: true
      },
      {
        username: testUserVillageUser.username,
        password_hash: hashedPassword,
        full_name: testUserVillageUser.full_name,
        role: testUserVillageUser.role,
        village_id: village[0].id,
        is_active: true
      }
    ]).execute();

    const result = await getUsers();

    expect(result).toHaveLength(2);
    
    // Check super admin user
    const superAdmin = result.find(u => u.username === 'superadmin');
    expect(superAdmin).toBeDefined();
    expect(superAdmin?.full_name).toEqual('Super Administrator');
    expect(superAdmin?.role).toEqual('super_admin');
    expect(superAdmin?.village_id).toBeNull();
    expect(superAdmin?.is_active).toBe(true);
    expect(superAdmin?.id).toBeDefined();
    expect(superAdmin?.created_at).toBeInstanceOf(Date);
    expect(superAdmin?.updated_at).toBeInstanceOf(Date);

    // Check village user
    const villageUser = result.find(u => u.username === 'villageuser');
    expect(villageUser).toBeDefined();
    expect(villageUser?.full_name).toEqual('Village User');
    expect(villageUser?.role).toEqual('village_user');
    expect(villageUser?.village_id).toEqual(village[0].id);
    expect(villageUser?.is_active).toBe(true);
    expect(villageUser?.id).toBeDefined();
    expect(villageUser?.created_at).toBeInstanceOf(Date);
    expect(villageUser?.updated_at).toBeInstanceOf(Date);
  });

  it('should return users with inactive status', async () => {
    // Create inactive user
    const hashedPassword = 'hashed_password_123';
    
    await db.insert(usersTable).values({
      username: 'inactiveuser',
      password_hash: hashedPassword,
      full_name: 'Inactive User',
      role: 'super_admin',
      village_id: null,
      is_active: false
    }).execute();

    const result = await getUsers();

    expect(result).toHaveLength(1);
    expect(result[0].username).toEqual('inactiveuser');
    expect(result[0].is_active).toBe(false);
  });

  it('should handle users with null village_id correctly', async () => {
    // Create user without village
    const hashedPassword = 'hashed_password_123';
    
    await db.insert(usersTable).values({
      username: 'novillage',
      password_hash: hashedPassword,
      full_name: 'No Village User',
      role: 'super_admin',
      village_id: null,
      is_active: true
    }).execute();

    const result = await getUsers();

    expect(result).toHaveLength(1);
    expect(result[0].username).toEqual('novillage');
    expect(result[0].village_id).toBeNull();
  });
});
