const request = require('supertest');
const express = require('express');
const repositorio = require('../src/data/repositorio');
const {
  LIMITE_APROBADOS,
  validarAprobados,
  validarCuerpoHabilitados,
} = require('../src/habilitados/validacion');

// App de prueba: monta solo la capa de validación (el endpoint real llega
// en la tarea 3). Si la validación pasa, responde con los códigos validados.
function buildApp() {
  const app = express();
  app.use(express.json());
  app.post('/habilitados', validarCuerpoHabilitados, (req, res) => {
    res.status(200).json({ aprobados: req.aprobados });
  });
  return app;
}

const CODIGOS_VALIDOS = repositorio.listar().map((curso) => curso.id);

describe('validarAprobados — tipo y estructura del cuerpo (Req. 4.1 y 4.3)', () => {
  test('cuerpo undefined responde 400', () => {
    const r = validarAprobados(undefined);
    expect(r.valido).toBe(false);
    expect(r.estado).toBe(400);
  });

  test('cuerpo null responde 400', () => {
    const r = validarAprobados(null);
    expect(r.valido).toBe(false);
    expect(r.estado).toBe(400);
  });

  test('cuerpo que es un arreglo (sin campo aprobados) responde 400', () => {
    const r = validarAprobados(['1INF25']);
    expect(r.valido).toBe(false);
    expect(r.estado).toBe(400);
  });

  test('campo aprobados faltante responde 400', () => {
    const r = validarAprobados({});
    expect(r.valido).toBe(false);
    expect(r.estado).toBe(400);
  });

  test.each([
    ['cadena', '1INF25'],
    ['número', 42],
    ['nulo', null],
    ['objeto', { 0: '1INF25' }],
    ['booleano', true],
  ])('aprobados = %s responde 400 con mensaje de lista esperada', (_nombre, valor) => {
    const r = validarAprobados({ aprobados: valor });
    expect(r.valido).toBe(false);
    expect(r.estado).toBe(400);
    expect(r.error).toBe('aprobados debe ser una lista (arreglo) de códigos de curso');
  });
});

describe('validarAprobados — límite de volumen (Req. 2.1, 2.2 y 2.3)', () => {
  test('88 códigos responde 413 con mensaje del límite máximo', () => {
    const lista = [...CODIGOS_VALIDOS, '1INF25']; // 88 elementos
    const r = validarAprobados({ aprobados: lista });
    expect(r.valido).toBe(false);
    expect(r.estado).toBe(413);
    expect(r.error).toContain(String(LIMITE_APROBADOS));
  });

  test('5 000 códigos responden 413 en menos de 1 segundo', () => {
    const lista = Array.from({ length: 5000 }, () => '1INF25');
    const inicio = process.hrtime.bigint();
    const r = validarAprobados({ aprobados: lista });
    const ms = Number(process.hrtime.bigint() - inicio) / 1e6;

    expect(r.valido).toBe(false);
    expect(r.estado).toBe(413);
    expect(ms).toBeLessThan(1000);
  });

  test('87 códigos válidos pasan la validación en menos de 1 segundo', () => {
    const inicio = process.hrtime.bigint();
    const r = validarAprobados({ aprobados: CODIGOS_VALIDOS });
    const ms = Number(process.hrtime.bigint() - inicio) / 1e6;

    expect(r.valido).toBe(true);
    expect(r.aprobados).toHaveLength(87);
    expect(ms).toBeLessThan(1000);
  });
});

describe('validarAprobados — validación de cada código (Req. 3.1, 3.2 y 4.2)', () => {
  test.each([
    ['1INF30<script>'],
    ['1inf25'],        // minúsculas
    ['1INF2'],         // 5 caracteres
    ['1INF255'],       // 7 caracteres
    ['1IN 25'],        // espacio
    ['1INF-5'],         // guion
  ])('código con formato inválido %j responde 400 sin repetir el valor', (codigo) => {
    const r = validarAprobados({ aprobados: ['1INF25', codigo] });
    expect(r.valido).toBe(false);
    expect(r.estado).toBe(400);
    expect(r.error).not.toContain(codigo);
  });

  test('elemento no-string (número) responde 400', () => {
    const r = validarAprobados({ aprobados: [123456] });
    expect(r.valido).toBe(false);
    expect(r.estado).toBe(400);
  });

  test('elemento no-string (objeto) responde 400', () => {
    const r = validarAprobados({ aprobados: [{ codigo: '1INF25' }] });
    expect(r.valido).toBe(false);
    expect(r.estado).toBe(400);
  });

  test('código con formato válido pero fuera del catálogo responde 400', () => {
    const r = validarAprobados({ aprobados: ['ZZZZZZ'] });
    expect(r.valido).toBe(false);
    expect(r.estado).toBe(400);
    expect(r.error).toBe('algún código no existe en el catálogo de cursos');
  });
});

describe('validarAprobados — casos válidos', () => {
  test('lista vacía pasa la validación (Req. 4.4)', () => {
    const r = validarAprobados({ aprobados: [] });
    expect(r.valido).toBe(true);
    expect(r.aprobados).toEqual([]);
  });

  test('deduplica códigos repetidos', () => {
    const r = validarAprobados({ aprobados: ['1INF25', '1INF25', '1INF27'] });
    expect(r.valido).toBe(true);
    expect(r.aprobados).toEqual(['1INF25', '1INF27']);
  });
});

describe('middleware validarCuerpoHabilitados — integración HTTP', () => {
  const app = buildApp();

  test('cuerpo válido pasa al siguiente handler con req.aprobados', async () => {
    const res = await request(app)
      .post('/habilitados')
      .send({ aprobados: ['1INF25', '1INF25'] });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ aprobados: ['1INF25'] });
  });

  test('JSON malformado responde 400 (Req. 4.3)', async () => {
    const res = await request(app)
      .post('/habilitados')
      .set('Content-Type', 'application/json')
      .send('{"aprobados": [');

    expect(res.status).toBe(400);
  });

  test('aprobados como cadena responde 400 (Req. 4.1)', async () => {
    const res = await request(app)
      .post('/habilitados')
      .send({ aprobados: '1INF25' });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('lista');
  });

  test('5000 códigos responden 413 en menos de 1 segundo (Req. 2.2)', async () => {
    const lista = Array.from({ length: 5000 }, (_, i) =>
      CODIGOS_VALIDOS[i % CODIGOS_VALIDOS.length],
    );
    const inicio = Date.now();
    const res = await request(app).post('/habilitados').send({ aprobados: lista });
    const ms = Date.now() - inicio;

    expect(res.status).toBe(413);
    expect(res.body.error).toContain('87');
    expect(ms).toBeLessThan(1000);
  });

  test('código inyectado 1INF30<script> responde 400 sin reflejar la entrada (Req. 3.2)', async () => {
    const res = await request(app)
      .post('/habilitados')
      .send({ aprobados: ['1INF30<script>'] });

    expect(res.status).toBe(400);
    expect(res.text).not.toContain('<script>');
    expect(res.text).not.toContain('1INF30<script>');
  });

  test('elemento numérico responde 400 (Req. 4.2)', async () => {
    const res = await request(app)
      .post('/habilitados')
      .send({ aprobados: [42] });

    expect(res.status).toBe(400);
  });

  test('87 códigos válidos responden 200 en menos de 1 segundo (Req. 2.3)', async () => {
    const inicio = Date.now();
    const res = await request(app).post('/habilitados').send({ aprobados: CODIGOS_VALIDOS });
    const ms = Date.now() - inicio;

    expect(res.status).toBe(200);
    expect(ms).toBeLessThan(1000);
  });
});
