
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, villagesTable, hamletsTable, pbbPaymentsTable } from '../db/schema';
import { deletePbbPayment } from '../handlers/delete_pbb_payment';
import { eq } from 'drizzle-orm';

describe('deletePbbPayment', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing PBB payment', async () => {
    // Create prerequisite data
    const village = await db.insert(villagesTable)
      .values({
        name: 'Test Village',
        code: 'TV001'
      })
      .returning()
      .execute();

    const hamlet = await db.insert(hamletsTable)
      .values({
        village_id: village[0].id,
        name: 'Test Hamlet',
        head_name: 'Test Head',
        sppt_target: 100,
        pbb_target: '5000000.00'
      })
      .returning()
      .execute();

    const user = await db.insert(usersTable)
      .values({
        username: 'testuser',
        password_hash: 'hashed_password',
        full_name: 'Test User',
        role: 'village_user',
        village_id: village[0].id
      })
      .returning()
      .execute();

    // Create PBB payment to delete
    const payment = await db.insert(pbbPaymentsTable)
      .values({
        payment_date: new Date('2024-01-15'),
        village_id: village[0].id,
        hamlet_id: hamlet[0].id,
        payment_amount: '1500000.00',
        sppt_paid_count: 25,
        payment_type: 'tunai',
        notes: 'Test payment for deletion',
        created_by: user[0].id
      })
      .returning()
      .execute();

    // Delete the payment
    const result = await deletePbbPayment({ id: payment[0].id });

    // Verify deletion was successful
    expect(result.success).toBe(true);

    // Verify payment no longer exists in database
    const deletedPayment = await db.select()
      .from(pbbPaymentsTable)
      .where(eq(pbbPaymentsTable.id, payment[0].id))
      .execute();

    expect(deletedPayment).toHaveLength(0);
  });

  it('should throw error when payment does not exist', async () => {
    const nonExistentId = 99999;

    expect(async () => {
      await deletePbbPayment({ id: nonExistentId });
    }).toThrow(/PBB payment with id 99999 not found/i);
  });

  it('should verify payment exists before attempting deletion', async () => {
    // Create prerequisite data
    const village = await db.insert(villagesTable)
      .values({
        name: 'Test Village',
        code: 'TV001'
      })
      .returning()
      .execute();

    const hamlet = await db.insert(hamletsTable)
      .values({
        village_id: village[0].id,
        name: 'Test Hamlet',
        head_name: 'Test Head',
        sppt_target: 50,
        pbb_target: '2500000.00'
      })
      .returning()
      .execute();

    const user = await db.insert(usersTable)
      .values({
        username: 'testuser2',
        password_hash: 'hashed_password',
        full_name: 'Test User 2',
        role: 'super_admin'
      })
      .returning()
      .execute();

    // Create multiple payments
    const payment1 = await db.insert(pbbPaymentsTable)
      .values({
        payment_date: new Date('2024-01-10'),
        village_id: village[0].id,
        hamlet_id: hamlet[0].id,
        payment_amount: '800000.00',
        sppt_paid_count: 15,
        payment_type: 'transfer',
        created_by: user[0].id
      })
      .returning()
      .execute();

    const payment2 = await db.insert(pbbPaymentsTable)
      .values({
        payment_date: new Date('2024-01-20'),
        village_id: village[0].id,
        hamlet_id: hamlet[0].id,
        payment_amount: '1200000.00',
        sppt_paid_count: 20,
        payment_type: 'setoran',
        created_by: user[0].id
      })
      .returning()
      .execute();

    // Delete one payment
    const result = await deletePbbPayment({ id: payment1[0].id });
    expect(result.success).toBe(true);

    // Verify only the targeted payment was deleted
    const remainingPayments = await db.select()
      .from(pbbPaymentsTable)
      .execute();

    expect(remainingPayments).toHaveLength(1);
    expect(remainingPayments[0].id).toBe(payment2[0].id);
    expect(parseFloat(remainingPayments[0].payment_amount)).toBe(1200000.00);
  });
});
