
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { pbbPaymentsTable, villagesTable, hamletsTable, usersTable } from '../db/schema';
import { type CreatePbbPaymentInput } from '../schema';
import { createPbbPayment } from '../handlers/create_pbb_payment';
import { eq } from 'drizzle-orm';

// Test data
const testVillage = {
  name: 'Test Village',
  code: 'TV001'
};

const testUser = {
  username: 'testuser',
  password_hash: 'hashed_password',
  full_name: 'Test User',
  role: 'super_admin' as const,
  village_id: null
};

const testHamlet = {
  name: 'Test Hamlet',
  head_name: 'Hamlet Head',
  sppt_target: 100,
  pbb_target: '50000.00'
};

describe('createPbbPayment', () => {
  let villageId: number;
  let hamletId: number;
  let userId: number;

  beforeEach(async () => {
    await createDB();

    // Create test village
    const villageResult = await db.insert(villagesTable)
      .values(testVillage)
      .returning()
      .execute();
    villageId = villageResult[0].id;

    // Create test hamlet
    const hamletResult = await db.insert(hamletsTable)
      .values({
        ...testHamlet,
        village_id: villageId
      })
      .returning()
      .execute();
    hamletId = hamletResult[0].id;

    // Create test user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    userId = userResult[0].id;
  });

  afterEach(resetDB);

  const testInput: CreatePbbPaymentInput = {
    payment_date: new Date('2024-01-15'),
    village_id: 0, // Will be set in tests
    hamlet_id: 0, // Will be set in tests
    payment_amount: 25000.50,
    sppt_paid_count: 50,
    payment_type: 'tunai',
    notes: 'Test payment',
    created_by: 0 // Will be set in tests
  };

  it('should create a PBB payment', async () => {
    const input = {
      ...testInput,
      village_id: villageId,
      hamlet_id: hamletId,
      created_by: userId
    };

    const result = await createPbbPayment(input);

    // Basic field validation
    expect(result.payment_date).toEqual(new Date('2024-01-15'));
    expect(result.village_id).toEqual(villageId);
    expect(result.hamlet_id).toEqual(hamletId);
    expect(result.payment_amount).toEqual(25000.50);
    expect(typeof result.payment_amount).toBe('number');
    expect(result.sppt_paid_count).toEqual(50);
    expect(result.payment_type).toEqual('tunai');
    expect(result.notes).toEqual('Test payment');
    expect(result.created_by).toEqual(userId);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save payment to database', async () => {
    const input = {
      ...testInput,
      village_id: villageId,
      hamlet_id: hamletId,
      created_by: userId
    };

    const result = await createPbbPayment(input);

    // Query payment from database
    const payments = await db.select()
      .from(pbbPaymentsTable)
      .where(eq(pbbPaymentsTable.id, result.id))
      .execute();

    expect(payments).toHaveLength(1);
    expect(payments[0].payment_date).toEqual(new Date('2024-01-15'));
    expect(payments[0].village_id).toEqual(villageId);
    expect(payments[0].hamlet_id).toEqual(hamletId);
    expect(parseFloat(payments[0].payment_amount)).toEqual(25000.50);
    expect(payments[0].sppt_paid_count).toEqual(50);
    expect(payments[0].payment_type).toEqual('tunai');
    expect(payments[0].notes).toEqual('Test payment');
    expect(payments[0].created_by).toEqual(userId);
    expect(payments[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle null notes', async () => {
    const input = {
      ...testInput,
      village_id: villageId,
      hamlet_id: hamletId,
      created_by: userId,
      notes: null
    };

    const result = await createPbbPayment(input);

    expect(result.notes).toBeNull();
  });

  it('should handle undefined notes', async () => {
    const input = {
      ...testInput,
      village_id: villageId,
      hamlet_id: hamletId,
      created_by: userId
    };
    delete (input as any).notes;

    const result = await createPbbPayment(input);

    expect(result.notes).toBeNull();
  });

  it('should throw error when village does not exist', async () => {
    const input = {
      ...testInput,
      village_id: 99999, // Non-existent village
      hamlet_id: hamletId,
      created_by: userId
    };

    await expect(createPbbPayment(input)).rejects.toThrow(/village not found/i);
  });

  it('should throw error when user does not exist', async () => {
    const input = {
      ...testInput,
      village_id: villageId,
      hamlet_id: hamletId,
      created_by: 99999 // Non-existent user
    };

    await expect(createPbbPayment(input)).rejects.toThrow(/user not found/i);
  });

  it('should throw error when hamlet does not exist', async () => {
    const input = {
      ...testInput,
      village_id: villageId,
      hamlet_id: 99999, // Non-existent hamlet
      created_by: userId
    };

    await expect(createPbbPayment(input)).rejects.toThrow(/hamlet not found/i);
  });

  it('should throw error when hamlet does not belong to village', async () => {
    // Create another village
    const anotherVillageResult = await db.insert(villagesTable)
      .values({
        name: 'Another Village',
        code: 'AV001'
      })
      .returning()
      .execute();
    const anotherVillageId = anotherVillageResult[0].id;

    const input = {
      ...testInput,
      village_id: anotherVillageId, // Different village
      hamlet_id: hamletId, // Hamlet belongs to first village
      created_by: userId
    };

    await expect(createPbbPayment(input)).rejects.toThrow(/hamlet does not belong to the specified village/i);
  });

  it('should handle different payment types', async () => {
    const transferInput = {
      ...testInput,
      village_id: villageId,
      hamlet_id: hamletId,
      created_by: userId,
      payment_type: 'transfer' as const
    };

    const result = await createPbbPayment(transferInput);

    expect(result.payment_type).toEqual('transfer');
  });
});
