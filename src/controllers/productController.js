import pool from '../config/db.js';
import { getProducts } from '../repositories/productRepository.js';

export async function listProducts(req, res, next) {
  try {
    const result = await getProducts(req.validatedQuery);
    res.status(200).json({
      data: result.rows,
      next_cursor: result.nextCursor,
      has_more: result.hasMore,
    });
  } catch (error) {
    next(error);
  }
}

export async function getCategories(req, res, next) {
  try {
    const { rows } = await pool.query('SELECT DISTINCT category FROM products ORDER BY category ASC');
    const categories = rows.map(r => r.category);
    res.status(200).json(categories);
  } catch (error) {
    next(error);
  }
}

export async function getProductById(req, res, next) {
  try {
    const { id } = req.params;

    // Validate if the ID is a valid number representation
    if (isNaN(parseInt(id, 10)) || parseInt(id, 10) <= 0) {
      const err = new Error('Product not found');
      err.status = 404;
      return next(err);
    }

    const { rows } = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    
    if (rows.length === 0) {
      const err = new Error('Product not found');
      err.status = 404;
      return next(err);
    }

    res.status(200).json(rows[0]);
  } catch (error) {
    next(error);
  }
}
