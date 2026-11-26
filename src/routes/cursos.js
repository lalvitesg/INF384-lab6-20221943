const express = require('express');
const repositorio = require('../data/repositorio');

const router = express.Router();

const MENSAJE_CICLO_INVALIDO = 'ciclo debe ser un entero entre 5 y 10';

// Valida que `ciclo` sea un entero entre 5 y 10.
// Devuelve el entero parseado o null si es inválido.
function parsearCiclo(valor) {
  if (!/^\d+$/.test(valor)) return null;
  const numero = Number(valor);
  if (!Number.isInteger(numero) || numero < 5 || numero > 10) return null;
  return numero;
}

// GET /cursos/:codigo — devuelve el curso con sus requisitos resueltos
router.get('/:codigo', (req, res) => {
  const curso = repositorio.obtener(req.params.codigo);
  if (!curso) {
    return res.status(404).json({ error: 'curso no encontrado' });
  }

  const prerequisites = curso.prerequisites
    .map((codigo) => repositorio.obtener(codigo))
    .filter(Boolean)
    .map((prereq) => ({ id: prereq.id, name: prereq.name }));

  return res.json({
    id: curso.id,
    name: curso.name,
    credits: curso.credits,
    cycle: curso.cycle,
    type: curso.type,
    prerequisites,
  });
});

// GET /cursos (con filtro opcional ?ciclo=N)
router.get('/', (req, res) => {
  if (req.query.ciclo !== undefined) {
    const ciclo = parsearCiclo(req.query.ciclo);
    if (ciclo === null) {
      return res.status(400).json({ error: MENSAJE_CICLO_INVALIDO });
    }
    return res.json(repositorio.listarPorCiclo(ciclo));
  }
  return res.json(repositorio.listar());
});

module.exports = router;
