const express = require('express');
const { validarCuerpoHabilitados } = require('../habilitados/validacion');
const { calcularHabilitados } = require('../habilitados/servicio');

const router = express.Router();

// POST /habilitados — cursos habilitados dado el historial aprobado (Req. 1.1).
//
// Flujo:
//   1. validarCuerpoHabilitados responde 400/413 con { error } si la entrada
//      es inválida (Req. 2.1, 3.1, 3.2, 4.1–4.3).
//   2. calcularHabilitados calcula los cursos habilitados (Req. 1.1–1.5).
//   3. Cualquier fallo inesperado se delega al manejador central, que responde
//      500 con {"error": "..."} sin stack trace ni rutas internas (Req. 3.3).
router.post(
  '/',
  validarCuerpoHabilitados,
  (req, res, next) => {
    try {
      const habilitados = calcularHabilitados(req.aprobados);
      return res.status(200).json(habilitados);
    } catch (err) {
      return next(err);
    }
  }
);

module.exports = router;
