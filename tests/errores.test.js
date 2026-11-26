const request = require('supertest');
const express = require('express');
const { noEncontrado, manejadorErrores } = require('../src/middleware/errores');

// App de prueba: usa los middlewares reales de producción con una ruta
// que lanza un error intencionalmente, para ejercitar el manejador.
function buildAppConRutaError() {
  const app = express();
  app.get('/test-error', (req, res, next) => {
    next(new Error('fallo inesperado: detalle interno en /alguna/ruta'));
  });
  app.use(noEncontrado);
  app.use(manejadorErrores);
  return app;
}

describe('Requirement 3.1 — manejo seguro de errores', () => {
  // Requisito 3.1 — error no controlado → 500 con mensaje genérico
  test('3.1 error no controlado responde 500 con cuerpo genérico', async () => {
    const res = await request(buildAppConRutaError()).get('/test-error');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'error interno' });
  });

  test('3.1 la respuesta de error no incluye stack trace ni detalles internos', async () => {
    const res = await request(buildAppConRutaError()).get('/test-error');

    expect(res.status).toBe(500);
    const cuerpo = JSON.stringify(res.body);
    expect(cuerpo).not.toMatch(/stack/i);
    expect(cuerpo).not.toMatch(/fallo inesperado/);
    expect(cuerpo).not.toMatch(/\\w:\\\\|\/usr\/|node_modules/); // rutas de archivo
  });

  // 404 handler — ruta no encontrada en la app real
  test('3.1 ruta inexistente responde 404 en la app real', async () => {
    const app = require('../src/app');
    const res = await request(app).get('/ruta-que-no-existe');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'ruta no encontrada' });
  });
});
