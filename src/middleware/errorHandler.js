export function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  console.error(`[Error] Status: ${status} - Message: ${message}`);
  if (status === 500 && err.stack) {
    console.error(err.stack);
  }

  res.status(status).json({ error: message });
}
