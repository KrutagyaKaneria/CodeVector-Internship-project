import { faker } from '@faker-js/faker';
import pool from '../config/db.js';
import { categories } from './seedData/categories.js';

const TOTAL_ROWS = 200000;
const BATCH_SIZE = 3000;
const COLLISION_CLUSTER_SIZE = 500;

// Fix collision timestamp
const collisionTimestamp = new Date(Date.now() - Math.floor(Math.random() * 730 * 24 * 60 * 60 * 1000));

function generateProduct(index) {
  let createdAt;
  if (index >= 100000 && index < 100000 + COLLISION_CLUSTER_SIZE) {
    createdAt = collisionTimestamp;
  } else {
    // Random date over the last 2 years (approx 730 days)
    const daysAgo = Math.random() * 730;
    createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
  }

  const name = faker.commerce.productName();
  const category = categories[Math.floor(Math.random() * categories.length)];
  const price = parseFloat((Math.random() * (500 - 5) + 5).toFixed(2));

  return {
    name,
    category,
    price,
    created_at: createdAt,
    updated_at: createdAt,
  };
}

async function runSeed() {
  console.log(`Starting to seed ${TOTAL_ROWS} products...`);
  const client = await pool.connect();

  try {
    // Start transaction
    await client.query('BEGIN');

    let currentBatch = [];
    let totalInserted = 0;

    for (let i = 0; i < TOTAL_ROWS; i++) {
      currentBatch.push(generateProduct(i));

      if (currentBatch.length === BATCH_SIZE || i === TOTAL_ROWS - 1) {
        const placeholders = [];
        const values = [];
        let paramIdx = 1;

        for (const prod of currentBatch) {
          placeholders.push(`($${paramIdx}, $${paramIdx+1}, $${paramIdx+2}, $${paramIdx+3}, $${paramIdx+4})`);
          values.push(prod.name, prod.category, prod.price, prod.created_at, prod.updated_at);
          paramIdx += 5;
        }

        const query = `INSERT INTO products (name, category, price, created_at, updated_at) VALUES ${placeholders.join(', ')}`;
        await client.query(query, values);

        totalInserted += currentBatch.length;
        currentBatch = [];

        if (totalInserted % 20000 === 0 || totalInserted === TOTAL_ROWS) {
          console.log(`Progress: ${totalInserted} / ${TOTAL_ROWS} rows inserted.`);
        }
      }
    }

    // Commit transaction
    await client.query('COMMIT');
    console.log('Seeding completed successfully!');
    console.log(`COLLISION TIMESTAMP: ${collisionTimestamp.toISOString()}`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Seeding failed, transaction rolled back:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runSeed();
