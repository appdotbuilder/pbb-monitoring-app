
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { villagesTable, hamletsTable } from '../db/schema';
import { type CreateVillageInput, type CreateHamletInput, type UpdateHamletInput } from '../schema';
import { updateHamlet } from '../handlers/update_hamlet';
import { eq } from 'drizzle-orm';

describe('updateHamlet', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let villageId: number;
  let hamletId: number;

  beforeEach(async () => {
    // Create test village
    const villageInput: CreateVillageInput = {
      name: 'Test Village',
      code: 'TV001'
    };

    const villageResult = await db.insert(villagesTable)
      .values(villageInput)
      .returning()
      .execute();

    villageId = villageResult[0].id;

    // Create test hamlet
    const hamletInput: CreateHamletInput = {
      village_id: villageId,
      name: 'Original Hamlet',
      head_name: 'Original Head',
      sppt_target: 100,
      pbb_target: 1000000
    };

    const hamletResult = await db.insert(hamletsTable)
      .values({
        ...hamletInput,
        pbb_target: hamletInput.pbb_target.toString()
      })
      .returning()
      .execute();

    hamletId = hamletResult[0].id;
  });

  it('should update hamlet with all fields', async () => {
    const input: UpdateHamletInput = {
      id: hamletId,
      village_id: villageId,
      name: 'Updated Hamlet',
      head_name: 'Updated Head',
      sppt_target: 200,
      pbb_target: 2000000
    };

    const result = await updateHamlet(input);

    expect(result.id).toEqual(hamletId);
    expect(result.village_id).toEqual(villageId);
    expect(result.name).toEqual('Updated Hamlet');
    expect(result.head_name).toEqual('Updated Head');
    expect(result.sppt_target).toEqual(200);
    expect(result.pbb_target).toEqual(2000000);
    expect(typeof result.pbb_target).toBe('number');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update hamlet with partial fields', async () => {
    const input: UpdateHamletInput = {
      id: hamletId,
      name: 'Partially Updated',
      sppt_target: 150
    };

    const result = await updateHamlet(input);

    expect(result.id).toEqual(hamletId);
    expect(result.village_id).toEqual(villageId); // Should remain unchanged
    expect(result.name).toEqual('Partially Updated');
    expect(result.head_name).toEqual('Original Head'); // Should remain unchanged
    expect(result.sppt_target).toEqual(150);
    expect(result.pbb_target).toEqual(1000000); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save updated hamlet to database', async () => {
    const input: UpdateHamletInput = {
      id: hamletId,
      name: 'Database Updated',
      pbb_target: 1500000
    };

    await updateHamlet(input);

    const hamlets = await db.select()
      .from(hamletsTable)
      .where(eq(hamletsTable.id, hamletId))
      .execute();

    expect(hamlets).toHaveLength(1);
    expect(hamlets[0].name).toEqual('Database Updated');
    expect(parseFloat(hamlets[0].pbb_target)).toEqual(1500000);
    expect(hamlets[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent hamlet', async () => {
    const input: UpdateHamletInput = {
      id: 99999,
      name: 'Non-existent'
    };

    expect(updateHamlet(input)).rejects.toThrow(/hamlet with id 99999 not found/i);
  });

  it('should update only pbb_target correctly', async () => {
    const input: UpdateHamletInput = {
      id: hamletId,
      pbb_target: 2500000.75
    };

    const result = await updateHamlet(input);

    expect(result.pbb_target).toEqual(2500000.75);
    expect(typeof result.pbb_target).toBe('number');
    expect(result.name).toEqual('Original Hamlet'); // Should remain unchanged
  });
});
