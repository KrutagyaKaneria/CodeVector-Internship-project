export function validateCreateBody(req, res, next) {
  const { name, category, price } = req.body;
  const invalidFields = [];

  if (typeof name !== 'string' || name.trim() === '') {
    invalidFields.push("name (must be a non-empty string)");
  }

  if (typeof category !== 'string' || category.trim() === '') {
    invalidFields.push("category (must be a non-empty string)");
  }

  if (typeof price !== 'number' || isNaN(price) || price <= 0) {
    invalidFields.push("price (must be a positive number)");
  }

  if (invalidFields.length > 0) {
    const err = new Error(`Invalid or missing fields: ${invalidFields.join(', ')}`);
    err.status = 400;
    return next(err);
  }

  req.validatedBody = {
    name: name.trim(),
    category: category.trim(),
    price: price,
  };

  next();
}

export function validateUpdateBody(req, res, next) {
  const { name, category, price } = req.body;
  const invalidFields = [];
  const bodyKeys = Object.keys(req.body || {});

  if (bodyKeys.length === 0) {
    const err = new Error('Request body cannot be empty');
    err.status = 400;
    return next(err);
  }

  const allowedKeys = ['name', 'category', 'price'];
  const extraKeys = bodyKeys.filter(k => !allowedKeys.includes(k));
  if (extraKeys.length > 0) {
    const err = new Error(`Extraneous fields not allowed: ${extraKeys.join(', ')}`);
    err.status = 400;
    return next(err);
  }

  const validatedBody = {};

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim() === '') {
      invalidFields.push("name (must be a non-empty string)");
    } else {
      validatedBody.name = name.trim();
    }
  }

  if (category !== undefined) {
    if (typeof category !== 'string' || category.trim() === '') {
      invalidFields.push("category (must be a non-empty string)");
    } else {
      validatedBody.category = category.trim();
    }
  }

  if (price !== undefined) {
    if (typeof price !== 'number' || isNaN(price) || price <= 0) {
      invalidFields.push("price (must be a positive number)");
    } else {
      validatedBody.price = price;
    }
  }

  if (invalidFields.length > 0) {
    const err = new Error(`Invalid fields: ${invalidFields.join(', ')}`);
    err.status = 400;
    return next(err);
  }

  if (Object.keys(validatedBody).length === 0) {
    const err = new Error('At least one field (name, category, price) must be provided for update');
    err.status = 400;
    return next(err);
  }

  req.validatedBody = validatedBody;
  next();
}
