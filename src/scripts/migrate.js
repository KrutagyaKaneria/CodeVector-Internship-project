import fs from 'fs';
import path from 'path';
import pool from '../config/db.js';

async function runMigrations() {
  const migrationsDir = path.join(process.cwd(), 'migrations');
  
  try {
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    console.log(`Found ${files.length} migration files.`);

    for (const file of files) {
      console.log(`Running migration: ${file}`);
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      // Execute the migration query against the database pool
      await pool.query(sql);
      console.log(`Migration ${file} completed successfully.`);
    }

    console.log('All migrations completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    // Close the pool connection to exit the process cleanly
    await pool.end();
  }
}

runMigrations();
