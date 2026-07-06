export function errorHandler(err, req, res, next) {
  console.error('[Error Middleware]', err);
  if (res.headersSent) {
    return next(err);
  }
  res.status(err.status || 500).json({
    message: err.message || 'Something went wrong'
  });
}

