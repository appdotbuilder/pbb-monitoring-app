
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, villagesTable } from '../db/schema';
import { type LoginInput } from '../schema';
import { login } from '../handlers/login';

describe('login', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should authenticate user with valid credentials', async () => {
    // Create a test village first
    const villageResult = await db.insert(villagesTable)
      .values({
        name: 'Test Village',
        code: 'TV001',
      })
      .returning()
      .execute();

    const village = villageResult[0];

    // Create a test user
    await db.insert(usersTable)
      .values({
        username: 'testuser',
        password_hash: 'testpassword',
        full_name: 'Test User',
        role: 'village_user',
        village_id: village.id,
        is_active: true,
      })
      .execute();

    const loginInput: LoginInput = {
      username: 'testuser',
      password: 'testpassword',
    };

    const result = await login(loginInput);

    expect(result.user.username).toEqual('testuser');
    expect(result.user.full_name).toEqual('Test User');
    expect(result.user.role).toEqual('village_user');
    expect(result.user.village_id).toEqual(village.id);
    expect(result.user.is_active).toBe(true);
    expect(result.user.id).toBeDefined();
    expect(result.user.created_at).toBeInstanceOf(Date);
    expect(result.user.updated_at).toBeInstanceOf(Date);
  });

  it('should authenticate super admin without village', async () => {
    // Create a super admin user
    await db.insert(usersTable)
      .values({
        username: 'admin',
        password_hash: 'adminpass',
        full_name: 'Super Admin',
        role: 'super_admin',
        village_id: null,
        is_active: true,
      })
      .execute();

    const loginInput: LoginInput = {
      username: 'admin',
      password: 'adminpass',
    };

    const result = await login(loginInput);

    expect(result.user.username).toEqual('admin');
    expect(result.user.full_name).toEqual('Super Admin');
    expect(result.user.role).toEqual('super_admin');
    expect(result.user.village_id).toBeNull();
    expect(result.user.is_active).toBe(true);
  });

  it('should reject invalid username', async () => {
    const loginInput: LoginInput = {
      username: 'nonexistent',
      password: 'anypassword',
    };

    expect(login(loginInput)).rejects.toThrow(/invalid username or password/i);
  });

  it('should reject invalid password', async () => {
    // Create a test user
    await db.insert(usersTable)
      .values({
        username: 'testuser',
        password_hash: 'correctpassword',
        full_name: 'Test User',
        role: 'village_user',
        village_id: null,
        is_active: true,
      })
      .execute();

    const loginInput: LoginInput = {
      username: 'testuser',
      password: 'wrongpassword',
    };

    expect(login(loginInput)).rejects.toThrow(/invalid username or password/i);
  });

  it('should reject inactive user', async () => {
    // Create an inactive user
    await db.insert(usersTable)
      .values({
        username: 'inactiveuser',
        password_hash: 'testpassword',
        full_name: 'Inactive User',
        role: 'village_user',
        village_id: null,
        is_active: false,
      })
      .execute();

    const loginInput: LoginInput = {
      username: 'inactiveuser',
      password: 'testpassword',
    };

    expect(login(loginInput)).rejects.toThrow(/user account is not active/i);
  });

  it('should handle user with village data correctly', async () => {
    // Create village and user
    const villageResult = await db.insert(villagesTable)
      .values({
        name: 'Village with User',
        code: 'VWU001',
      })
      .returning()
      .execute();

    const village = villageResult[0];

    await db.insert(usersTable)
      .values({
        username: 'villageuser',
        password_hash: 'password123',
        full_name: 'Village User',
        role: 'village_user',
        village_id: village.id,
        is_active: true,
      })
      .execute();

    const loginInput: LoginInput = {
      username: 'villageuser',
      password: 'password123',
    };

    const result = await login(loginInput);

    expect(result.user.village_id).toEqual(village.id);
    expect(typeof result.user.village_id).toBe('number');
  });
});
