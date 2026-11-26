# Requirements: Consulta de cursos

## Introduction

Funcionalidad para consultar los cursos de la malla y el detalle de un curso con sus requisitos.

## Requirements

### Requirement 1: Listar cursos

**User Story:** Como alumno, quiero ver los cursos de la malla, para planificar mi matrícula.

#### Criterios de aceptación

1.1 CUANDO se solicite `GET /cursos`, EL sistema DEBE devolver todos los cursos con código, nombre, créditos, ciclo y tipo.

1.2 CUANDO la solicitud incluya `?ciclo=N` con N entero entre 5 y 10, EL sistema DEBE devolver solo los cursos de ese ciclo.

1.3 SI el parámetro `ciclo` no es un entero entre 5 y 10, EL sistema DEBE responder 400 con un mensaje de error.

### Requirement 2: Detalle de un curso

**User Story:** Como alumno, quiero ver el detalle de un curso, para saber qué cursos debo aprobar antes.

#### Criterios de aceptación

2.1 CUANDO se solicite `GET /cursos/:codigo` con un código existente, EL sistema DEBE devolver el curso con sus requisitos, incluyendo código y nombre de cada uno.

2.2 SI el código no existe, EL sistema DEBE responder 404.

### Requirement 3: Calidad del servicio

**User Story:** Como alumno, quiero un servicio confiable, para consultar la malla sin problemas.

#### Criterios de aceptación

3.1 El sistema debe responder rápido y manejar los errores de forma segura.
