export const validate = (schema) => async (req, res, next) => {
  try {
    const data = {
      body: req.body,
      query: req.query,
      params: req.params,
      cookies: req.cookies,
    };
    await schema.parseAsync(data);
    next();
  } catch (error) {
    if (error.name === 'ZodError') {
      const errors = error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return res.status(400).json({
        status: 'error',
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        errors,
      });
    }
    next(error);
  }
};