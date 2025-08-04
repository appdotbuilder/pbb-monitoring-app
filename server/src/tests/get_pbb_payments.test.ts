
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, villagesTable, hamletsTable, pbbPaymentsTable } from '../db/schema';
import { type PbbPaymentFilter } from '../schema';
import { getPbbPayments } from '../handlers/get_pbb_payments';

describe('getPbbPayments', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testVillageId: number;
  let testVillageId2: number;
  let testHamletId: number;
  let testHamletId2: number;
  let testUserId: number;

  beforeEach(async () => {
    // Create test villages
    const villages = await db.insert(villagesTable)
      .values([
        { name: 'Test Village 1', code: 'TV1' },
        { name: 'Test Village 2', code: 'TV2' }
      ])
      .returning()
      .execute();

    testVillageId = villages[0].id;
    testVillageId2 = villages[1].id;

    // Create test hamlets
    const hamlets = await db.insert(hamletsTable)
      .values([
        {
          village_id: testVillageId,
          name: 'Test Hamlet 1',
          head_name: 'Head 1',
          sppt_target: 100,
          pbb_target: '1000000.00'
        },
        {
          village_id: testVillageId2,
          name: 'Test Hamlet 2',
          head_name: 'Head 2',
          sppt_target: 200,
          pbb_target: '2000000.00'
        }
      ])
      .returning()
      .execute();

    testHamletId = hamlets[0].id;
    testHamletId2 = hamlets[1].id;

    // Create test user
    const users = await db.insert(usersTable)
      .values({
        username: 'testuser',
        password_hash: 'hashedpassword',
        full_name: 'Test User',
        role: 'village_user',
        village_id: testVillageId
      })
      .returning()
      .execute();

    testUserId = users[0].id;
  });

  it('should return all PBB payments when no filter is provided', async () => {
    // Create test payments
    await db.insert(pbbPaymentsTable)
      .values([
        {
          payment_date: new Date('2024-01-15'),
          village_id: testVillageId,
          hamlet_id: testHamletId,
          payment_amount: '50000.00',
          sppt_paid_count: 5,
          payment_type: 'tunai',
          notes: 'Test payment 1',
          created_by: testUserId
        },
        {
          payment_date: new Date('2024-01-20'),
          village_id: testVillageId2,
          hamlet_id: testHamletId2,
          payment_amount: '75000.50',
          sppt_paid_count: 7,
          payment_type: 'transfer',
          notes: null,
          created_by: testUserId
        }
      ])
      .execute();

    const results = await getPbbPayments();

    expect(results).toHaveLength(2);
    expect(results[0].payment_amount).toEqual(75000.50); // Most recent first
    expect(results[1].payment_amount).toEqual(50000.00);
    expect(typeof results[0].payment_amount).toBe('number');
    expect(results[0].payment_date).toBeInstanceOf(Date);
  });

  it('should filter by village_id', async () => {
    // Create test payments
    await db.insert(pbbPaymentsTable)
      .values([
        {
          payment_date: new Date('2024-01-15'),
          village_id: testVillageId,
          hamlet_id: testHamletId,
          payment_amount: '50000.00',
          sppt_paid_count: 5,
          payment_type: 'tunai',
          notes: 'Village 1 payment',
          created_by: testUserId
        },
        {
          payment_date: new Date('2024-01-20'),
          village_id: testVillageId2,
          hamlet_id: testHamletId2,
          payment_amount: '75000.00',
          sppt_paid_count: 7,
          payment_type: 'transfer',
          notes: 'Village 2 payment',
          created_by: testUserId
        }
      ])
      .execute();

    const filter: PbbPaymentFilter = { village_id: testVillageId };
    const results = await getPbbPayments(filter);

    expect(results).toHaveLength(1);
    expect(results[0].village_id).toEqual(testVillageId);
    expect(results[0].notes).toEqual('Village 1 payment');
  });

  it('should filter by hamlet_id', async () => {
    // Create test payments
    await db.insert(pbbPaymentsTable)
      .values([
        {
          payment_date: new Date('2024-01-15'),
          village_id: testVillageId,
          hamlet_id: testHamletId,
          payment_amount: '50000.00',
          sppt_paid_count: 5,
          payment_type: 'tunai',
          notes: 'Hamlet 1 payment',
          created_by: testUserId
        },
        {
          payment_date: new Date('2024-01-20'),
          village_id: testVillageId2,
          hamlet_id: testHamletId2,
          payment_amount: '75000.00',
          sppt_paid_count: 7,
          payment_type: 'transfer',
          notes: 'Hamlet 2 payment',
          created_by: testUserId
        }
      ])
      .execute();

    const filter: PbbPaymentFilter = { hamlet_id: testHamletId2 };
    const results = await getPbbPayments(filter);

    expect(results).toHaveLength(1);
    expect(results[0].hamlet_id).toEqual(testHamletId2);
    expect(results[0].notes).toEqual('Hamlet 2 payment');
  });

  it('should filter by date range', async () => {
    // Create test payments with different dates
    await db.insert(pbbPaymentsTable)
      .values([
        {
          payment_date: new Date('2024-01-10'),
          village_id: testVillageId,
          hamlet_id: testHamletId,
          payment_amount: '30000.00',
          sppt_paid_count: 3,
          payment_type: 'tunai',
          notes: 'Early payment',
          created_by: testUserId
        },
        {
          payment_date: new Date('2024-01-15'),
          village_id: testVillageId,
          hamlet_id: testHamletId,
          payment_amount: '50000.00',
          sppt_paid_count: 5,
          payment_type: 'tunai',
          notes: 'Mid payment',
          created_by: testUserId
        },
        {
          payment_date: new Date('2024-01-25'),
          village_id: testVillageId,
          hamlet_id: testHamletId,
          payment_amount: '70000.00',
          sppt_paid_count: 7,
          payment_type: 'transfer',
          notes: 'Late payment',
          created_by: testUserId
        }
      ])
      .execute();

    const filter: PbbPaymentFilter = {
      start_date: new Date('2024-01-12'),
      end_date: new Date('2024-01-20')
    };
    const results = await getPbbPayments(filter);

    expect(results).toHaveLength(1);
    expect(results[0].notes).toEqual('Mid payment');
    expect(results[0].payment_date.getTime()).toEqual(new Date('2024-01-15').getTime());
  });

  it('should filter by payment_type', async () => {
    // Create test payments with different types
    await db.insert(pbbPaymentsTable)
      .values([
        {
          payment_date: new Date('2024-01-15'),
          village_id: testVillageId,
          hamlet_id: testHamletId,
          payment_amount: '50000.00',
          sppt_paid_count: 5,
          payment_type: 'tunai',
          notes: 'Cash payment',
          created_by: testUserId
        },
        {
          payment_date: new Date('2024-01-20'),
          village_id: testVillageId,
          hamlet_id: testHamletId,
          payment_amount: '75000.00',
          sppt_paid_count: 7,
          payment_type: 'transfer',
          notes: 'Transfer payment',
          created_by: testUserId
        },
        {
          payment_date: new Date('2024-01-25'),
          village_id: testVillageId,
          hamlet_id: testHamletId,
          payment_amount: '60000.00',
          sppt_paid_count: 6,
          payment_type: 'setoran',
          notes: 'Deposit payment',
          created_by: testUserId
        }
      ])
      .execute();

    const filter: PbbPaymentFilter = { payment_type: 'transfer' };
    const results = await getPbbPayments(filter);

    expect(results).toHaveLength(1);
    expect(results[0].payment_type).toEqual('transfer');
    expect(results[0].notes).toEqual('Transfer payment');
  });

  it('should apply multiple filters correctly', async () => {
    // Create test payments
    await db.insert(pbbPaymentsTable)
      .values([
        {
          payment_date: new Date('2024-01-15'),
          village_id: testVillageId,
          hamlet_id: testHamletId,
          payment_amount: '50000.00',
          sppt_paid_count: 5,
          payment_type: 'tunai',
          notes: 'Match all filters',
          created_by: testUserId
        },
        {
          payment_date: new Date('2024-01-15'),
          village_id: testVillageId2,
          hamlet_id: testHamletId2,
          payment_amount: '75000.00',
          sppt_paid_count: 7,
          payment_type: 'tunai',
          notes: 'Different village',
          created_by: testUserId
        },
        {
          payment_date: new Date('2024-01-25'),
          village_id: testVillageId,
          hamlet_id: testHamletId,
          payment_amount: '60000.00',
          sppt_paid_count: 6,
          payment_type: 'transfer',
          notes: 'Different type and date',
          created_by: testUserId
        }
      ])
      .execute();

    const filter: PbbPaymentFilter = {
      village_id: testVillageId,
      payment_type: 'tunai',
      start_date: new Date('2024-01-10'),
      end_date: new Date('2024-01-20')
    };
    const results = await getPbbPayments(filter);

    expect(results).toHaveLength(1);
    expect(results[0].notes).toEqual('Match all filters');
    expect(results[0].village_id).toEqual(testVillageId);
    expect(results[0].payment_type).toEqual('tunai');
  });

  it('should return empty array when no payments match filter', async () => {
    // Create test payment
    await db.insert(pbbPaymentsTable)
      .values({
        payment_date: new Date('2024-01-15'),
        village_id: testVillageId,
        hamlet_id: testHamletId,
        payment_amount: '50000.00',
        sppt_paid_count: 5,
        payment_type: 'tunai',
        notes: 'Test payment',
        created_by: testUserId
      })
      .execute();

    const filter: PbbPaymentFilter = { village_id: 999 }; // Non-existent village
    const results = await getPbbPayments(filter);

    expect(results).toHaveLength(0);
  });

  it('should return results ordered by payment_date descending', async () => {
    // Create test payments with different dates
    await db.insert(pbbPaymentsTable)
      .values([
        {
          payment_date: new Date('2024-01-10'),
          village_id: testVillageId,
          hamlet_id: testHamletId,
          payment_amount: '30000.00',
          sppt_paid_count: 3,
          payment_type: 'tunai',
          notes: 'First',
          created_by: testUserId
        },
        {
          payment_date: new Date('2024-01-25'),
          village_id: testVillageId,
          hamlet_id: testHamletId,
          payment_amount: '70000.00',
          sppt_paid_count: 7,
          payment_type: 'transfer',
          notes: 'Last',
          created_by: testUserId
        },
        {
          payment_date: new Date('2024-01-15'),
          village_id: testVillageId,
          hamlet_id: testHamletId,
          payment_amount: '50000.00',
          sppt_paid_count: 5,
          payment_type: 'tunai',
          notes: 'Middle',
          created_by: testUserId
        }
      ])
      .execute();

    const results = await getPbbPayments();

    expect(results).toHaveLength(3);
    expect(results[0].notes).toEqual('Last'); // Most recent first
    expect(results[1].notes).toEqual('Middle');
    expect(results[2].notes).toEqual('First'); // Oldest last
  });
});
