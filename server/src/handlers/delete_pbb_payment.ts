
import { db } from '../db';
import { pbbPaymentsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const deletePbbPaymentInputSchema = z.object({
  id: z.number(),
});

type DeletePbbPaymentInput = z.infer<typeof deletePbbPaymentInputSchema>;

export async function deletePbbPayment(input: DeletePbbPaymentInput): Promise<{ success: boolean }> {
  try {
    // First check if the payment exists
    const existingPayment = await db.select()
      .from(pbbPaymentsTable)
      .where(eq(pbbPaymentsTable.id, input.id))
      .execute();

    if (existingPayment.length === 0) {
      throw new Error(`PBB payment with id ${input.id} not found`);
    }

    // Delete the payment record
    const result = await db.delete(pbbPaymentsTable)
      .where(eq(pbbPaymentsTable.id, input.id))
      .returning()
      .execute();

    return { success: result.length > 0 };
  } catch (error) {
    console.error('PBB payment deletion failed:', error);
    throw error;
  }
}
