const path = require('path');
const express = require('express');
const repositorio = require('./data/repositorio');
const { noEncontrado, manejadorErrores } = require('./middleware/errores');

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', cursos: repositorio.listar().length });
});

app.use('/cursos', require('./routes/cursos'));
app.use('/habilitados', require('./routes/habilitados'));

// 404 — ruta no encontrada
app.use(noEncontrado);

// 500 — errores no controlados
app.use(manejadorErrores);

module.exports = app;
