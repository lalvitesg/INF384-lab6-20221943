const repositorio = require('../data/repositorio');

/**
 * Devuelve los cursos habilitados para un alumno dado su historial de cursos
 * aprobados.
 *
 * Un curso está habilitado cuando:
 *   - No está en `aprobados` (Req. 1.4).
 *   - No tiene requisitos (Req. 1.2), o todos sus requisitos están en
 *     `aprobados` (Req. 1.3).
 *
 * @param {string[]} aprobados - Lista (posiblemente con duplicados) de códigos
 *   de cursos aprobados. Se asume que ya fue validada.
 * @returns {{ id, name, credits, cycle, type }[]} Lista de cursos habilitados
 *   con la misma forma que GET /cursos (Req. 1.5).
 */
function calcularHabilitados(aprobados) {
  // Normalizar a Set para deduplicar y búsquedas en O(1) (Req. 1.4).
  const conjunto = new Set(aprobados);

  return repositorio
    .listar()
    .filter((curso) => {
      // Excluir cursos ya aprobados (Req. 1.4).
      if (conjunto.has(curso.id)) return false;

      // Incluir solo si todos los requisitos están en aprobados (Req. 1.2 y 1.3).
      return curso.prerequisites.every((req) => conjunto.has(req));
    })
    .map(({ id, name, credits, cycle, type }) => ({
      id,
      name,
      credits,
      cycle,
      type,
    }));
}

module.exports = { calcularHabilitados };
