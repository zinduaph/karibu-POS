// Validates and replaces the selected request value with the parsed data.
export default (schema, source = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    return res.status(400).json({
      message: 'Invalid input',
      errors: result.error.issues.map(({ path, message }) => ({
        field: path.join('.'),
        message,
      })),
    });
  }
  req[source] = result.data;
  next();
};