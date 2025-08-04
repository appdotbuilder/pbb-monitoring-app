
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { villagesTable } from '../db/schema';
import { type CreateVillageInput } from '../schema';
import { createVillage } from '../handlers/create_village';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateVillageInput = {
  name: 'Test Village',
  code: 'TV001'
};

describe('createVillage', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a village', async () => {
    const result = await createVillage(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Village');
    expect(result.code).toEqual('TV001');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save village to database', async () => {
    const result = await createVillage(testInput);

    // Query using proper drizzle syntax
    const villages = await db.select()
      .from(villagesTable)
      .where(eq(villagesTable.id, result.id))
      .execute();

    expect(villages).toHaveLength(1);
    expect(villages[0].name).toEqual('Test Village');
    expect(villages[0].code).toEqual('TV001');
    expect(villages[0].created_at).toBeInstanceOf(Date);
    expect(villages[0].updated_at).toBeInstanceOf(Date);
  });

  it('should reject duplicate village codes', async () => {
    // Create first village
    await createVillage(testInput);

    // Try to create another village with same code
    const duplicateInput: CreateVillageInput = {
      name: 'Another Village',
      code: 'TV001' // Same code
    };

    await expect(createVillage(duplicateInput))
      .rejects.toThrow(/village with code 'TV001' already exists/i);
  });

  it('should allow different village codes', async () => {
    // Create first village
    const firstResult = await createVillage(testInput);

    // Create second village with different code
    const secondInput: CreateVillageInput = {
      name: 'Second Village',
      code: 'TV002'
    };

    const secondResult = await createVillage(secondInput);

    expect(firstResult.id).not.toEqual(secondResult.id);
    expect(firstResult.code).toEqual('TV001');
    expect(secondResult.code).toEqual('TV002');

    // Verify both exist in database
    const allVillages = await db.select()
      .from(villagesTable)
      .execute();

    expect(allVillages).toHaveLength(2);
  });
});
