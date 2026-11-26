'use strict';

/**
 * Pruebas de integración HTTP para POST /habilitados
 *
 * Requisitos cubiertos: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 3.2, 4.1, 4.2, 4.4
 */

const request = require('supertest');
const app = require('../src/app');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Genera un arreglo de `n` códigos con el patrón /^[A-Z0-9]{6}$/ que NO
 * existen en el catálogo.  Se usa solo para disparar el límite de volumen
 * ANTES de que se verifique el catálogo (el límite se chequea en O(1)).
 * El límite máximo es 87, así que con 5 000 debería responder 413 en < 1 s.
 */
function generarCodigosGrandes(n) {
  const codigos = [];
  for (let i = 0; i < n; i++) {
    // Patrón válido: 6 caracteres A-Z0-9
    const sufijo = String(i).padStart(5, '0').replace(/[^A-Z0-9]/g, '0');
    codigos.push('A' + sufijo);
  }
  return codigos;
}

// ---------------------------------------------------------------------------
// Caso base (Req. 1.1)
// ---------------------------------------------------------------------------

describe('POST /habilitados — caso base (Req. 1.1)', () => {
  test('aprobados=["1INF25","1INF27","1INF49"] → 200, exactamente 27 cursos', async () => {
    const res = await request(app)
      .post('/habilitados')
      .send({ aprobados: ['1INF25', '1INF27', '1INF49'] });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(27);
  });

  test('el resultado incluye 1INF29, 1INF30, 1INF31 y 1INF32 (Req. 1.1)', async () => {
    const res = await request(app)
      .post('/habilitados')
      .send({ aprobados: ['1INF25', '1INF27', '1INF49'] });

    const ids = res.body.map((c) => c.id);
    expect(ids).toContain('1INF29');
    expect(ids).toContain('1INF30');
    expect(ids).toContain('1INF31');
    expect(ids).toContain('1INF32');
  });
});

// ---------------------------------------------------------------------------
// Lista vacía (Req. 4.4 — sin prerequisitos)
// ---------------------------------------------------------------------------

describe('POST /habilitados — lista vacía (Req. 4.4)', () => {
  test('aprobados=[] → 200 con cursos sin prerequisitos', async () => {
    const res = await request(app)
      .post('/habilitados')
      .send({ aprobados: [] });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    // Con lista vacía solo se habilitan los 26 cursos sin prerequisitos (Req. 4.4)
    expect(res.body).toHaveLength(26);
    for (const curso of res.body) {
      expect(typeof curso.id).toBe('string');
      expect(typeof curso.name).toBe('string');
    }
  });
});

// ---------------------------------------------------------------------------
// Duplicados (Req. 1.4)
// ---------------------------------------------------------------------------

describe('POST /habilitados — duplicados (Req. 1.4)', () => {
  test('códigos duplicados en aprobados → 200, resultado igual que sin duplicados', async () => {
    const sinDup = await request(app)
      .post('/habilitados')
      .send({ aprobados: ['1INF25'] });

    const conDup = await request(app)
      .post('/habilitados')
      .send({ aprobados: ['1INF25', '1INF25', '1INF25'] });

    expect(sinDup.status).toBe(200);
    expect(conDup.status).toBe(200);

    // Mismo conjunto de ids en el mismo orden
    expect(conDup.body.map((c) => c.id)).toEqual(sinDup.body.map((c) => c.id));
  });

  test('cursos habilitados no incluyen los ya aprobados (Req. 1.4)', async () => {
    const res = await request(app)
      .post('/habilitados')
      .send({ aprobados: ['1INF25'] });

    const ids = res.body.map((c) => c.id);
    expect(ids).not.toContain('1INF25');
  });
});

// ---------------------------------------------------------------------------
// Código inexistente en el catálogo → 400
// ---------------------------------------------------------------------------

describe('POST /habilitados — código inexistente (Req. 4.3)', () => {
  test('código con formato válido pero no en catálogo → 400', async () => {
    const res = await request(app)
      .post('/habilitados')
      .send({ aprobados: ['1INF99'] }); // formato /^[A-Z0-9]{6}$/ pero no existe

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});

// ---------------------------------------------------------------------------
// Límite de volumen (Req. 2.1 / 2.2) — 5 000 elementos → 413 en < 1 s
// ---------------------------------------------------------------------------

describe('POST /habilitados — límite de volumen (Req. 2.1 / 2.2)', () => {
  test('lista de 5 000 códigos → 413 en menos de 1 000 ms', async () => {
    const codigos = generarCodigosGrandes(5000);
    const inicio = Date.now();

    const res = await request(app)
      .post('/habilitados')
      .send({ aprobados: codigos });

    const duracion = Date.now() - inicio;

    expect(res.status).toBe(413);
    expect(res.body).toHaveProperty('error');
    expect(duracion).toBeLessThan(1000);
  });
});

// ---------------------------------------------------------------------------
// Seguridad — inyección de script (Req. 3.2)
// ---------------------------------------------------------------------------

describe('POST /habilitados — seguridad XSS (Req. 3.2)', () => {
  test('código con <script> → 400 y body NO contiene <script>', async () => {
    const res = await request(app)
      .post('/habilitados')
      .send({ aprobados: ['1INF30<script>'] });

    expect(res.status).toBe(400);
    // La respuesta no debe reflejar el valor enviado
    const cuerpo = JSON.stringify(res.body);
    expect(cuerpo).not.toContain('<script>');
  });
});

// ---------------------------------------------------------------------------
// Validación de tipo (Req. 4.1 — string no array)
// ---------------------------------------------------------------------------

describe('POST /habilitados — aprobados como string (Req. 4.1)', () => {
  test('{"aprobados":"1INF25"} → 400', async () => {
    const res = await request(app)
      .post('/habilitados')
      .send({ aprobados: '1INF25' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});

// ---------------------------------------------------------------------------
// Validación de elementos no-string (Req. 4.2)
// ---------------------------------------------------------------------------

describe('POST /habilitados — elemento no-string en arreglo (Req. 4.2)', () => {
  test('elemento número en arreglo → 400', async () => {
    const res = await request(app)
      .post('/habilitados')
      .send({ aprobados: [1, 2, 3] });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('elemento null en arreglo → 400', async () => {
    const res = await request(app)
      .post('/habilitados')
      .send({ aprobados: [null] });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});
