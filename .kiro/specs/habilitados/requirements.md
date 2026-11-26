# Requirements: Habilitados

## Introduction

Endpoint `POST /habilitados` que, dado el conjunto de cursos aprobados por el alumno, devuelve los cursos no aprobados cuyos requisitos están todos dentro de ese conjunto. Un curso sin requisitos está habilitado. Incluye los requisitos derivados de los hallazgos de la revisión de seguridad del prototipo anterior y de la política de TI para cambios que llegan a `main`.

## Requirements

### Requirement 1: Devolver cursos habilitados

**User Story:** Como alumno, quiero enviar la lista de mis cursos aprobados, para conocer en qué cursos ya me puedo matricular.

#### Criterios de aceptación

1.1 CUANDO se envíe `POST /habilitados` con cuerpo `{"aprobados": ["1INF25", "1INF27", "1INF49"]}`, EL sistema DEBE responder 200 con los cursos no aprobados cuyos requisitos están todos en `aprobados`, y esa respuesta DEBE contener exactamente 27 cursos, entre ellos 1INF29, 1INF30, 1INF31 y 1INF32.

1.2 CUANDO un curso no tenga requisitos, EL sistema DEBE incluirlo en la respuesta siempre que no aparezca en `aprobados`.

1.3 CUANDO un curso tenga al menos un requisito que no esté en `aprobados`, EL sistema DEBE excluirlo de la respuesta.

1.4 CUANDO un curso esté en `aprobados`, EL sistema DEBE excluirlo de la respuesta, sin importar que cumpla sus requisitos.

1.5 DONDE un curso se incluya en la respuesta, EL sistema DEBE devolver su código, nombre, créditos, ciclo y tipo, en la misma forma que `GET /cursos`.

### Requirement 2: Seguridad del volumen de entrada (hallazgo 1)

**User Story:** Como operador del servicio, quiero que el volumen de la entrada esté acotado, para que una solicitud grande no deje el servicio sin responder.

#### Criterios de aceptación

2.1 SI `aprobados` contiene más de 87 códigos, EL sistema DEBE responder 413 con un mensaje de error que indique el límite máximo, sin procesar la lista.

2.2 CUANDO se envíe una solicitud con 5 000 códigos, EL sistema DEBE responder en menos de 1 segundo.

2.3 CUANDO `aprobados` contenga 87 códigos válidos, EL sistema DEBE responder en menos de 1 segundo.

### Requirement 3: Seguridad de los códigos recibidos (hallazgo 2)

**User Story:** Como operador del servicio, quiero que los códigos de curso estén validados, para que contenido inyectado no provoque errores ni filtre información interna.

#### Criterios de aceptación

3.1 SI algún elemento de `aprobados` no coincide con el patrón `^[A-Z0-9]{6}$`, EL sistema DEBE responder 400 con un mensaje de error que no repita el valor recibido.

3.2 CUANDO se envíe un código como `1INF30<script>`, EL sistema DEBE responder 400 y el cuerpo de la respuesta NO DEBE contener la cadena `<script>`.

3.3 SI ocurre un error no controlado durante el procesamiento, EL sistema DEBE responder 500 con un cuerpo que solo contenga `{"error": "..."}` sin stack trace, sin rutas internas del servidor y sin detalles del entorno.

### Requirement 4: Seguridad del tipo de la entrada (hallazgo 3)

**User Story:** Como operador del servicio, quiero que el tipo de `aprobados` esté validado, para que una entrada malformada no produzca resultados incorrectos.

#### Criterios de aceptación

4.1 SI `aprobados` no es un array (por ejemplo, el texto `"1INF25"`), EL sistema DEBE responder 400 con un mensaje que indique que se esperaba una lista.

4.2 SI algún elemento de `aprobados` no es de tipo string, EL sistema DEBE responder 400.

4.3 SI el cuerpo no es JSON válido o falta el campo `aprobados`, EL sistema DEBE responder 400.

4.4 SI `aprobados` es una lista vacía, EL sistema DEBE responder 200 con los cursos sin requisitos que no estén en `aprobados` (los mismos que devolvería con cualquier lista de aprobados del ciclo 5).

### Requirement 5: Calidad del cambio que llega a main

**User Story:** Como responsable del repositorio, quiero que el pipeline valide cobertura, dependencias y secretos, para cumplir la política de TI en cada cambio a `main`.

#### Criterios de aceptación

5.1 CUANDO se ejecute el pipeline de CI sobre un cambio a `main`, EL pipeline DEBE fallar si la cobertura de líneas de `src/` es menor a 80 %.

5.2 CUANDO se ejecute el análisis de dependencias (`npm audit`), EL pipeline DEBE fallar si existe alguna vulnerabilidad de severidad alta o crítica.

5.3 SI el repositorio contiene un secreto (clave, token o credencial) al momento del push, EL pipeline DEBE fallar el escaneo de secretos antes del merge a `main`.

5.4 CUANDO se ejecute la suite de pruebas, todas las pruebas de los requisitos 1 a 4 DEBEN pasar antes de habilitar el merge a `main`.
