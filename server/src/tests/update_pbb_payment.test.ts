
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { pbbPaymentsTable, villagesTable, hamletsTable, usersTable } from '../db/schema';
import { type UpdatePbbPaymentInput } from '../schema';
import { updatePbbPayment } from '../handlers/update_pbb_payment';
import { eq } from 'drizzle-orm';

describe('updatePbbPayment', () => {
  let villageId: number;
  let hamletId: number;
  let userId: number;
  let paymentId: number;

  beforeEach(async () => {
    await createDB();

    // Create test village
    const village = await db.insert(villagesTable)
      .values({
        name: 'Test Village',
        code: 'TV001'
      })
      .returning()
      .execute();
    villageId = village[0].id;

    // Create test hamlet
    const hamlet = await db.insert(hamletsTable)
      .values({
        village_id: villageId,
        name: 'Test Hamlet',
        head_name: 'John Doe',
        sppt_target: 100,
        pbb_target: '1000000.00'
      })
      .returning()
      .execute();
    hamletId = hamlet[0].id;

    // Create test user
    const user = await db.insert(usersTable)
      .values({
        username: 'testuser',
        password_hash: 'hashedpassword',
        full_name: 'Test User',
        role: 'village_user',
        village_id: villageId
      })
      .returning()
      .execute();
    userId = user[0].id;

    // Create test PBB payment
    const payment = await db.insert(pbbPaymentsTable)
      .values({
        payment_date: new Date('2024-01-15'),
        village_id: villageId,
        hamlet_id: hamletId,
        payment_amount: '500000.00',
        sppt_paid_count: 10,
        payment_type: 'tunai',
        notes: 'Original payment',
        created_by: userId
      })
      .returning()
      .execute();
    paymentId = payment[0].id;
  });

  afterEach(resetDB);

  it('should update payment amount and sppt count', async () => {
    const input: UpdatePbbPaymentInput = {
      id: paymentId,
      payment_amount: 750000,
      sppt_paid_count: 15
    };

    const result = await updatePbbPayment(input);

    expect(result.id).toEqual(paymentId);
    expect(result.payment_amount).toEqual(750000);
    expect(typeof result.payment_amount).toBe('number');
    expect(result.sppt_paid_count).toEqual(15);
    expect(result.village_id).toEqual(villageId);
    expect(result.hamlet_id).toEqual(hamletId);
    expect(result.payment_type).toEqual('tunai');
    expect(result.notes).toEqual('Original payment');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update payment type and notes', async () => {
    const input: UpdatePbbPaymentInput = {
      id: paymentId,
      payment_type: 'transfer',
      notes: 'Updated via transfer'
    };

    const result = await updatePbbPayment(input);

    expect(result.payment_type).toEqual('transfer');
    expect(result.notes).toEqual('Updated via transfer');
    expect(result.payment_amount).toEqual(500000); // Should remain unchanged
    expect(result.sppt_paid_count).toEqual(10); // Should remain unchanged
  });

  it('should update payment date', async () => {
    const newDate = new Date('2024-02-20');
    const input: UpdatePbbPaymentInput = {
      id: paymentId,
      payment_date: newDate
    };

    const result = await updatePbbPayment(input);

    expect(result.payment_date).toEqual(newDate);
  });

  it('should update record in database', async () => {
    const input: UpdatePbbPaymentInput = {
      id: paymentId,
      payment_amount: 600000,
      notes: 'Database update test'
    };

    await updatePbbPayment(input);

    const payments = await db.select()
      .from(pbbPaymentsTable)
      .where(eq(pbbPaymentsTable.id, paymentId))
      .execute();

    expect(payments).toHaveLength(1);
    expect(parseFloat(payments[0].payment_amount)).toEqual(600000);
    expect(payments[0].notes).toEqual('Database update test');
    expect(payments[0].updated_at).toBeInstanceOf(Date);
  });

  it('should set notes to null when provided', async () => {
    const input: UpdatePbbPaymentInput = {
      id: paymentId,
      notes: null
    };

    const result = await updatePbbPayment(input);

    expect(result.notes).toBeNull();
  });

  it('should update village and hamlet together', async () => {
    // Create another village and hamlet
    const newVillage = await db.insert(villagesTable)
      .values({
        name: 'New Village',
        code: 'NV001'
      })
      .returning()
      .execute();

    const newHamlet = await db.insert(hamletsTable)
      .values({
        village_id: newVillage[0].id,
        name: 'New Hamlet',
        head_name: 'Jane Doe',
        sppt_target: 50,
        pbb_target: '500000.00'
      })
      .returning()
      .execute();

    const input: UpdatePbbPaymentInput = {
      id: paymentId,
      village_id: newVillage[0].id,
      hamlet_id: newHamlet[0].id
    };

    const result = await updatePbbPayment(input);

    expect(result.village_id).toEqual(newVillage[0].id);
    expect(result.hamlet_id).toEqual(newHamlet[0].id);
  });

  it('should throw error when payment not found', async () => {
    const input: UpdatePbbPaymentInput = {
      id: 99999,
      payment_amount: 100000
    };

    expect(updatePbbPayment(input)).rejects.toThrow(/payment not found/i);
  });

  it('should throw error when village not found', async () => {
    const input: UpdatePbbPaymentInput = {
      id: paymentId,
      village_id: 99999
    };

    expect(updatePbbPayment(input)).rejects.toThrow(/village not found/i);
  });

  it('should throw error when hamlet does not belong to village', async () => {
    // Create another village
    const otherVillage = await db.insert(villagesTable)
      .values({
        name: 'Other Village',
        code: 'OV001'
      })
      .returning()
      .execute();

    const input: UpdatePbbPaymentInput = {
      id: paymentId,
      village_id: otherVillage[0].id,
      hamlet_id: hamletId // This hamlet belongs to original village
    };

    expect(updatePbbPayment(input)).rejects.toThrow(/hamlet not found or does not belong/i);
  });
});
