import request from 'supertest';
import pool from '../src/config/db.js';
import app from '../src/app.js';

describe('Pagination Concurrency and Data Mutation Integration Tests', () => {
  let server;
  let agent;
  const TEST_CATEGORY = 'Electronics';

  beforeAll((done) => {
    // Start the server once on an ephemeral port to avoid starting/stopping on every supertest call
    server = app.listen(0, () => {
      agent = request.agent(server);
      done();
    });
  });

  afterAll(async () => {
    await pool.end();
    await new Promise((resolve) => server.close(resolve));
  });

  test('Test A — Insert during pagination does not pollute pagination pages below the cursor', async () => {
    // 1. Get initial total count for the specific category to speed up network walking
    const initialCountRes = await pool.query(
      'SELECT COUNT(*) FROM products WHERE category = $1',
      [TEST_CATEGORY]
    );
    const initialCount = parseInt(initialCountRes.rows[0].count, 10);

    const allIds = new Set();
    let cursor = null;
    let hasMore = true;
    let pageCount = 0;
    let insertedProductId = null;

    try {
      while (hasMore) {
        const response = await agent
          .get('/api/products')
          .query({ limit: 500, category: TEST_CATEGORY, cursor });

        expect(response.status).toBe(200);
        const { data, next_cursor, has_more } = response.body;

        for (const item of data) {
          allIds.add(item.id.toString());
        }

        pageCount++;
        cursor = next_cursor;
        hasMore = has_more;

        // Perform POST insert mid-pagination after the 3rd page has been fetched
        if (pageCount === 3) {
          const insertResponse = await agent
            .post('/api/products')
            .send({
              name: 'Mid-Pagination Insert Product',
              category: TEST_CATEGORY,
              price: 99.99,
            });

          expect(insertResponse.status).toBe(201);
          insertedProductId = insertResponse.body.id.toString();
        }
      }

      // Proves: Inserting a new product (which sorts as newest) during pagination does not
      // shift existing rows or cause duplicates/omissions below the cursor boundary.
      expect(insertedProductId).not.toBeNull();
      expect(allIds.has(insertedProductId)).toBe(false);
      expect(allIds.size).toBe(initialCount);

    } finally {
      // Clean up by deleting the inserted product
      if (insertedProductId) {
        await pool.query('DELETE FROM products WHERE id = $1', [insertedProductId]);
      }
    }
  }, 120000);

  test('Test B — Update during pagination ensures updated item appears exactly once', async () => {
    const allIds = new Set();
    let cursor = null;
    let hasMore = true;
    let pageCount = 0;
    let targetProductId = null;
    let originalProduct = null;

    try {
      while (hasMore) {
        const response = await agent
          .get('/api/products')
          .query({ limit: 500, category: TEST_CATEGORY, cursor });

        expect(response.status).toBe(200);
        const { data, next_cursor, has_more } = response.body;

        // Capture a product on page 2 to update
        if (pageCount === 1 && data.length > 0 && !targetProductId) {
          originalProduct = data[0];
          targetProductId = originalProduct.id.toString();

          // Mutate the product mid-pagination
          const patchResponse = await agent
            .patch(`/api/products/${targetProductId}`)
            .send({
              price: parseFloat((parseFloat(originalProduct.price) + 10.00).toFixed(2)),
            });

          expect(patchResponse.status).toBe(200);
        }

        for (const item of data) {
          const idStr = item.id.toString();
          // Assert that we don't encounter duplicates during pagination walk
          expect(allIds.has(idStr)).toBe(false);
          allIds.add(idStr);
        }

        pageCount++;
        cursor = next_cursor;
        hasMore = has_more;
      }

      // Proves: Updating non-sorting attributes (like price) of a product mid-pagination
      // keeps its sort position intact and ensures it is returned exactly once.
      expect(targetProductId).not.toBeNull();
      expect(allIds.has(targetProductId)).toBe(true);

    } finally {
      // Revert the updated price to restore database consistency
      if (targetProductId && originalProduct) {
        await pool.query(
          'UPDATE products SET price = $1 WHERE id = $2',
          [originalProduct.price, targetProductId]
        );
      }
    }
  }, 120000);
});
