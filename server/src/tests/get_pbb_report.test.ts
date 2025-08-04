
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, villagesTable, hamletsTable, pbbPaymentsTable } from '../db/schema';
import { type PbbPaymentFilter } from '../schema';
import { getPbbReport } from '../handlers/get_pbb_report';

// Test data setup
const testUser = {
  username: 'testuser',
  password_hash: 'hashedpassword',
  full_name: 'Test User',
  role: 'super_admin' as const,
  village_id: null,
  is_active: true,
};

const testVillage = {
  name: 'Test Village',
  code: 'TV001',
};

const testHamlet = {
  name: 'Test Hamlet',
  head_name: 'Test Head',
  sppt_target: 100,
  pbb_target: '50000.00',
};

const testPayment = {
  payment_date: new Date('2024-01-15'),
  payment_amount: '25000.00',
  sppt_paid_count: 50,
  payment_type: 'tunai' as const,
  notes: 'Test payment',
};

describe('getPbbReport', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no payments exist', async () => {
    const result = await getPbbReport();
    expect(result).toEqual([]);
  });

  it('should return PBB report with achievement percentage', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable).values(testUser).returning().execute();
    const villageResult = await db.insert(villagesTable).values(testVillage).returning().execute();
    const hamletResult = await db.insert(hamletsTable)
      .values({
        ...testHamlet,
        village_id: villageResult[0].id,
      })
      .returning()
      .execute();

    // Create payment
    await db.insert(pbbPaymentsTable)
      .values({
        ...testPayment,
        village_id: villageResult[0].id,
        hamlet_id: hamletResult[0].id,
        created_by: userResult[0].id,
      })
      .execute();

    const result = await getPbbReport();

    expect(result).toHaveLength(1);
    expect(result[0].payment_date).toEqual(new Date('2024-01-15'));
    expect(result[0].village_name).toEqual('Test Village');
    expect(result[0].hamlet_name).toEqual('Test Hamlet');
    expect(result[0].payment_amount).toEqual(25000);
    expect(result[0].sppt_paid_count).toEqual(50);
    expect(result[0].payment_type).toEqual('tunai');
    expect(result[0].achievement_percentage).toEqual(50); // 25000 / 50000 * 100 = 50%
  });

  it('should filter by village_id', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable).values(testUser).returning().execute();
    const village1Result = await db.insert(villagesTable)
      .values({ ...testVillage, name: 'Village 1', code: 'V001' })
      .returning()
      .execute();
    const village2Result = await db.insert(villagesTable)
      .values({ ...testVillage, name: 'Village 2', code: 'V002' })
      .returning()
      .execute();

    const hamlet1Result = await db.insert(hamletsTable)
      .values({ ...testHamlet, village_id: village1Result[0].id, name: 'Hamlet 1' })
      .returning()
      .execute();
    const hamlet2Result = await db.insert(hamletsTable)
      .values({ ...testHamlet, village_id: village2Result[0].id, name: 'Hamlet 2' })
      .returning()
      .execute();

    // Create payments for both villages
    await db.insert(pbbPaymentsTable)
      .values({
        ...testPayment,
        village_id: village1Result[0].id,
        hamlet_id: hamlet1Result[0].id,
        created_by: userResult[0].id,
      })
      .execute();

    await db.insert(pbbPaymentsTable)
      .values({
        ...testPayment,
        village_id: village2Result[0].id,
        hamlet_id: hamlet2Result[0].id,
        created_by: userResult[0].id,
      })
      .execute();

    const filter: PbbPaymentFilter = {
      village_id: village1Result[0].id,
    };

    const result = await getPbbReport(filter);

    expect(result).toHaveLength(1);
    expect(result[0].village_name).toEqual('Village 1');
    expect(result[0].hamlet_name).toEqual('Hamlet 1');
  });

  it('should filter by date range', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable).values(testUser).returning().execute();
    const villageResult = await db.insert(villagesTable).values(testVillage).returning().execute();
    const hamletResult = await db.insert(hamletsTable)
      .values({
        ...testHamlet,
        village_id: villageResult[0].id,
      })
      .returning()
      .execute();

    // Create payments with different dates
    await db.insert(pbbPaymentsTable)
      .values({
        ...testPayment,
        payment_date: new Date('2024-01-10'),
        village_id: villageResult[0].id,
        hamlet_id: hamletResult[0].id,
        created_by: userResult[0].id,
      })
      .execute();

    await db.insert(pbbPaymentsTable)
      .values({
        ...testPayment,
        payment_date: new Date('2024-01-20'),
        village_id: villageResult[0].id,
        hamlet_id: hamletResult[0].id,
        created_by: userResult[0].id,
      })
      .execute();

    const filter: PbbPaymentFilter = {
      start_date: new Date('2024-01-15'),
      end_date: new Date('2024-01-25'),
    };

    const result = await getPbbReport(filter);

    expect(result).toHaveLength(1);
    expect(result[0].payment_date).toEqual(new Date('2024-01-20'));
  });

  it('should filter by payment type', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable).values(testUser).returning().execute();
    const villageResult = await db.insert(villagesTable).values(testVillage).returning().execute();
    const hamletResult = await db.insert(hamletsTable)
      .values({
        ...testHamlet,
        village_id: villageResult[0].id,
      })
      .returning()
      .execute();

    // Create payments with different types
    await db.insert(pbbPaymentsTable)
      .values({
        ...testPayment,
        payment_type: 'tunai',
        village_id: villageResult[0].id,
        hamlet_id: hamletResult[0].id,
        created_by: userResult[0].id,
      })
      .execute();

    await db.insert(pbbPaymentsTable)
      .values({
        ...testPayment,
        payment_type: 'transfer',
        village_id: villageResult[0].id,
        hamlet_id: hamletResult[0].id,
        created_by: userResult[0].id,
      })
      .execute();

    const filter: PbbPaymentFilter = {
      payment_type: 'transfer',
    };

    const result = await getPbbReport(filter);

    expect(result).toHaveLength(1);
    expect(result[0].payment_type).toEqual('transfer');
  });

  it('should calculate achievement percentage correctly', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable).values(testUser).returning().execute();
    const villageResult = await db.insert(villagesTable).values(testVillage).returning().execute();
    const hamletResult = await db.insert(hamletsTable)
      .values({
        ...testHamlet,
        village_id: villageResult[0].id,
        pbb_target: '100000.00', // Target 100,000
      })
      .returning()
      .execute();

    // Create payment of 33,333 for 33.33% achievement
    await db.insert(pbbPaymentsTable)
      .values({
        ...testPayment,
        payment_amount: '33333.00',
        village_id: villageResult[0].id,
        hamlet_id: hamletResult[0].id,
        created_by: userResult[0].id,
      })
      .execute();

    const result = await getPbbReport();

    expect(result).toHaveLength(1);
    expect(result[0].achievement_percentage).toEqual(33.33); // Should be rounded to 2 decimal places
  });

  it('should handle zero target correctly', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable).values(testUser).returning().execute();
    const villageResult = await db.insert(villagesTable).values(testVillage).returning().execute();
    const hamletResult = await db.insert(hamletsTable)
      .values({
        ...testHamlet,
        village_id: villageResult[0].id,
        pbb_target: '0.00', // Zero target
      })
      .returning()
      .execute();

    await db.insert(pbbPaymentsTable)
      .values({
        ...testPayment,
        village_id: villageResult[0].id,
        hamlet_id: hamletResult[0].id,
        created_by: userResult[0].id,
      })
      .execute();

    const result = await getPbbReport();

    expect(result).toHaveLength(1);
    expect(result[0].achievement_percentage).toEqual(0); // Should handle division by zero
  });
});
