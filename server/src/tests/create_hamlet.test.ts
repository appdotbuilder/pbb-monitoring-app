
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { hamletsTable, villagesTable } from '../db/schema';
import { type CreateHamletInput } from '../schema';
import { createHamlet } from '../handlers/create_hamlet';
import { eq } from 'drizzle-orm';

// Test village data
const testVillage = {
  name: 'Test Village',
  code: 'TV001'
};

// Simple test input
const testInput: CreateHamletInput = {
  village_id: 1, // Will be set after village creation
  name: 'Test Hamlet',
  head_name: 'Test Head',
  sppt_target: 100,
  pbb_target: 50000.75
};

describe('createHamlet', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a hamlet', async () => {
    // Create prerequisite village
    const village = await db.insert(villagesTable)
      .values(testVillage)
      .returning()
      .execute();

    const input = { ...testInput, village_id: village[0].id };
    const result = await createHamlet(input);

    // Basic field validation
    expect(result.name).toEqual('Test Hamlet');
    expect(result.head_name).toEqual('Test Head');
    expect(result.village_id).toEqual(village[0].id);
    expect(result.sppt_target).toEqual(100);
    expect(result.pbb_target).toEqual(50000.75);
    expect(typeof result.pbb_target).toBe('number');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save hamlet to database', async () => {
    // Create prerequisite village
    const village = await db.insert(villagesTable)
      .values(testVillage)
      .returning()
      .execute();

    const input = { ...testInput, village_id: village[0].id };
    const result = await createHamlet(input);

    // Query using proper drizzle syntax
    const hamlets = await db.select()
      .from(hamletsTable)
      .where(eq(hamletsTable.id, result.id))
      .execute();

    expect(hamlets).toHaveLength(1);
    expect(hamlets[0].name).toEqual('Test Hamlet');
    expect(hamlets[0].head_name).toEqual('Test Head');
    expect(hamlets[0].village_id).toEqual(village[0].id);
    expect(hamlets[0].sppt_target).toEqual(100);
    expect(parseFloat(hamlets[0].pbb_target)).toEqual(50000.75);
    expect(hamlets[0].created_at).toBeInstanceOf(Date);
    expect(hamlets[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent village', async () => {
    const input = { ...testInput, village_id: 999 };

    await expect(createHamlet(input)).rejects.toThrow(/village with id 999 not found/i);
  });

  it('should enforce hamlet limit per village', async () => {
    // Create prerequisite village
    const village = await db.insert(villagesTable)
      .values(testVillage)
      .returning()
      .execute();

    // Create 5 hamlets (maximum allowed)
    for (let i = 1; i <= 5; i++) {
      const hamletInput = {
        ...testInput,
        village_id: village[0].id,
        name: `Hamlet ${i}`,
        head_name: `Head ${i}`
      };
      await createHamlet(hamletInput);
    }

    // Try to create 6th hamlet - should fail
    const sixthHamletInput = {
      ...testInput,
      village_id: village[0].id,
      name: 'Sixth Hamlet',
      head_name: 'Sixth Head'
    };

    await expect(createHamlet(sixthHamletInput)).rejects.toThrow(/village can have maximum 5 hamlets/i);
  });

  it('should allow multiple villages to have hamlets', async () => {
    // Create two villages
    const village1 = await db.insert(villagesTable)
      .values({ ...testVillage, code: 'TV001' })
      .returning()
      .execute();

    const village2 = await db.insert(villagesTable)
      .values({ ...testVillage, name: 'Test Village 2', code: 'TV002' })
      .returning()
      .execute();

    // Create hamlet in each village
    const hamlet1 = await createHamlet({
      ...testInput,
      village_id: village1[0].id,
      name: 'Hamlet 1'
    });

    const hamlet2 = await createHamlet({
      ...testInput,
      village_id: village2[0].id,
      name: 'Hamlet 2'
    });

    expect(hamlet1.village_id).toEqual(village1[0].id);
    expect(hamlet2.village_id).toEqual(village2[0].id);
    expect(hamlet1.name).toEqual('Hamlet 1');
    expect(hamlet2.name).toEqual('Hamlet 2');
  });
});
