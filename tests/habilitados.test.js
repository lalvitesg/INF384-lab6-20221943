const { calcularHabilitados } = require('../src/habilitados/servicio');
const repositorio = require('../src/data/repositorio');

// Campos esperados en cada curso devuelto (misma forma que GET /cursos)
const CAMPOS_LISTADO = ['id', 'name', 'credits', 'cycle', 'type'];

const APROBADOS_EJEMPLO = ['1INF25', '1INF27', '1INF49'];

describe('calcularHabilitados(aprobados)', () => {
  // Requisito 1.1 — ejemplo de la especificación: 27 cursos habilitados
  test('1.1 con los aprobados del ejemplo devuelve exactamente 27 cursos', () => {
    const habilitados = calcularHabilitados(APROBADOS_EJEMPLO);

    expect(habilitados).toHaveLength(27);

    const codigos = habilitados.map((c) => c.id);
    expect(codigos).toContain('1INF29');
    expect(codigos).toContain('1INF30');
    expect(codigos).toContain('1INF31');
    expect(codigos).toContain('1INF32');
  });

  // Requisito 1.5 — misma forma que GET /cursos: solo id, name, credits, cycle y type
  test('1.5 cada curso devuelto tiene exactamente los campos del listado', () => {
    const habilitados = calcularHabilitados(APROBADOS_EJEMPLO);

    for (const curso of habilitados) {
      expect(Object.keys(curso).sort()).toEqual([...CAMPOS_LISTADO].sort());
    }
  });

  test('1.5 los valores coinciden con el catálogo del repositorio', () => {
    const habilitados = calcularHabilitados(APROBADOS_EJEMPLO);

    for (const curso of habilitados) {
      const original = repositorio.obtener(curso.id);
      expect(curso).toEqual({
        id: original.id,
        name: original.name,
        credits: original.credits,
        cycle: original.cycle,
        type: original.type,
      });
    }
  });

  // Requisito 1.2 — cursos sin requisitos se incluyen siempre que no estén aprobados
  test('1.2 con lista vacía devuelve los cursos sin requisitos (26 cursos)', () => {
    const habilitados = calcularHabilitados([]);

    const sinRequisitos = repositorio
      .listar()
      .filter((c) => c.prerequisites.length === 0);
    expect(sinRequisitos).toHaveLength(26);
    expect(habilitados).toHaveLength(sinRequisitos.length);

    const codigos = new Set(habilitados.map((c) => c.id));
    for (const curso of sinRequisitos) {
      expect(codigos.has(curso.id)).toBe(true);
    }
  });

  // Requisito 1.3 — un requisito fuera de aprobados excluye el curso
  test('1.3 un curso con un requisito pendiente queda excluido', () => {
    // 1INF30 (Programación 3) requiere 1INF25; si 1INF25 no está aprobado, queda fuera
    const habilitados = calcularHabilitados(['1INF27', '1INF49']);

    const codigos = habilitados.map((c) => c.id);
    expect(codigos).not.toContain('1INF30');
  });

  test('1.3 un curso se habilita cuando todos sus requisitos están aprobados', () => {
    const habilitados = calcularHabilitados(['1INF25']);

    const codigos = habilitados.map((c) => c.id);
    expect(codigos).toContain('1INF30'); // requiere solo 1INF25
  });

  // Requisito 1.4 — nunca se devuelve un curso ya aprobado
  test('1.4 los cursos aprobados nunca aparecen en el resultado', () => {
    // 1INF25 no tiene requisitos, pero al estar aprobado debe quedar excluido
    const habilitados = calcularHabilitados(APROBADOS_EJEMPLO);

    const codigos = habilitados.map((c) => c.id);
    for (const aprobado of APROBADOS_EJEMPLO) {
      expect(codigos).not.toContain(aprobado);
    }
  });

  test('1.4 aprobar todos los cursos deja una lista vacía', () => {
    const todos = repositorio.listar().map((c) => c.id);

    expect(calcularHabilitados(todos)).toEqual([]);
  });

  // Requisito 4.4 — lista vacía responde con los cursos sin requisitos no aprobados
  test('4.4 la lista vacía devuelve cursos sin requisitos y ningún aprobado', () => {
    const habilitados = calcularHabilitados([]);

    expect(habilitados).toHaveLength(26);
    for (const curso of habilitados) {
      expect(repositorio.obtener(curso.id).prerequisites).toEqual([]);
    }
  });

  // Deduplicación — duplicados no alteran el resultado
  test('los duplicados en aprobados no cambian el resultado', () => {
    const sinDuplicados = calcularHabilitados(APROBADOS_EJEMPLO);
    const conDuplicados = calcularHabilitados([
      ...APROBADOS_EJEMPLO,
      '1INF25',
      '1INF27',
      '1INF49',
    ]);

    expect(conDuplicados).toEqual(sinDuplicados);
  });

  // Propiedad universal — el resultado nunca contiene aprobados
  // y todo curso incluido tiene sus requisitos satisfechos
  test('todo curso incluido tiene sus requisitos dentro de aprobados', () => {
    const aprobados = ['1INF25', '1INF27', '1INF49'];
    const conjunto = new Set(aprobados);

    for (const curso of calcularHabilitados(aprobados)) {
      expect(conjunto.has(curso.id)).toBe(false);
      for (const requisito of repositorio.obtener(curso.id).prerequisites) {
        expect(conjunto.has(requisito)).toBe(true);
      }
    }
  });
});
