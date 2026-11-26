// Middlewares de manejo de errores.
// Respuestas genéricas que no exponen detalles internos ni stack traces.

// 404 — ruta no encontrada
function noEncontrado(req, res) {
  res.status(404).json({ error: 'ruta no encontrada' });
}

// 500 — error no controlado (Express requiere los 4 argumentos)
// eslint-disable-next-line no-unused-vars
function manejadorErrores(err, req, res, next) {
  res.status(500).json({ error: 'error interno' });
}

module.exports = { noEncontrado, manejadorErrores };
