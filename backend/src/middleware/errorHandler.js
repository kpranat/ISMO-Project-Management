export const errorHandler = (err, req, res, next) => {
  console.error('[Error Handler]:', err);

  if (err.code === 'P2002') {
    const field = err.meta?.target?.[0] || 'field';
    return res.status(409).json({ message: `A record with this ${field} already exists.` });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({ message: 'The requested record was not found.' });
  }

  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error occurred.';

  res.status(statusCode).json({
    message,
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
};

