# Charla: Metodologia SDD

> Extraido automaticamente desde Charla_Metodologia_SDD.pptx

## Diapositiva 1

METODOLOGÍA
Spec-Driven Development
Cómo trabajar con la IA sin que el código se nos escape de las manos
Una conversación de 30 minutos
Carlos  ·  Escuela de Informática y Telecomunicaciones  ·  Abril 2026

## Diapositiva 2

Lo que vamos a recorrer
Una hoja de ruta para los próximos minutos
01
El problema
Por qué este tema apareció ahora
02
La propuesta
Qué es SDD y de qué va realmente
03
Cómo funciona
Las piezas del proceso
04
Lo bueno y lo no tan bueno
Ventajas, costos y herramientas
05
Cuándo usarlo
Buenas prácticas y criterios de adopción
06
Para llevar
Conclusiones y fuentes para seguir
2 / 20
Metodología SDD  ·  Escuela de Informática y Telecomunicaciones

## Diapositiva 3

01
PRIMER BLOQUE
El problema en el que estamos
Por qué este tema empezó a sonar tanto en el último año
3 / 20
Metodología SDD  ·  Escuela de Informática y Telecomunicaciones

## Diapositiva 4

El problema que ya conocemos
Vibe-coding: pedimos, vemos, ajustamos, repetimos... y a veces funciona
La era del “pídeselo y veamos”
El asistente lanza algo. Ajustamos. Volvemos a pedir. Funciona... hasta que deja de funcionar. ¿Te suena?
Reescribimos lo mismo varias veces
Aparece un caso que nadie pensó
El código se aleja de la arquitectura sin avisar
Las decisiones técnicas quedan perdidas en el chat
Para una auditoría, no hay rastro
CASI 1 DE CADA 2
9,8% – 42,1%
es la tasa con la que los modelos de lenguaje generan código vulnerable, según los benchmarks más recientes.
El problema no es la IA. Es lo que falta a su alrededor.
4 / 20
Metodología SDD  ·  Escuela de Informática y Telecomunicaciones

## Diapositiva 5

Cómo se ve la diferencia
La misma funcionalidad, dos formas de llegar
Sin SDD
Lunes
“Hazme una API de cupones de descuento”
Miércoles
“Ah, también tiene que validar vencimiento”
Viernes
“Espera, el monto mínimo no estaba”
Lunes
“¿Por qué no rechaza si el cupón ya se usó?”
Miércoles
“Falta el caso del descuento mayor al total”
Resultado: 5 reescrituras, supuestos en la cabeza del autor
Con SDD
Lunes AM
Especificación de 30 líneas con todos los casos
Lunes PM
Plan técnico y descomposición en tareas
Martes
Implementación a partir de las tareas
Miércoles
Tests verifican cada criterio de aceptación
Jueves
Cierre. Funcionalidad lista y trazable
Resultado: 0 reescrituras, decisiones documentadas
5 / 20
Metodología SDD  ·  Escuela de Informática y Telecomunicaciones

## Diapositiva 6

02
SEGUNDO BLOQUE
Una forma distinta de empezar
Antes de codificar, escribir lo que se quiere construir
6 / 20
Metodología SDD  ·  Escuela de Informática y Telecomunicaciones

## Diapositiva 7

Entonces, ¿qué es SDD?
Una definición que cabe en una frase
Es escribir lo que quieres construir antes de pedírselo a alguien o a algo que lo construya por ti.
Primero, la especificación
Antes de que aparezca código. La intención completa, sin ambigüedades, en lenguaje claro.
Que se pueda verificar
No es un documento que se lee y se archiva. Es un contrato que el sistema valida automáticamente.
Y después, el código
El código se genera o se escribe a partir de la especificación. No al revés.
7 / 20
Metodología SDD  ·  Escuela de Informática y Telecomunicaciones

## Diapositiva 8

LA IDEA CENTRAL
La especificación es
la fuente de verdad.
El código pasa a ser una manifestación de lo que dice la especificación, no al revés. Cuando algo cambia, primero se modifica la especificación y después el código.
8 / 20
Metodología SDD  ·  Escuela de Informática y Telecomunicaciones

## Diapositiva 9

03
TERCER BLOQUE
Cómo se ve en la práctica
Las piezas concretas del proceso y cuándo aplicar cada una
9 / 20
Metodología SDD  ·  Escuela de Informática y Telecomunicaciones

## Diapositiva 10

El ciclo de seis fases
Desde establecer las reglas del juego hasta evolucionar el sistema
CICLO SDD
1
Constitución
Reglas del proyecto
2
Especificación
Qué debe hacer
3
Plan técnico
Contratos y arquitectura
4
Tareas
Descomposición atómica
5
Implementación
Código generado
6
Mantenimiento
Evolución desde la spec
10 / 20
Metodología SDD  ·  Escuela de Informática y Telecomunicaciones

## Diapositiva 11

Tres formas de adoptarlo
No todos los proyectos necesitan el mismo nivel de rigor
Spec-first
LIGERO
Escribes la spec, codificas desde ahí, y después el código vive su propia vida.
Buen punto de entrada. La mayoría empieza acá.
Spec-anchored
INTERMEDIO
La spec funciona como ancla. Cada cambio en el código se valida contra ella automáticamente.
Donde opera, por ejemplo, GitHub Spec Kit.
Spec-as-source
ESTRICTO
La spec es lo único que se edita. El código se regenera desde ahí.
Para sistemas críticos donde el código no se toca a mano.
¿Cuál usar? Empieza por el primero. Si el dominio lo justifica, sube de nivel.
11 / 20
Metodología SDD  ·  Escuela de Informática y Telecomunicaciones

## Diapositiva 12

Lo que ganas cuando funciona
Las ventajas concretas, no las del marketing
Menos ambigüedad
Las preguntas se responden antes de codificar, no a mitad de camino.
Mejor trazabilidad
Una línea directa entre intención de negocio, diseño y código entregado.
Detección temprana
Las desviaciones de la arquitectura aparecen antes, no en producción.
IA bajo control
Los asistentes trabajan con un contrato cerrado y producen código consistente.
Evidencia formal
Material útil para auditorías, cumplimiento y certificaciones de calidad.
Lenguaje común
Negocio, arquitectura y desarrollo conversan sobre el mismo artefacto.
12 / 20
Metodología SDD  ·  Escuela de Informática y Telecomunicaciones

## Diapositiva 13

Lo que cuesta
No es magia y no sirve para todo
Curva de aprendizaje
Diseñar especificaciones ejecutables exige práctica. No se aprende en una tarde.
Sobrecarga inicial
Para prototipos rápidos o pruebas de concepto puede ser desproporcionado.
Tooling en maduración
Las herramientas son potentes, pero todavía cambian rápido. Hay que asumirlo.
Mantenimiento dual
Si la especificación deja de actualizarse con el sistema, queda peor que no tenerla.
Regla simple: si mantener la spec cuesta más que mantener el código, SDD no es la respuesta.
13 / 20
Metodología SDD  ·  Escuela de Informática y Telecomunicaciones

## Diapositiva 14

Las herramientas que ya existen
El ecosistema está más maduro de lo que parece
GitHub Spec Kit
Toolkit abierto que estandariza la creación de especificaciones, planes y tareas. Buen punto de partida.
Frameworks BDD
Cucumber, SpecFlow y similares. Si ya los usas, estás más cerca de SDD de lo que crees.
Contratos de API
OpenAPI, Pact y AsyncAPI. Una forma muy concreta y verificable de especificación.
Plataformas con IA
Soluciones que orquestan agentes especializados: coordinador, implementador y verificador.
14 / 20
Metodología SDD  ·  Escuela de Informática y Telecomunicaciones

## Diapositiva 15

SDD frente a otras metodologías
Spoiler: no compite, integra
Metodología
Lo que pone al centro
Cómo se conecta con SDD
TDD
Pruebas escritas antes del código
Mismo principio: definir el comportamiento esperado antes de implementar.
BDD
Escenarios en lenguaje natural
Antecedente directo. Sus escenarios ya son una forma de spec ejecutable.
DDD
Modelo de dominio y lenguaje ubicuo
Aporta el vocabulario común que da sentido a las especificaciones.
Ágil
Historias y criterios de aceptación
SDD eleva esos artefactos a fuente autoritativa, no consultiva.
Si ya usas alguna de estas, estás más cerca de SDD de lo que crees.
15 / 20
Metodología SDD  ·  Escuela de Informática y Telecomunicaciones

## Diapositiva 16

Buenas prácticas para empezar
Lo que recomiendan los equipos que ya pasaron por esto
1
Empieza por un proyecto piloto acotado. Nunca por todo el sistema.
2
Redacta primero la constitución del proyecto y consíguete el consenso del equipo.
3
Mantén las especificaciones modulares, con criterios de aceptación verificables.
4
Versiona las especificaciones con el mismo rigor que el código.
5
Pon validación automática del código contra los contratos de la spec.
6
Capacita al equipo en redacción técnica, no solo en herramientas de IA.
16 / 20
Metodología SDD  ·  Escuela de Informática y Telecomunicaciones

## Diapositiva 17

¿Cuándo conviene aplicarlo?
Una guía rápida para decidir
Sí, vale la pena
Sistemas críticos en producción
Equipos que usan IA de forma intensiva
Proyectos con cumplimiento normativo
APIs y contratos entre múltiples equipos
Refactorizaciones de gran alcance
Mejor pasar
Prototipos desechables o spikes
Scripts puntuales y de un solo uso
Proyectos con requerimientos muy volátiles
Equipos sin tiempo para mantener documentación
Cuando ya hay documentación viva confiable
17 / 20
Metodología SDD  ·  Escuela de Informática y Telecomunicaciones

## Diapositiva 18

Lo que te llevas de esto
Cuatro ideas para recordar
01
Cambia el centro de gravedad
La especificación deja de ser un anexo y pasa a ser el artefacto principal.
02
Es disciplina para la era de la IA
Da estructura, trazabilidad y control sobre el código que generan los asistentes.
03
No reemplaza, integra
Convive con TDD, BDD, DDD y ágil, elevándolos a fuente autoritativa.
04
Empieza ligero
Spec-first es suficiente para la mayoría. No hace falta saltar a lo más estricto.
18 / 20
Metodología SDD  ·  Escuela de Informática y Telecomunicaciones

## Diapositiva 19

Para seguir leyendo
Fuentes consultadas y lecturas recomendadas
1
Spec-Driven Development: From Code to Contract in the Age of AI Coding Assistants
Piskala, D. B. (2026). arXiv:2602.00180.
arxiv.org/html/2602.00180v1
2
Spec-Driven Development
GitHub. spec-kit (repositorio oficial).
github.com/github/spec-kit
3
Diving Into Spec-Driven Development With GitHub Spec Kit
Microsoft for Developers (2025).
developer.microsoft.com/blog/spec-driven-development-spec-kit
4
What Is Spec-Driven Development? A Complete Guide
Augment Code (2026).
augmentcode.com/guides/what-is-spec-driven-development
5
Spec Driven Development: When Architecture Becomes Executable
InfoQ (enero, 2026).
infoq.com/articles/spec-driven-development
6
Spec-driven development
Thoughtworks. Medium (diciembre, 2025).
thoughtworks.medium.com/spec-driven-development-d85995a81387
7
A Practical Guide to Spec-Driven Development
Zencoder Docs.
docs.zencoder.ai/user-guides/tutorials/spec-driven-development-guide
8
SpecDriven.ai
Sitio oficial de la metodología.
specdriven.ai
19 / 20
Metodología SDD  ·  Escuela de Informática y Telecomunicaciones

## Diapositiva 20

Hablemos.
Preguntas, dudas, contraejemplos. Todo bienvenido.
Carlos  ·  Escuela de Informática y Telecomunicaciones  ·  Abril 2026

