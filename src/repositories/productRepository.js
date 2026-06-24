import pool from '../config/db.js';
import { encodeCursor, decodeCursor } from '../utils/cursor.js';

export async function getProducts({ category, limit = 50, cursor } = {}) {
  const values = [];
  const conditions = [];

  if (category) {
    values.push(category);
    conditions.push(`category = $${values.length}`);
  }

  if (cursor) {
    const decoded = decodeCursor(cursor);
    values.push(decoded.createdAt);
    const createdAtParam = `$${values.length}`;
    values.push(decoded.id);
    const idParam = `$${values.length}`;

    conditions.push(`(created_at, id) < (${createdAtParam}, ${idParam})`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  values.push(limit + 1);
  const limitParam = `$${values.length}`;

  const query = `
    SELECT id, name, category, price, created_at, updated_at
    FROM products
    ${whereClause}
    ORDER BY created_at DESC, id DESC
    LIMIT ${limitParam}
  `;

  const { rows } = await pool.query(query, values);

  const hasMore = rows.length > limit;
  const resultRows = hasMore ? rows.slice(0, limit) : rows;

  let nextCursor = null;
  if (resultRows.length > 0 && hasMore) {
    const lastRow = resultRows[resultRows.length - 1];
    nextCursor = encodeCursor({
      createdAt: lastRow.created_at,
      id: lastRow.id,
    });
  }

  return {
    rows: resultRows,
    nextCursor,
    hasMore,
  };
}
