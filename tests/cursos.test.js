const request = require('supertest');
const app = require('../src/app');

// Campos esperados en la respuesta de listado (sin prerequisites)
const CAMPOS_LISTADO = ['id', 'name', 'credits', 'cycle', 'type'];

describe('GET /cursos/:codigo', () => {
  // Requisito 2.1 — código existente devuelve curso con prerequisites resueltos
  test('2.1 código existente responde 200 con el curso y sus prerequisites', async () => {
    const res = await request(app).get('/cursos/1INF30');

    expect(res.status).toBe(200);
    expect(res.body.id).toBe('1INF30');
    expect(res.body.name).toBe('Programación 3');
    expect(res.body.credits).toBe(5.0);
    expect(res.body.cycle).toBe(6);
    expect(res.body.type).toBe('obligatorio');
    expect(Array.isArray(res.body.prerequisites)).toBe(true);
    expect(res.body.prerequisites).toHaveLength(1);
    expect(res.body.prerequisites[0]).toEqual({ id: '1INF25', name: 'Programación 2' });
  });

  test('2.1 cada prerequisite tiene id y name resueltos (no solo código)', async () => {
    const res = await request(app).get('/cursos/1INF30');

    expect(res.status).toBe(200);
    for (const prereq of res.body.prerequisites) {
      expect(prereq).toHaveProperty('id');
      expect(prereq).toHaveProperty('name');
    }
  });

  test('2.1 curso con prerequisites vacíos devuelve arreglo vacío', async () => {
    const res = await request(app).get('/cursos/1INF25'); // Programación 2, sin prereqs en ciclos 5-10

    expect(res.status).toBe(200);
    expect(res.body.id).toBe('1INF25');
    expect(Array.isArray(res.body.prerequisites)).toBe(true);
    expect(res.body.prerequisites).toHaveLength(0);
  });

  // Requisito 2.2 — código inexistente responde 404
  test('2.2 código inexistente responde 404 con error', async () => {
    const res = await request(app).get('/cursos/NOEXISTE');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'curso no encontrado' });
  });

  test('2.2 código con formato diferente no encontrado responde 404', async () => {
    const res = await request(app).get('/cursos/0000');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'curso no encontrado' });
  });
});

describe('GET /cursos', () => {
  // Requisito 1.1 — devuelve todos los cursos con los campos requeridos
  test('1.1 responde 200 con todos los cursos y los campos requeridos', async () => {
    const res = await request(app).get('/cursos');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);

    // Cada elemento debe tener exactamente los campos id, name, credits, cycle y type
    for (const curso of res.body) {
      for (const campo of CAMPOS_LISTADO) {
        expect(curso).toHaveProperty(campo);
      }
    }
  });

  test('1.1 devuelve los 87 cursos del JSON', async () => {
    const res = await request(app).get('/cursos');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(87);
  });

  // Requisito 1.2 — filtro por ciclo válido (5-10)
  test('1.2 con ?ciclo=6 devuelve solo los cursos del ciclo 6', async () => {
    const res = await request(app).get('/cursos?ciclo=6');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);

    for (const curso of res.body) {
      expect(curso.cycle).toBe(6);
    }
  });

  test('1.2 con ?ciclo=5 devuelve solo los cursos del ciclo 5', async () => {
    const res = await request(app).get('/cursos?ciclo=5');

    expect(res.status).toBe(200);
    expect(res.body.every((c) => c.cycle === 5)).toBe(true);
  });

  test('1.2 con ?ciclo=10 devuelve solo los cursos del ciclo 10', async () => {
    const res = await request(app).get('/cursos?ciclo=10');

    expect(res.status).toBe(200);
    expect(res.body.every((c) => c.cycle === 10)).toBe(true);
  });

  // Requisito 1.3 — ciclo inválido → 400
  test('1.3 con ?ciclo=4 (fuera de rango) responde 400 con mensaje de error', async () => {
    const res = await request(app).get('/cursos?ciclo=4');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'ciclo debe ser un entero entre 5 y 10' });
  });

  test('1.3 con ?ciclo=11 (fuera de rango) responde 400', async () => {
    const res = await request(app).get('/cursos?ciclo=11');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'ciclo debe ser un entero entre 5 y 10' });
  });

  test('1.3 con ?ciclo=abc (no numérico) responde 400', async () => {
    const res = await request(app).get('/cursos?ciclo=abc');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'ciclo debe ser un entero entre 5 y 10' });
  });

  test('1.3 con ?ciclo=5.5 (no entero) responde 400', async () => {
    const res = await request(app).get('/cursos?ciclo=5.5');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'ciclo debe ser un entero entre 5 y 10' });
  });
});
