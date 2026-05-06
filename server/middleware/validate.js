const validate = (schema) => (req, res, next) => {
  try {
    const parsedBody = schema.parse(req.body);
    req.body = parsedBody; // Replace req.body with the validated and possibly cast data
    next();
  } catch (error) {
    if (error.errors) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }
    next(error);
  }
};

module.exports = { validate };