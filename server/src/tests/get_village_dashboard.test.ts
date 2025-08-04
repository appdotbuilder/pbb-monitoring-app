
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { villagesTable, hamletsTable, pbbPaymentsTable, usersTable } from '../db/schema';
import { getVillageDashboard } from '../handlers/get_village_dashboard';

describe('getVillageDashboard', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no villages exist', async () => {
    const result = await getVillageDashboard();
    expect(result).toEqual([]);
  });

  it('should return village data with zero targets when no hamlets exist', async () => {
    // Create village without hamlets
    await db.insert(villagesTable).values({
      name: 'Village A',
      code: 'VA001'
    }).execute();

    const result = await getVillageDashboard();

    expect(result).toHaveLength(1);
    expect(result[0].village_name).toEqual('Village A');
    expect(result[0].total_sppt_target).toEqual(0);
    expect(result[0].total_pbb_target).toEqual(0);
    expect(result[0].total_sppt_paid).toEqual(0);
    expect(result[0].total_pbb_paid).toEqual(0);
    expect(result[0].achievement_percentage).toEqual(0);
  });

  it('should calculate dashboard data correctly with hamlets and payments', async () => {
    // Create user for payments
    const userResult = await db.insert(usersTable).values({
      username: 'testuser',
      password_hash: 'hash123',
      full_name: 'Test User',
      role: 'super_admin'
    }).returning().execute();

    // Create village
    const villageResult = await db.insert(villagesTable).values({
      name: 'Test Village',
      code: 'TV001'
    }).returning().execute();

    const villageId = villageResult[0].id;

    // Create hamlets with targets
    const hamlet1Result = await db.insert(hamletsTable).values({
      village_id: villageId,
      name: 'Hamlet 1',
      head_name: 'Head 1',
      sppt_target: 100,
      pbb_target: '50000.00'
    }).returning().execute();

    const hamlet2Result = await db.insert(hamletsTable).values({
      village_id: villageId,
      name: 'Hamlet 2',
      head_name: 'Head 2',
      sppt_target: 200,
      pbb_target: '75000.00'
    }).returning().execute();

    // Create payments
    await db.insert(pbbPaymentsTable).values({
      payment_date: new Date('2024-01-15'),
      village_id: villageId,
      hamlet_id: hamlet1Result[0].id,
      payment_amount: '25000.00',
      sppt_paid_count: 50,
      payment_type: 'tunai',
      created_by: userResult[0].id
    }).execute();

    await db.insert(pbbPaymentsTable).values({
      payment_date: new Date('2024-01-20'),
      village_id: villageId,
      hamlet_id: hamlet2Result[0].id,
      payment_amount: '30000.00',
      sppt_paid_count: 75,
      payment_type: 'transfer',
      created_by: userResult[0].id
    }).execute();

    const result = await getVillageDashboard();

    expect(result).toHaveLength(1);
    expect(result[0].village_id).toEqual(villageId);
    expect(result[0].village_name).toEqual('Test Village');
    expect(result[0].total_sppt_target).toEqual(300); // 100 + 200
    expect(result[0].total_pbb_target).toEqual(125000); // 50000 + 75000
    expect(result[0].total_sppt_paid).toEqual(125); // 50 + 75
    expect(result[0].total_pbb_paid).toEqual(55000); // 25000 + 30000
    expect(result[0].achievement_percentage).toBeCloseTo(44, 0); // 55000/125000 * 100 = 44%
  });

  it('should handle multiple villages correctly', async () => {
    // Create user for payments
    const userResult = await db.insert(usersTable).values({
      username: 'testuser',
      password_hash: 'hash123',
      full_name: 'Test User',
      role: 'super_admin'
    }).returning().execute();

    // Create two villages
    const village1Result = await db.insert(villagesTable).values({
      name: 'Village A',
      code: 'VA001'
    }).returning().execute();

    const village2Result = await db.insert(villagesTable).values({
      name: 'Village B',
      code: 'VB001'
    }).returning().execute();

    // Create hamlet for village 1
    const hamlet1Result = await db.insert(hamletsTable).values({
      village_id: village1Result[0].id,
      name: 'Hamlet A1',
      head_name: 'Head A1',
      sppt_target: 100,
      pbb_target: '50000.00'
    }).returning().execute();

    // Create hamlet for village 2
    const hamlet2Result = await db.insert(hamletsTable).values({
      village_id: village2Result[0].id,
      name: 'Hamlet B1',
      head_name: 'Head B1',
      sppt_target: 150,
      pbb_target: '60000.00'
    }).returning().execute();

    // Create payment for village 1
    await db.insert(pbbPaymentsTable).values({
      payment_date: new Date('2024-01-15'),
      village_id: village1Result[0].id,
      hamlet_id: hamlet1Result[0].id,
      payment_amount: '20000.00',
      sppt_paid_count: 40,
      payment_type: 'tunai',
      created_by: userResult[0].id
    }).execute();

    const result = await getVillageDashboard();

    expect(result).toHaveLength(2);
    
    // Results should be ordered by village name
    const villageA = result.find(v => v.village_name === 'Village A');
    const villageB = result.find(v => v.village_name === 'Village B');

    expect(villageA).toBeDefined();
    expect(villageA!.total_sppt_target).toEqual(100);
    expect(villageA!.total_pbb_target).toEqual(50000);
    expect(villageA!.total_sppt_paid).toEqual(40);
    expect(villageA!.total_pbb_paid).toEqual(20000);
    expect(villageA!.achievement_percentage).toEqual(40);

    expect(villageB).toBeDefined();
    expect(villageB!.total_sppt_target).toEqual(150);
    expect(villageB!.total_pbb_target).toEqual(60000);
    expect(villageB!.total_sppt_paid).toEqual(0);
    expect(villageB!.total_pbb_paid).toEqual(0);
    expect(villageB!.achievement_percentage).toEqual(0);
  });

  it('should handle achievement percentage calculation correctly', async () => {
    // Create user for payments
    const userResult = await db.insert(usersTable).values({
      username: 'testuser',
      password_hash: 'hash123',
      full_name: 'Test User',
      role: 'super_admin'
    }).returning().execute();

    // Create village
    const villageResult = await db.insert(villagesTable).values({
      name: 'Perfect Village',
      code: 'PV001'
    }).returning().execute();

    // Create hamlet with target
    const hamletResult = await db.insert(hamletsTable).values({
      village_id: villageResult[0].id,
      name: 'Perfect Hamlet',
      head_name: 'Perfect Head',
      sppt_target: 100,
      pbb_target: '100000.00'
    }).returning().execute();

    // Create payment that exactly meets target
    await db.insert(pbbPaymentsTable).values({
      payment_date: new Date('2024-01-15'),
      village_id: villageResult[0].id,
      hamlet_id: hamletResult[0].id,
      payment_amount: '100000.00',
      sppt_paid_count: 100,
      payment_type: 'tunai',
      created_by: userResult[0].id
    }).execute();

    const result = await getVillageDashboard();

    expect(result).toHaveLength(1);
    expect(result[0].achievement_percentage).toEqual(100);
  });
});
