const errorHandler = (err, req, res, next) => {
  console.error("GLOBAL_ERROR_HANDLER:", err);

  const statusCode = err.statusCode || 500;
  let message = "An internal server error occurred.";

  if (err.name === 'ValidationError') {
    // Mongoose validation error
    return res.status(400).json({ error: "Database validation failed", details: err.message });
  }

  if (err.code === 11000) {
    // Duplicate key error
    return res.status(400).json({ error: "Duplicate value provided for a unique field." });
  }

  if (statusCode === 404) {
    message = err.message || "Resource not found.";
  } else if (statusCode === 400) {
    message = err.message || "Bad request.";
  }

  res.status(statusCode).json({ error: message });
};

module.exports = errorHandler;