
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { villagesTable } from '../db/schema';
import { getVillages } from '../handlers/get_villages';

describe('getVillages', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no villages exist', async () => {
    const result = await getVillages();
    expect(result).toEqual([]);
  });

  it('should return all villages ordered by name', async () => {
    // Create test villages in non-alphabetical order
    await db.insert(villagesTable).values([
      { name: 'Zebra Village', code: 'ZEB' },
      { name: 'Alpha Village', code: 'ALP' },
      { name: 'Beta Village', code: 'BET' }
    ]).execute();

    const result = await getVillages();

    expect(result).toHaveLength(3);
    
    // Verify ordering by name
    expect(result[0].name).toEqual('Alpha Village');
    expect(result[1].name).toEqual('Beta Village');
    expect(result[2].name).toEqual('Zebra Village');

    // Verify all fields are present
    result.forEach(village => {
      expect(village.id).toBeDefined();
      expect(village.name).toBeDefined();
      expect(village.code).toBeDefined();
      expect(village.created_at).toBeInstanceOf(Date);
      expect(village.updated_at).toBeInstanceOf(Date);
    });
  });

  it('should return villages with correct field values', async () => {
    const testVillage = {
      name: 'Test Village',
      code: 'TEST'
    };

    await db.insert(villagesTable).values(testVillage).execute();

    const result = await getVillages();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Test Village');
    expect(result[0].code).toEqual('TEST');
    expect(result[0].id).toBeGreaterThan(0);
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });
});
