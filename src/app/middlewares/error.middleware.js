export function errorMiddleware(err, req, res, next) {
  if (err.name === 'ZodError') {
    return res.status(400).json({
      success: false,
      error: { code: 'SOLICITUD_INVALIDA', message: err.issues?.[0]?.message || 'Los datos enviados no son válidos.' },
    });
  }
  if (err.statusCode) {
    return res.status(err.statusCode).json({ success: false, error: { code: err.code, message: err.message } });
  }
  req.log?.error(err);
  return res.status(500).json({ success: false, error: { code: 'ERROR_INTERNO', message: 'Ocurrió un error inesperado.' } });
}