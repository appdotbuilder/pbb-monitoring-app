
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { villagesTable, hamletsTable } from '../db/schema';
import { type CreateVillageInput, type CreateHamletInput } from '../schema';
import { getHamlets } from '../handlers/get_hamlets';

// Test data
const testVillage1: CreateVillageInput = {
  name: 'Village One',
  code: 'V001'
};

const testVillage2: CreateVillageInput = {
  name: 'Village Two', 
  code: 'V002'
};

const testHamlet1: CreateHamletInput = {
  village_id: 1, // Will be set after village creation
  name: 'Hamlet Alpha',
  head_name: 'John Doe',
  sppt_target: 100,
  pbb_target: 50000.75
};

const testHamlet2: CreateHamletInput = {
  village_id: 1, // Will be set after village creation
  name: 'Hamlet Beta',
  head_name: 'Jane Smith',
  sppt_target: 150,
  pbb_target: 75000.50
};

const testHamlet3: CreateHamletInput = {
  village_id: 2, // Will be set after village creation
  name: 'Hamlet Gamma',
  head_name: 'Bob Wilson',
  sppt_target: 200,
  pbb_target: 100000.25
};

describe('getHamlets', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no hamlets exist', async () => {
    const results = await getHamlets();
    expect(results).toEqual([]);
  });

  it('should return all hamlets when no filter provided', async () => {
    // Create villages first
    const village1Result = await db.insert(villagesTable)
      .values(testVillage1)
      .returning()
      .execute();
    
    const village2Result = await db.insert(villagesTable)
      .values(testVillage2)
      .returning()
      .execute();

    // Create hamlets - convert pbb_target to string
    await db.insert(hamletsTable)
      .values([
        { 
          ...testHamlet1, 
          village_id: village1Result[0].id,
          pbb_target: testHamlet1.pbb_target.toString()
        },
        { 
          ...testHamlet2, 
          village_id: village1Result[0].id,
          pbb_target: testHamlet2.pbb_target.toString()
        },
        { 
          ...testHamlet3, 
          village_id: village2Result[0].id,
          pbb_target: testHamlet3.pbb_target.toString()
        }
      ])
      .execute();

    const results = await getHamlets();

    expect(results).toHaveLength(3);
    
    // Verify hamlet data and numeric conversion
    const hamlet1 = results.find(h => h.name === 'Hamlet Alpha');
    expect(hamlet1).toBeDefined();
    expect(hamlet1!.village_id).toEqual(village1Result[0].id);
    expect(hamlet1!.head_name).toEqual('John Doe');
    expect(hamlet1!.sppt_target).toEqual(100);
    expect(hamlet1!.pbb_target).toEqual(50000.75);
    expect(typeof hamlet1!.pbb_target).toBe('number');
    expect(hamlet1!.created_at).toBeInstanceOf(Date);

    const hamlet3 = results.find(h => h.name === 'Hamlet Gamma');
    expect(hamlet3).toBeDefined();
    expect(hamlet3!.village_id).toEqual(village2Result[0].id);
    expect(hamlet3!.pbb_target).toEqual(100000.25);
    expect(typeof hamlet3!.pbb_target).toBe('number');
  });

  it('should filter hamlets by village_id', async () => {
    // Create villages
    const village1Result = await db.insert(villagesTable)
      .values(testVillage1)
      .returning()
      .execute();
    
    const village2Result = await db.insert(villagesTable)
      .values(testVillage2)
      .returning()
      .execute();

    // Create hamlets in different villages - convert pbb_target to string
    await db.insert(hamletsTable)
      .values([
        { 
          ...testHamlet1, 
          village_id: village1Result[0].id,
          pbb_target: testHamlet1.pbb_target.toString()
        },
        { 
          ...testHamlet2, 
          village_id: village1Result[0].id,
          pbb_target: testHamlet2.pbb_target.toString()
        },
        { 
          ...testHamlet3, 
          village_id: village2Result[0].id,
          pbb_target: testHamlet3.pbb_target.toString()
        }
      ])
      .execute();

    // Filter by village 1
    const village1Hamlets = await getHamlets({ village_id: village1Result[0].id });
    expect(village1Hamlets).toHaveLength(2);
    village1Hamlets.forEach(hamlet => {
      expect(hamlet.village_id).toEqual(village1Result[0].id);
    });

    // Filter by village 2
    const village2Hamlets = await getHamlets({ village_id: village2Result[0].id });
    expect(village2Hamlets).toHaveLength(1);
    expect(village2Hamlets[0].village_id).toEqual(village2Result[0].id);
    expect(village2Hamlets[0].name).toEqual('Hamlet Gamma');
  });

  it('should return empty array for non-existent village_id', async () => {
    // Create a village and hamlet
    const villageResult = await db.insert(villagesTable)
      .values(testVillage1)
      .returning()
      .execute();

    await db.insert(hamletsTable)
      .values({ 
        ...testHamlet1, 
        village_id: villageResult[0].id,
        pbb_target: testHamlet1.pbb_target.toString()
      })
      .execute();

    // Filter by non-existent village
    const results = await getHamlets({ village_id: 999 });
    expect(results).toEqual([]);
  });

  it('should only return hamlets from existing villages due to inner join', async () => {
    // Create village
    const villageResult = await db.insert(villagesTable)
      .values(testVillage1)
      .returning()
      .execute();

    // Create hamlet with valid village_id
    await db.insert(hamletsTable)
      .values({ 
        ...testHamlet1, 
        village_id: villageResult[0].id,
        pbb_target: testHamlet1.pbb_target.toString()
      })
      .execute();

    // Manually insert hamlet with invalid village_id (orphaned hamlet)
    await db.execute(`
      INSERT INTO hamlets (village_id, name, head_name, sppt_target, pbb_target)
      VALUES (999, 'Orphaned Hamlet', 'No Village', 50, 25000.00)
    `);

    const results = await getHamlets();
    
    // Should only return hamlet with valid village due to inner join
    expect(results).toHaveLength(1);
    expect(results[0].name).toEqual('Hamlet Alpha');
    expect(results[0].village_id).toEqual(villageResult[0].id);
  });
});
