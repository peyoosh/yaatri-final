const errorHandler = (err, req, res, next) => {
  console.error("GLOBAL_ERROR_HANDLER:", err);

  const statusCode = err.statusCode || 500;
  const defaultMessage = "An internal server error occurred.";
  const message = err.message || defaultMessage;
  const errorCode = err.errorCode || err.code || `${req.method}_${req.path.replace(/\W+/g, '_').toUpperCase()}_${statusCode}`;

  const payload = {
    error: message,
    errorCode,
    errorSource: err.errorSource || `${req.method} ${req.path}`,
    details: err.details || (err.name === 'ValidationError' ? err.errors : undefined),
  };

  if (process.env.NODE_ENV !== 'production') {
    payload.stack = err.stack;
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Database validation failed',
      errorCode: 'VALIDATION_ERROR',
      errorSource: payload.errorSource,
      details: err.message,
      stack: payload.stack,
    });
  }

  if (err.code === 11000) {
    return res.status(400).json({
      error: 'Duplicate value provided for a unique field.',
      errorCode: 'DUPLICATE_KEY_ERROR',
      errorSource: payload.errorSource,
      details: err.keyValue || undefined,
      stack: payload.stack,
    });
  }

  res.status(statusCode).json(payload);
};

module.exports = errorHandler;