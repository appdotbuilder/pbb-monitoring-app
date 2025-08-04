
import { db } from '../db';
import { pbbPaymentsTable, villagesTable, hamletsTable, usersTable } from '../db/schema';
import { type UpdatePbbPaymentInput, type PbbPayment } from '../schema';
import { eq, and } from 'drizzle-orm';

export const updatePbbPayment = async (input: UpdatePbbPaymentInput): Promise<PbbPayment> => {
  try {
    // First, verify the payment exists
    const existingPayment = await db.select()
      .from(pbbPaymentsTable)
      .where(eq(pbbPaymentsTable.id, input.id))
      .execute();

    if (existingPayment.length === 0) {
      throw new Error('PBB payment not found');
    }

    // If village_id is being updated, verify it exists
    if (input.village_id !== undefined) {
      const village = await db.select()
        .from(villagesTable)
        .where(eq(villagesTable.id, input.village_id))
        .execute();

      if (village.length === 0) {
        throw new Error('Village not found');
      }
    }

    // If hamlet_id is being updated, verify it exists and belongs to the correct village
    if (input.hamlet_id !== undefined) {
      const villageId = input.village_id !== undefined ? input.village_id : existingPayment[0].village_id;
      
      const hamlet = await db.select()
        .from(hamletsTable)
        .where(and(
          eq(hamletsTable.id, input.hamlet_id),
          eq(hamletsTable.village_id, villageId)
        ))
        .execute();

      if (hamlet.length === 0) {
        throw new Error('Hamlet not found or does not belong to the specified village');
      }
    }

    // Prepare update data, converting numeric fields to strings
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.payment_date !== undefined) {
      updateData.payment_date = input.payment_date;
    }
    if (input.village_id !== undefined) {
      updateData.village_id = input.village_id;
    }
    if (input.hamlet_id !== undefined) {
      updateData.hamlet_id = input.hamlet_id;
    }
    if (input.payment_amount !== undefined) {
      updateData.payment_amount = input.payment_amount.toString();
    }
    if (input.sppt_paid_count !== undefined) {
      updateData.sppt_paid_count = input.sppt_paid_count;
    }
    if (input.payment_type !== undefined) {
      updateData.payment_type = input.payment_type;
    }
    if (input.notes !== undefined) {
      updateData.notes = input.notes;
    }

    // Update the payment record
    const result = await db.update(pbbPaymentsTable)
      .set(updateData)
      .where(eq(pbbPaymentsTable.id, input.id))
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const payment = result[0];
    return {
      ...payment,
      payment_amount: parseFloat(payment.payment_amount)
    };
  } catch (error) {
    console.error('PBB payment update failed:', error);
    throw error;
  }
};
