# Trazabilidad

## Requisito → gate → evidencia

| Requisito | Gate (herramienta y umbral) | Bloquea / avisa | Etapa | Run fallido | Run corregido |
| --- | --- | --- | --- | --- | --- |
| **2.1** Más de 87 códigos → `413` sin procesar la lista | `tests/habilitados-validacion.test.js` (unidades de `validarAprobados` con `estado: 413` y mensaje con el límite) + `tests/habilitados-integracion.test.js` (POST con 88+ códigos → `413`, cuerpo `{error}`) | Bloquea (test red) | `npm test` (local y CI) | Estado previo: no existía la ruta `POST /habilitados` → `404` | Commit `36afd92`: validación responde `413` con mensaje de límite (87) |
| **2.2** 5 000 códigos responde en < 1 s | `tests/habilitados-integracion.test.js`: aserción de tiempo (`Date.now()` antes/después) sobre POST con 5 000 códigos; el límite se chequea en O(1) antes de recorrer la lista | Bloquea (test red) | `npm test` (local y CI) | Estado previo: ruta inexistente (`404`), sin control de volumen | Commit `36afd92`: `LIMITE_APROBADOS = 87` se comprueba antes de iterar → `413` inmediato |
| **2.3** 87 códigos válidos → < 1 s | `tests/habilitados-integracion.test.js`: POST con los 87 códigos del catálogo con aserción de tiempo y respuesta `200` | Bloquea (test red) | `npm test` (local y CI) | — | La suite completa pasa en < 1 s por caso (normalización a `Set`, búsquedas O(1)) |
| **3.1** Patrón `^[A-Z0-9]{6}$`, `400` sin repetir el valor | `tests/habilitados-validacion.test.js` (unidades: `1INF30<script>`, minúsculas, longitud incorrecta → `400`, el error no contiene el valor recibido) + `tests/habilitados-integracion.test.js` (POST `1INF30<script>` → `400`) | Bloquea (test red) | `npm test` (local y CI) | Estado previo: sin validación de formato; un código inyectado habría llegado al servicio | Commits `36afd92` y `2fa36f9`: `PATRON_CODIGO = /^[A-Z0-9]{6}$/`, mensajes genéricos |
| **3.2** `<script>` no se refleja en el cuerpo | `tests/habilitados-integracion.test.js`: POST con `1INF30<script>`, aserción `expect(res.text).not.toContain('<script>')` sobre la respuesta `400` | Bloquea (test red) | `npm test` (local y CI) | — | Mensajes de error constantes (`MENSAJES.*`) que nunca interpolan la entrada |
| **3.3** Error `500` sin stack trace, sin rutas, sin detalles | `tests/errores.test.js` + `tests/habilitados-integracion.test.js`: respuestas `500` con cuerpo `{"error": "..."}`, sin `stack`, sin rutas de SO | Bloquea (test red) | `npm test` (local y CI) | Estado previo: sin manejador central de errores | Commit `2fa36f9`: middleware central en `src/middleware/errores.js` responde `500` con JSON genérico |
| **4.1** `aprobados` no es array → `400` "se esperaba una lista" | `tests/habilitados-validacion.test.js`: `aprobados = "1INF25"`, `42`, `null`, objeto, booleano → `400` con mensaje de lista esperada | Bloquea (test red) | `npm test` (local y CI) | — | Commit `36afd92`: `Array.isArray(aprobados)` con `MENSAJES.tipo` |
| **4.2** Elemento no-string → `400` | `tests/habilitados-validacion.test.js`: elementos numéricos/nulos/objetos → `400` (`MENSAJES.elemento`) | Bloquea (test red) | `npm test` (local y CI) | — | Commit `36afd92`: chequeo `typeof codigo !== 'string'` |
| **4.3** Cuerpo no-JSON o campo faltante → `400` | `tests/habilitados-validacion.test.js` (cuerpo `undefined`/`null`/arreglo/`{}` → `400`) + `tests/habilitados-integracion.test.js` (cuerpo vacío y sin campo) | Bloquea (test red) | `npm test` (local y CI) | — | Commit `36afd92`: `MENSAJES.cuerpo` + `express.json()` con manejo |
| **5.1** Cobertura de líneas `src/` >= 80 % | `jest.config.js` → `coverageThreshold.global.lines: 80` + CI step "Ejecutar pruebas con cobertura" (exit != 0 si no alcanza) | Bloquea (pipeline red) | CI (push/PR a `main`) | Estado previo al commit `5111fd4`: pipeline base sin gate de cobertura | Commit `41765f0`: umbral 80 % en `jest.config.js` y `ci.yml`; run en verde con `>= 80 %` |
| **5.2** `npm audit` sin vulnerabilidades altas/críticas | `ci.yml` step "Auditoría de dependencias (SCA)": `npm audit --audit-level=high` | Bloquea (pipeline red) | CI (push/PR a `main`) | Run #2 (commit `9a9413f`, main): `lodash@4.17.20` con 4 advisories HIGH (Command Injection, ReDoS, Code Injection, Prototype Pollution) → exit code ≠ 0 | Run #4 (commit `7f0e39c`, main) en verde con `lodash@^4.18.1`: 0 vulnerabilidades high/critical |
| **5.3** Escaneo de secretos antes del merge | `ci.yml` step "Escaneo de secretos (Gitleaks)": `gitleaks/gitleaks-action@v2` con `fetch-depth: 0` | Bloquea (pipeline red) | CI (push/PR a `main`) | — | Run #4 (main) en verde: gitleaks sin hallazgos; `config/ejemplo.env` contiene solo valores de ejemplo (ver `.gitleaksignore`) |
| **5.4** Suite completa en verde antes del merge | CI step "Ejecutar pruebas con cobertura": todos los tests de Req. 1–4 (`habilitados.test.js`, `habilitados-validacion.test.js`, `habilitados-integracion.test.js`, `cursos.test.js`, `errores.test.js`, `health.test.js`, `repositorio.test.js`) | Bloquea (pipeline red) | CI (push/PR a `main`) | Estado previo (commit `28d300f`): no existía `POST /habilitados` → cualquier POST devolvía `404` | Commits `36afd92`→`41765f0`: `200`/`400`/`413`/`500` según el caso, suite completa en verde |

---

## Evidencia de runs de CI en main

### Run en rojo — Run #2 (commit `9a9413f`, main)

**URL:** https://github.com/lalvitesg/INF384-lab6-20221943/actions/runs/45906348072

**Causa del fallo:** Gate 2 SCA (`npm audit --audit-level=high`) falló porque `package.json` declaraba `lodash@4.17.20`, que tiene 1 vulnerabilidad HIGH documentada:

- `GHSA-35jh-r3h4-6jhm` — Command Injection en `lodash`
- `GHSA-29mw-wpgm-hmr9` — ReDoS en `lodash`
- `GHSA-r5fr-rjxr-66jc` — Code Injection vía `_.template`
- `GHSA-xxjr-mmjv-4gpg` — Prototype Pollution en `_.unset`, `_.omit`, `_.pullAt`

`npm audit --audit-level=high` retornó exit code ≠ 0, lo que bloqueó el pipeline en la etapa SCA antes de llegar a Gitleaks y SAST.

**Corrección:** se actualizó la dependencia a `lodash@^4.18.1` (commit `58e1760`, PR #2). La versión 4.18.1 no tiene vulnerabilidades reportadas de severidad high/critical.

### Último run en verde — Run #4 (commit `7f0e39c`, main)

**URL:** https://github.com/lalvitesg/INF384-lab6-20221943/actions/runs/45906624988

**Trigger:** merge del PR #2 (`feat/lab` → `main`) con `lodash@^4.18.1`.

**Resultado de cada gate:**

| Gate | Resultado |
|------|-----------|
| Gate 1 — Cobertura >= 80 % | ✅ pasa (76 tests, cobertura de líneas > 80 %) |
| Gate 2 — SCA `npm audit --audit-level=high` | ✅ pasa (0 vulnerabilidades high/critical) |
| Gate 3 — Secretos Gitleaks | ✅ pasa (0 hallazgos reales; `config/ejemplo.env` no contiene credenciales) |
| Gate 4 — SAST njsscan | ✅ pasa (`njsscan --exit-warning src/` sin hallazgos bloqueantes) |

---

### SAST (opcional, +1 pt)

| Gate | Herramienta | Decisión |
| --- | --- | --- |
| SAST sobre `src/` | `njsscan --exit-warning src/` | Elegido sobre ESLint-plugin-security/Semgrep/Snyk por ser local, sin credenciales y específico para Node/Express (ver `design.md` § 6) |

---

## Evidencia de estado fallido previo y estado corregido

**Estado inicial (commit `28d300f`, antes de las Tareas 1–5):** no existía la ruta `POST /habilitados` en `src/app.js`. Cualquier POST a `/habilitados` devolvía `404` (Express por defecto). No había validación de volumen (`5 000` códigos habrían llegado al servicio), ni validación de formato/tipo, ni gate de cobertura, ni escaneo de secretos/SAST en `ci.yml`.

**Estado corregido (commits `36afd92` → `41765f9`... ver lista abajo):**

1. `36afd92` — Validación de entrada: `LIMITE_APROBADOS = 87` con `413` (antes del recorrido, O(1)); patrón `^[A-Z0-9]{6}$` con `400` sin repetir el valor; tipo array/string obligatorio.
2. `8b28979` — Servicio `calcularHabilitados` con `Set` para deduplicación y O(1), exclusión de aprobados, inclusión de cursos sin requisitos.
3. `2fa36f9` — Registro de la ruta y middleware central de errores (`500` con JSON genérico, sin stack ni rutas).
4. `cc11420` — Pruebas de integración HTTP; un POST válido que antes daba `404` ahora da `200` con 27 cursos (caso `["1INF25","1INF27","1INF49"]`, incluye `1INF29`–`1INF32`).
5. `41765f0` — Gates de CI: cobertura >= 80 % (jest threshold), SCA (`npm audit --audit-level=high`), secretos (gitleaks, `fetch-depth: 0`) y SAST (njsscan).

**Tests diseñados para fallar sobre el estado previo (exploración) y luego resueltos:** `habilitados-integracion.test.js` se escribió contra el contrato de Req. 1.1–4.4; sobre el código previo a la Tarea 3 fallaban con `404 ≠ 200/400/413` (confirmación del estado fallido) y pasaron tras registrar la ruta y la validación (commits `2fa36f9`–`cc11420`). Idem `habilitados-validacion.test.js`, que sin la Tarea 1 fallaba al no existir `src/habilitados/validacion.js`.

**`.gitleaksignore`:** se creó el archivo con la política documentada: `config/ejemplo.env` contiene valores de ejemplo (no credenciales reales), por lo que un eventual hallazgo de gitleaks sobre ese archivo se registra allí como falso positivo con el formato `<hash-commit>:<ruta>:<línea>`. No fue necesario suprimir ningún hallazgo real hasta el cierre.

---

## Cambios a la propuesta de Kiro

| Documento | Qué propuso Kiro | Qué cambiaste | Por qué |
| --- | --- | --- | --- |
| `tasks.md` (Tarea 1) | Rechazar listas de más de **200** elementos con **`400`** | El límite se fijó en **87** elementos (el catálogo completo) y el código de estado es **`413`** | El `requirements.md` (criterio 2.1) exige `413` con mensaje que indique el límite máximo; 87 es el tamaño real del catálogo, así que una lista mayor no puede ser válida y `413 Payload Too Large` es semánticamente correcto para volumen. Los tests de integración y validación se alinearon a `413` con el límite 87 |
| `tasks.md` (Tareas 1 y 4) / patrón de código | Validar cada código con un patrón laxo `^[A-Z0-9]{4,12}$` y "verificar que exista en el catálogo" sin especificar el estado; el test de 5 000 códigos esperaba `400` en `< 500 ms` | Patrón estricto **`^[A-Z0-9]{6}$`** (Req. 3.1), verificación contra catálogo con `400` genérico, y el test de volumen espera `413` en **< 1 s** (Req. 2.1/2.2) | El `requirements.md` fija exactamente el patrón de 6 caracteres; los mensajes de error nunca repiten el valor recibido (Req. 3.1/3.2) y los 5 000 códigos disparan el límite de volumen (`413`) antes de cualquier recorrido, con presupuesto de 1 s según los criterios 2.1/2.2 |
