
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, villagesTable, hamletsTable, pbbPaymentsTable } from '../db/schema';
import { type HamletFilter } from '../schema';
import { getHamletDashboard } from '../handlers/get_hamlet_dashboard';

describe('getHamletDashboard', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return hamlet dashboard data without payments', async () => {
    // Create test village
    const villages = await db.insert(villagesTable)
      .values({
        name: 'Test Village',
        code: 'TV001'
      })
      .returning()
      .execute();

    // Create test hamlet
    await db.insert(hamletsTable)
      .values({
        village_id: villages[0].id,
        name: 'Test Hamlet',
        head_name: 'John Doe',
        sppt_target: 100,
        pbb_target: '50000.00'
      })
      .execute();

    const result = await getHamletDashboard();

    expect(result).toHaveLength(1);
    expect(result[0].hamlet_name).toEqual('Test Hamlet');
    expect(result[0].village_name).toEqual('Test Village');
    expect(result[0].sppt_target).toEqual(100);
    expect(result[0].pbb_target).toEqual(50000);
    expect(result[0].sppt_paid).toEqual(0);
    expect(result[0].pbb_paid).toEqual(0);
    expect(result[0].achievement_percentage).toEqual(0);
  });

  it('should return hamlet dashboard data with payments and calculate achievement', async () => {
    // Create test village
    const villages = await db.insert(villagesTable)
      .values({
        name: 'Test Village',
        code: 'TV001'
      })
      .returning()
      .execute();

    // Create test hamlet
    const hamlets = await db.insert(hamletsTable)
      .values({
        village_id: villages[0].id,
        name: 'Test Hamlet',
        head_name: 'John Doe',
        sppt_target: 100,
        pbb_target: '50000.00'
      })
      .returning()
      .execute();

    // Create test user for created_by
    const users = await db.insert(usersTable)
      .values({
        username: 'testuser',
        password_hash: 'hashedpassword',
        full_name: 'Test User',
        role: 'super_admin',
        is_active: true
      })
      .returning()
      .execute();

    // Create test payments
    await db.insert(pbbPaymentsTable)
      .values([
        {
          payment_date: new Date('2024-01-15'),
          village_id: villages[0].id,
          hamlet_id: hamlets[0].id,
          payment_amount: '15000.00',
          sppt_paid_count: 30,
          payment_type: 'tunai',
          created_by: users[0].id
        },
        {
          payment_date: new Date('2024-01-20'),
          village_id: villages[0].id,
          hamlet_id: hamlets[0].id,
          payment_amount: '10000.00',
          sppt_paid_count: 20,
          payment_type: 'transfer',
          created_by: users[0].id
        }
      ])
      .execute();

    const result = await getHamletDashboard();

    expect(result).toHaveLength(1);
    expect(result[0].hamlet_name).toEqual('Test Hamlet');
    expect(result[0].village_name).toEqual('Test Village');
    expect(result[0].sppt_target).toEqual(100);
    expect(result[0].pbb_target).toEqual(50000);
    expect(result[0].sppt_paid).toEqual(50);
    expect(result[0].pbb_paid).toEqual(25000);
    expect(result[0].achievement_percentage).toEqual(50); // 25000/50000 * 100
  });

  it('should filter by village_id', async () => {
    // Create two test villages
    const villages = await db.insert(villagesTable)
      .values([
        { name: 'Village A', code: 'VA001' },
        { name: 'Village B', code: 'VB001' }
      ])
      .returning()
      .execute();

    // Create hamlets in both villages
    await db.insert(hamletsTable)
      .values([
        {
          village_id: villages[0].id,
          name: 'Hamlet A1',
          head_name: 'Head A1',
          sppt_target: 50,
          pbb_target: '25000.00'
        },
        {
          village_id: villages[1].id,
          name: 'Hamlet B1',
          head_name: 'Head B1',
          sppt_target: 75,
          pbb_target: '37500.00'
        }
      ])
      .execute();

    const filter: HamletFilter = {
      village_id: villages[0].id
    };

    const result = await getHamletDashboard(filter);

    expect(result).toHaveLength(1);
    expect(result[0].hamlet_name).toEqual('Hamlet A1');
    expect(result[0].village_name).toEqual('Village A');
    expect(result[0].sppt_target).toEqual(50);
    expect(result[0].pbb_target).toEqual(25000);
  });

  it('should return multiple hamlets with correct aggregation', async () => {
    // Create test village
    const villages = await db.insert(villagesTable)
      .values({
        name: 'Multi Hamlet Village',
        code: 'MHV001'
      })
      .returning()
      .execute();

    // Create multiple hamlets
    const hamlets = await db.insert(hamletsTable)
      .values([
        {
          village_id: villages[0].id,
          name: 'Hamlet 1',
          head_name: 'Head 1',
          sppt_target: 100,
          pbb_target: '50000.00'
        },
        {
          village_id: villages[0].id,
          name: 'Hamlet 2',
          head_name: 'Head 2',
          sppt_target: 80,
          pbb_target: '40000.00'
        }
      ])
      .returning()
      .execute();

    // Create test user
    const users = await db.insert(usersTable)
      .values({
        username: 'testuser',
        password_hash: 'hashedpassword',
        full_name: 'Test User',
        role: 'super_admin',
        is_active: true
      })
      .returning()
      .execute();

    // Create payments for both hamlets
    await db.insert(pbbPaymentsTable)
      .values([
        {
          payment_date: new Date('2024-01-15'),
          village_id: villages[0].id,
          hamlet_id: hamlets[0].id,
          payment_amount: '25000.00',
          sppt_paid_count: 50,
          payment_type: 'tunai',
          created_by: users[0].id
        },
        {
          payment_date: new Date('2024-01-16'),
          village_id: villages[0].id,
          hamlet_id: hamlets[1].id,
          payment_amount: '20000.00',
          sppt_paid_count: 40,
          payment_type: 'transfer',
          created_by: users[0].id
        }
      ])
      .execute();

    const result = await getHamletDashboard();

    expect(result).toHaveLength(2);
    
    // Find hamlet 1 result
    const hamlet1Result = result.find(r => r.hamlet_name === 'Hamlet 1');
    expect(hamlet1Result).toBeDefined();
    if (hamlet1Result) {
      expect(hamlet1Result.sppt_paid).toEqual(50);
      expect(hamlet1Result.pbb_paid).toEqual(25000);
      expect(hamlet1Result.achievement_percentage).toEqual(50);
    }

    // Find hamlet 2 result
    const hamlet2Result = result.find(r => r.hamlet_name === 'Hamlet 2');
    expect(hamlet2Result).toBeDefined();
    if (hamlet2Result) {
      expect(hamlet2Result.sppt_paid).toEqual(40);
      expect(hamlet2Result.pbb_paid).toEqual(20000);
      expect(hamlet2Result.achievement_percentage).toEqual(50);
    }
  });

  it('should return empty array when no hamlets exist', async () => {
    const result = await getHamletDashboard();
    expect(result).toHaveLength(0);
  });
});
