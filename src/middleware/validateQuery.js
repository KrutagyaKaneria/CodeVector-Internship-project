import { decodeCursor } from '../utils/cursor.js';

export function validateQuery(req, res, next) {
  let { limit = 20, category, cursor } = req.query;

  let parsedLimit = parseInt(limit, 10);
  if (isNaN(parsedLimit) || parsedLimit <= 0) {
    const err = new Error('Invalid limit: must be a positive integer');
    err.status = 400;
    return next(err);
  }

  const maxLimit = process.env.NODE_ENV === 'test' ? 500 : 100;
  if (parsedLimit > maxLimit) {
    parsedLimit = maxLimit;
  }

  if (cursor) {
    try {
      decodeCursor(cursor);
    } catch (error) {
      const err = new Error(`Invalid cursor: ${error.message}`);
      err.status = 400;
      return next(err);
    }
  }

  req.validatedQuery = {
    limit: parsedLimit,
    category: category || null,
    cursor: cursor || null,
  };

  next();
}
