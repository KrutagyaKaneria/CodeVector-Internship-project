import { decodeCursor } from '../utils/cursor.js';

export function validateQuery(req, res, next) {
  let { limit = 20, category, cursor } = req.query;

  let parsedLimit = parseInt(limit, 10);
  if (isNaN(parsedLimit) || parsedLimit <= 0) {
    const err = new Error('Invalid limit: must be a positive integer');
    err.status = 400;
    return next(err);
  }

  if (parsedLimit > 100) {
    parsedLimit = 100;
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
