const repositorio = require('../data/repositorio');

// Límite máximo de códigos por solicitud (el catálogo tiene 87 cursos).
const LIMITE_APROBADOS = 87;

// Patrón estricto de código de curso (Req. 3.1).
const PATRON_CODIGO = /^[A-Z0-9]{6}$/;

// Mensajes de error genéricos: nunca repiten el valor recibido (Req. 3.1 y 3.2).
const MENSAJES = {
  cuerpo:
    'el cuerpo de la solicitud debe ser un objeto JSON con el campo aprobados',
  tipo: 'aprobados debe ser una lista (arreglo) de códigos de curso',
  limite: `la lista de aprobados supera el límite máximo de ${LIMITE_APROBADOS} códigos`,
  elemento: 'todos los elementos de aprobados deben ser cadenas de texto',
  formato:
    'algún código no coincide con el patrón esperado (6 caracteres alfanuméricos en mayúsculas)',
  catalogo: 'algún código no existe en el catálogo de cursos',
};

/**
 * Valida el cuerpo de POST /habilitados.
 *
 * Devuelve `{ valido: true, aprobados }` con los códigos deduplicados,
 * o `{ valido: false, estado, error }` con el código HTTP (400/413) y un
 * mensaje que no revela el contenido recibido.
 *
 * El límite de elementos se comprueba ANTES de recorrer la lista, para
 * responder rápido ante solicitudes grandes (Req. 2.1 y 2.2).
 */
function validarAprobados(cuerpo) {
  if (
    cuerpo === undefined ||
    cuerpo === null ||
    typeof cuerpo !== 'object' ||
    Array.isArray(cuerpo)
  ) {
    return { valido: false, estado: 400, error: MENSAJES.cuerpo };
  }

  const { aprobados } = cuerpo;

  // Req. 4.1 y 4.3 — el campo debe existir y ser un arreglo.
  if (!Array.isArray(aprobados)) {
    return { valido: false, estado: 400, error: MENSAJES.tipo };
  }

  // Req. 2.1 y 2.2 — límite de volumen, sin procesar la lista.
  if (aprobados.length > LIMITE_APROBADOS) {
    return { valido: false, estado: 413, error: MENSAJES.limite };
  }

  for (const codigo of aprobados) {
    // Req. 4.2 — cada elemento debe ser un string.
    if (typeof codigo !== 'string') {
      return { valido: false, estado: 400, error: MENSAJES.elemento };
    }
    // Req. 3.1 y 3.2 — formato estricto, sin repetir el valor en el error.
    if (!PATRON_CODIGO.test(codigo)) {
      return { valido: false, estado: 400, error: MENSAJES.formato };
    }
    // El código debe existir en el catálogo cargado.
    if (!repositorio.obtener(codigo)) {
      return { valido: false, estado: 400, error: MENSAJES.catalogo };
    }
  }

  // Deduplica preservando el orden (la lista ya está acotada a 87).
  return { valido: true, aprobados: [...new Set(aprobados)] };
}

/**
 * Middleware Express para POST /habilitados.
 * En 400/413 responde directamente con `{ error }`; en caso válido deja
 * los códigos validados en `req.aprobados` y continúa.
 */
function validarCuerpoHabilitados(req, res, next) {
  const resultado = validarAprobados(req.body);
  if (!resultado.valido) {
    return res.status(resultado.estado).json({ error: resultado.error });
  }
  req.aprobados = resultado.aprobados;
  return next();
}

module.exports = {
  LIMITE_APROBADOS,
  PATRON_CODIGO,
  validarAprobados,
  validarCuerpoHabilitados,
};
