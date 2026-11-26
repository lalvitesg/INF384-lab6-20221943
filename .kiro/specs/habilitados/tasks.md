# Plan de Tareas — POST /habilitados (Malla INF 2027-1)

Instrucciones de ejecución:
- Ejecuta cada tarea en orden y marca la casilla con `[x]` al completarla.
- Haz `commit` y `push` después de cada tarea completada.
- Verifica que la cobertura de líneas se mantenga en `>= 80 %`.

---

## Tareas de implementación y pruebas (`POST /habilitados`)

- [x] **1. Implementar validación de entrada y límites en `POST /habilitados`**
  - Validar que el cuerpo exista y contenga `aprobados` como un arreglo (rechazando cadenas, números, nulos, objetos o campos faltantes con `400`).
  - Rechazar listas con más de `200` elementos con `400` en menos de `500` ms.
  - Validar cada código con un patrón estricto (ej. `/^[A-Z0-9]{4,12}$/`) y verificar que exista en el catálogo de cursos cargado, respondiendo `400` si no cumple.
  - _Requisitos: 1.4, 2.1, 2.2, 2.3_

- [x] **2. Implementar el servicio de cálculo de cursos habilitados**
  - Normalizar `aprobados` en un `Set` para deduplicar y realizar búsquedas en $O(1)$.
  - Excluir siempre del resultado los cursos que ya estén en `aprobados`.
  - Incluir cursos sin requisitos y cursos cuyos requisitos estén todos contenidos en `aprobados`.
  - _Requisitos: 1.1, 1.2, 1.3_

- [x] **3. Integrar el *endpoint* y el manejo seguro de errores**
  - Exponer `POST /habilitados` devolviendo `200` con la lista de cursos habilitados en casos válidos.
  - Asegurar que errores de validación retornen `400` y errores inesperados retornen `500` con mensaje genérico, sin exponer *stack trace* ni rutas del sistema operativo.
  - _Requisitos: 1.1, 2.2_

- [x] **4. Escribir pruebas unitarias y de integración con cobertura `>= 80 %`**
  - Cubrir caso de ejemplo (`["1INF25", "1INF27", "1INF49"]` -> `27` cursos, incluyendo `1INF29`, `1INF30`, `1INF31` y `1INF32`), lista vacía (`[]`), duplicados, cursos aprobados y códigos inexistentes.
  - Cubrir casos de seguridad: lista de `5 000` códigos (`400` en `< 500` ms), `1INF30<script>` (`400` sin *stack* ni rutas) y `{"aprobados": "1INF25"}` (`400`).
  - Verificar que la cobertura de líneas sea al menos `80 %` y todos los tests pasen.
  - _Requisitos: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 3.1_

---

## Tareas de *gates* en CI y trazabilidad

- [x] **5. Configurar *gates* de calidad, SCA, secretos y SAST en `ci.yml`**
  - Configurar el *gate* de cobertura de tests (`>= 80 %` de líneas).
  - Configurar el *gate* SCA (`npm audit`) con umbral de `0` vulnerabilidades altas o críticas.
  - Configurar el *gate* de detección de secretos (`gitleaks`).
  - *(Opcional +1 pt)* Configurar el *gate* SAST con su decisión documentada en `design.md`.
  - Verificar que el *pipeline* corra y el último *run* en `main` quede en verde.
  - _Requisitos: 3.1_

- [x] **6. Completar `TRAZABILIDAD.md` y revisar cierre**
  - Mapear cada requisito no funcional a su *gate* o test correspondiente.
  - Registrar evidencia del estado fallido previo y del estado corregido (test fallido antes de la corrección o *run* fallido y *run* corregido / en verde; si aplica, diagnóstico o justificación en `.gitleaksignore`).
  - Documentar **2 cambios concretos** realizados sobre la propuesta de Kiro: qué propuso Kiro, qué cambiaste y por qué.
  - Hacer *commit* y *push* final y cerrar sesión en Kiro, GitHub y VS Code al terminar.
  - _Requisitos: 2.1, 2.2, 2.3, 3.1_