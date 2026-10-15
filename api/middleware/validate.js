// Validates and replaces req.body with the parsed (trimmed, lowercased, typed) data
export default (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      message: 'Invalid input',
      errors: result.error.issues.map(({ path, message }) => ({
        field: path.join('.'),
        message,
      })),
    });
  }
  req.body = result.data;
  next();
};