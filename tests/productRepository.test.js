import pool from '../src/config/db.js';
import { getProducts } from '../src/repositories/productRepository.js';

describe('Product Repository Keyset Pagination', () => {
  afterAll(async () => {
    await pool.end();
  });

  test('walks the entire table and verifies row count, uniqueness, and collision cluster coverage', async () => {
    // 1. Get total count
    const countRes = await pool.query('SELECT COUNT(*) FROM products');
    const totalCount = parseInt(countRes.rows[0].count, 10);
    expect(totalCount).toBeGreaterThan(0);

    // 2. Query for the timestamp-collision cluster
    const clusterRes = await pool.query(`
      SELECT created_at 
      FROM products 
      GROUP BY created_at 
      HAVING COUNT(*) >= 500
      LIMIT 1
    `);
    expect(clusterRes.rows.length).toBe(1);
    const collisionTimestamp = clusterRes.rows[0].created_at;

    // Fetch all IDs in the collision cluster
    const clusterIdsRes = await pool.query(
      'SELECT id FROM products WHERE created_at = $1',
      [collisionTimestamp]
    );
    const clusterIds = new Set(clusterIdsRes.rows.map(r => r.id.toString()));
    expect(clusterIds.size).toBeGreaterThanOrEqual(500);

    // 3. Walk the table
    const allIds = new Set();
    let cursor = null;
    let hasMore = true;
    let pageCount = 0;
    const seenClusterIds = new Set();

    while (hasMore) {
      const result = await getProducts({ limit: 500, cursor });
      
      for (const row of result.rows) {
        const idStr = row.id.toString();
        
        // Assert no duplicates are encountered during pagination
        expect(allIds.has(idStr)).toBe(false);
        allIds.add(idStr);

        // Check if this row is part of the collision cluster
        if (clusterIds.has(idStr)) {
          seenClusterIds.add(idStr);
        }
      }

      cursor = result.nextCursor;
      hasMore = result.hasMore;
      pageCount++;
    }

    // 4. Assert correctness
    expect(allIds.size).toBe(totalCount);
    expect(seenClusterIds.size).toBe(clusterIds.size);

    console.log(`Success: Walked ${allIds.size} products over ${pageCount} pages. Verified all ${seenClusterIds.size} collision cluster items.`);
  }, 180000);
});
