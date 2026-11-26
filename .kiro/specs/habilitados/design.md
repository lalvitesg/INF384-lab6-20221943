# Diseño Técnico — POST /habilitados (Malla INF 2027-1)

## 1. Objetivo y alcance
Este documento define el diseño técnico de `POST /habilitados` sobre la base del servicio Malla INF (`GET /cursos` y `GET /cursos/:codigo`), resolviendo los casos no especificados en el pedido funcional, corrigiendo los hallazgos de seguridad del prototipo anterior y estableciendo las decisiones de los *gates* del *pipeline* de CI.

---

## 2. Arquitectura y componentes
El *endpoint* se integra con la estructura existente del repositorio:

* **Capa de rutas / controlador (`POST /habilitados`):** recibe el cuerpo JSON, invoca la validación de entrada, delega el cálculo de habilitación al servicio de dominio y formatea la respuesta HTTP.
* **Servicio de elegibilidad / dominio:** recibe el arreglo normalizado de códigos aprobados y la colección de cursos cargada desde el catálogo, evalúa qué cursos están habilitados y excluye los ya aprobados.
* **Validación y sanitización de entrada:** verifica estructura del cuerpo, tipo de `aprobados`, límite de elementos y formato estricto de cada código antes de procesar la malla.
* **Manejo centralizado de errores:** captura errores de validación/dominio (`400`) y fallos inesperados (`500`), devolviendo un JSON limpio sin *stack traces* ni rutas internas del sistema operativo.

---

## 3. Contrato del endpoint y flujo de procesamiento

### Solicitud esperada
* **Método y ruta:** `POST /habilitados`
* **Cuerpo JSON:**
  ```json
  {
    "aprobados": ["1INF25", "1INF27", "1INF49"]
  }


---

## 6. Decisión SAST

### Herramienta elegida: njsscan

**Por qué njsscan:**
njsscan es un analizador estático de código fuente orientado específicamente a aplicaciones Node.js/Express. Detecta patrones de código inseguros comunes en JavaScript del lado del servidor (inyección, deserialización insegura, uso de `eval`, cabeceras HTTP peligrosas, rutas de acceso no sanitizadas, entre otros). Se instala vía `pip` sin requerir configuración adicional, lo que lo hace adecuado para un step de CI liviano.

**Qué cubre:**
- Patrones de inyección (SQL, comandos, path traversal) en código Express.
- Uso inseguro de `eval`, `Function()` y similares.
- Configuración insegura de CORS o cabeceras HTTP.
- Deserialización de objetos no confiable.
- Expresiones regulares potencialmente vulnerables a ReDoS.

**Flag `--exit-warning`:**
El flag hace que njsscan salga con código no-cero si encuentra hallazgos de nivel *warning* o superior, lo que falla el pipeline. Si se prefiere fallar solo en hallazgos de nivel *error*, se puede cambiar a `--exit-code 1` condicionado al reporte.

**Por qué no otras herramientas:**
- *ESLint + eslint-plugin-security*: requiere más configuración y ya está cubierto por las reglas de lint del proyecto; njsscan provee detecciones específicas de seguridad fuera de la caja.
- *Semgrep*: opción válida y más potente, pero requiere una cuenta o token para rulesets avanzados; njsscan es 100 % local sin credenciales.
- *Snyk Code*: requiere token de Snyk, lo que añade un secreto adicional a gestionar.

**Cobertura con respecto a los requisitos:**
El gate SAST complementa el gate SCA (Req. 5.2) revisando el código propio (`src/`) en lugar de las dependencias, alineándose con la política de TI descrita en Req. 5.1-5.3.
