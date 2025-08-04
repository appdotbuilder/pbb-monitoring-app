
import { db } from '../db';
import { pbbPaymentsTable, hamletsTable, villagesTable, usersTable } from '../db/schema';
import { type CreatePbbPaymentInput, type PbbPayment } from '../schema';
import { eq } from 'drizzle-orm';

export async function createPbbPayment(input: CreatePbbPaymentInput): Promise<PbbPayment> {
  try {
    // Validate that village exists first
    const village = await db.select()
      .from(villagesTable)
      .where(eq(villagesTable.id, input.village_id))
      .execute();

    if (village.length === 0) {
      throw new Error('Village not found');
    }

    // Validate that user exists
    const user = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.created_by))
      .execute();

    if (user.length === 0) {
      throw new Error('User not found');
    }

    // Validate that hamlet exists and belongs to the specified village
    const hamlet = await db.select()
      .from(hamletsTable)
      .where(eq(hamletsTable.id, input.hamlet_id))
      .execute();

    if (hamlet.length === 0) {
      throw new Error('Hamlet not found');
    }

    if (hamlet[0].village_id !== input.village_id) {
      throw new Error('Hamlet does not belong to the specified village');
    }

    // Insert PBB payment record
    const result = await db.insert(pbbPaymentsTable)
      .values({
        payment_date: input.payment_date,
        village_id: input.village_id,
        hamlet_id: input.hamlet_id,
        payment_amount: input.payment_amount.toString(), // Convert number to string for numeric column
        sppt_paid_count: input.sppt_paid_count,
        payment_type: input.payment_type,
        notes: input.notes || null,
        created_by: input.created_by
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const payment = result[0];
    return {
      ...payment,
      payment_amount: parseFloat(payment.payment_amount) // Convert string back to number
    };
  } catch (error) {
    console.error('PBB payment creation failed:', error);
    throw error;
  }
}
