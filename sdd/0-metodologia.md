# Metodología SDD — Spec-Driven Development

> Desarrollo guiado por especificaciones
> Documento técnico de referencia
> Abril de 2026

---

## 1. Introducción

El desarrollo de software guiado por especificaciones, conocido por sus siglas en inglés como SDD (Spec-Driven Development), es un paradigma de desarrollo que ha cobrado especial relevancia con la consolidación de los asistentes de codificación basados en inteligencia artificial. Su propuesta central consiste en invertir la relación tradicional entre especificación y código: la especificación deja de ser documentación pasiva para convertirse en el artefacto principal del proceso de desarrollo, mientras que el código pasa a ser un producto derivado de ella.

Este documento ofrece una visión integral de la metodología SDD, sus principios, fases, niveles de rigor, herramientas asociadas y comparación con otros enfoques. Está orientado tanto a desarrolladores como a docentes y profesionales que requieran comprender en profundidad este paradigma emergente.

## 2. Definición y origen

Spec-Driven Development es una metodología en la que se redactan requerimientos completos y especificaciones técnicas detalladas antes de entregarlos a un agente de codificación, en lugar de iterar mediante indicaciones conversacionales sucesivas. Bajo este enfoque, la especificación define la intención y el código la materializa.

Aunque la idea de partir desde especificaciones formales no es nueva (existen antecedentes en metodologías como Behavior-Driven Development o Domain-Driven Design), SDD adquiere su forma actual entre 2025 y 2026 como respuesta a la necesidad de imponer disciplina y trazabilidad al uso intensivo de modelos de lenguaje en la generación de código.

## 3. Principios fundamentales

La metodología SDD se sustenta en un conjunto de principios que orientan tanto la elaboración de especificaciones como su uso operativo:

- **Especificación como fuente de verdad:** La especificación es la fuente de verdad. El código pasa a ser una manifestación de la especificación, no al revés.
- **Especificaciones ejecutables:** Las especificaciones se diseñan para ser interpretadas y verificadas de forma automatizada, no solo leídas por humanos.
- **Gobernanza explícita:** Existen reglas no negociables del proyecto (stack tecnológico, estándares de codificación, normas de seguridad) que enmarcan toda decisión posterior.
- **Tareas atómicas:** La descomposición del trabajo en unidades pequeñas y verificables reduce ambigüedad y facilita la revisión.
- **Humano en el ciclo:** El desarrollador deja de ser únicamente quien codifica y asume el rol de arquitecto y revisor del trabajo generado.
- **Alineación continua:** La trazabilidad entre intención, especificación y código permite detectar desviaciones arquitectónicas de forma temprana.

## 4. Fases de la metodología

Si bien existen variaciones entre autores y herramientas, la mayoría de las implementaciones de SDD comparte un ciclo de seis fases:

1. **Constitución:** Definición de los principios persistentes del proyecto, habitualmente plasmados en un documento llamado constitución (`constitution.md`), que establece reglas inmutables sobre arquitectura, seguridad, estándares de calidad y convenciones.
2. **Especificación:** Captura de requerimientos no ambiguos en términos de historias de usuario, criterios de aceptación y restricciones, con foco en la intención y no en la implementación.
3. **Planificación:** Elaboración del plan técnico que traduce la especificación en una arquitectura concreta, identificando interfaces, contratos y dependencias.
4. **Descomposición en tareas:** Descomposición del plan en tareas pequeñas, autocontenidas y verificables que puedan ser ejecutadas y validadas de forma individual.
5. **Implementación:** Generación del código a partir de las tareas definidas, ya sea mediante agentes de inteligencia artificial o mediante desarrollo manual asistido.
6. **Mantenimiento:** Evolución del sistema modificando primero la especificación y regenerando o ajustando el código en consecuencia, manteniendo la alineación entre intención e implementación.

## 5. Niveles de rigor

La literatura especializada distingue tres niveles de aplicación de SDD, que pueden adoptarse según el contexto del proyecto:

| Nivel | Descripción |
|---|---|
| **Spec-first** | La especificación se redacta antes que el código y guía su construcción, pero el código sigue siendo editable de forma independiente. |
| **Spec-anchored** | La especificación funciona como ancla permanente: cualquier cambio en el código se valida contra ella mediante mecanismos automáticos. |
| **Spec-as-source** | La especificación es la única fuente editable. El código se regenera completamente desde ella y no se modifica de forma directa. |

## 6. Ventajas y limitaciones

### 6.1 Ventajas

- Reducción de la ambigüedad en los requerimientos antes de iniciar la codificación.
- Mejor trazabilidad entre intención de negocio, diseño técnico y código entregado.
- Detección temprana de desviaciones arquitectónicas y violaciones de contrato.
- Aprovechamiento estructurado de los asistentes de inteligencia artificial, reduciendo el reproceso.
- Evidencia formal útil para auditorías, cumplimiento normativo y certificaciones de calidad.

### 6.2 Limitaciones

- Curva de aprendizaje significativa, especialmente en el diseño de especificaciones ejecutables.
- Sobrecarga inicial de documentación que puede no justificarse en prototipos rápidos o pruebas de concepto.
- Dependencia de herramientas y tooling aún en maduración.
- Requiere disciplina del equipo para mantener actualizada la especificación frente al código.

## 7. Herramientas y ecosistema

El ecosistema de soporte para SDD incluye tanto frameworks tradicionales como herramientas modernas pensadas para integrarse con asistentes de inteligencia artificial. Entre los más relevantes destacan:

- **GitHub Spec Kit:** Toolkit publicado por GitHub que estandariza la creación de especificaciones, planes y tareas para flujos asistidos por inteligencia artificial.
- **BDD:** Frameworks de Behavior-Driven Development como Cucumber o SpecFlow, que aportan especificaciones ejecutables en formato Gherkin.
- **Contratos de API:** Frameworks de contrato para servicios web como OpenAPI, Pact y AsyncAPI, ampliamente utilizados como insumo de generación.
- **Plataformas asistidas por IA:** Plataformas comerciales como Augment Code, Zencoder y soluciones internas que orquestan agentes especializados (coordinador, implementador, verificador).

## 8. Comparación con otras metodologías

| Metodología | Artefacto principal | Relación con SDD |
|---|---|---|
| **TDD** | Pruebas automatizadas escritas antes del código. | Comparte el principio de definir el comportamiento esperado antes de implementar; SDD generaliza la idea a la especificación completa. |
| **BDD** | Escenarios en lenguaje natural estructurado. | Es un antecedente directo de SDD; sus escenarios son una forma de especificación ejecutable. |
| **DDD** | Modelo de dominio y lenguaje ubicuo. | Aporta a SDD el vocabulario común que da sentido a las especificaciones. |
| **Ágil** | Historias de usuario y criterios de aceptación. | Es plenamente compatible; SDD eleva estos artefactos al rango de fuente autoritativa y fuerza su cumplimiento mediante automatización. |

## 9. Buenas prácticas de adopción

1. Comenzar con un proyecto piloto acotado para evaluar la inversión en documentación y validar el tooling.
2. Redactar primero la constitución del proyecto y obtener consenso del equipo antes de avanzar con especificaciones.
3. Mantener especificaciones modulares, con criterios de aceptación verificables y descomposiciones claras.
4. Versionar las especificaciones junto con el código, dándoles el mismo nivel de rigor en revisiones de cambios.
5. Establecer mecanismos automatizados de validación que comparen el código generado contra los contratos de la especificación.
6. Capacitar al equipo en redacción técnica y diseño de contratos, no solo en herramientas de inteligencia artificial.

## 10. Conclusiones

La metodología SDD propone un cambio de enfoque significativo en la forma de construir software: las especificaciones dejan de ser documentos accesorios para convertirse en el centro del proceso de desarrollo. Este cambio resulta especialmente valioso en escenarios donde se utilizan asistentes de inteligencia artificial, ya que permite imponer disciplina, trazabilidad y verificabilidad al código generado.

Su adopción no implica abandonar prácticas anteriores como las metodologías ágiles, el desarrollo guiado por pruebas o el diseño guiado por dominio; por el contrario, SDD se construye sobre ellas y las potencia. La decisión sobre qué nivel de rigor adoptar (spec-first, spec-anchored o spec-as-source) dependerá del contexto, la criticidad del sistema y la madurez del equipo.

En definitiva, SDD se perfila como una metodología clave para los próximos años, en la medida en que la generación asistida de código continúe ganando protagonismo en la industria del software.
