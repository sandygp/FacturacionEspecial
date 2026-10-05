# English Compass

Aplicación web para academias de inglés. Los alumnos diagnostican su nivel en las seis destrezas del Marco Común Europeo (A1–C2), siguen un plan para llegar al siguiente nivel y practican con corrección por IA. Los profesores gestionan sus grupos, asignan tareas y validan las notas de la IA.

## Qué incluye

**Alumno**
- Alta con el código de invitación de su grupo; entrada con correo y contraseña.
- Diagnóstico adaptativo (lectura, escucha, gramática, vocabulario), escritura corregida por IA y autoevaluación oral.
- Plan de estudio calculado por **tiempo diario** o por **fecha objetivo**, con semana tipo, fases e hitos.
- Práctica por destreza; redacción y respuesta oral evaluadas por IA (la voz se convierte en texto en el propio navegador).
- Tareas de clase y notas revisadas por el profesor; progreso con racha, minutos y aciertos.

**Profesor**
- Grupos con código de invitación, tabla de alumnos con nivel, destreza débil, minutos semanales y estado.
- Cola de revisión: nota de la IA por criterio, ajuste del profesor, comentario, validar o pedir que repita.
- Tareas: preguntas propias, redacción u oral con IA, o lectura/escucha de la biblioteca; biblioteca compartida de la academia.

## Arquitectura (fase gratuita)

| Pieza | Servicio |
|---|---|
| Web estática | Netlify (plan gratuito), carpeta `public/` |
| Evaluación con IA | Netlify Function `netlify/functions/evaluate.mjs` → API de Claude (clave solo en el servidor) |
| Cuentas | Firebase Authentication (correo y contraseña) |
| Datos | Cloud Firestore, protegido por `firestore.rules` |
| Voz a texto | Reconocimiento de voz del navegador (Chrome, Edge, Safari) |

En esta fase no se guarda el audio: la IA y el profesor evalúan la transcripción, así que la pronunciación no se puntúa.

## Puesta en marcha

Sigue [docs/CONFIGURACION.md](docs/CONFIGURACION.md). Mientras `src/firebase-config.js` tenga los valores de ejemplo, la app funciona en **modo demostración** (datos en el navegador, IA simulada) con estas cuentas: `profesor@demo.com` y `lucia@demo.com`, contraseña `demo1234`.

## Desarrollo

```bash
npm install
npm run build      # genera public/js/app.js
npm test           # pruebas de la lógica (niveles, plan, análisis)
npx netlify dev    # opcional: web + función de IA en local (requiere netlify-cli y variables de entorno)
```

## Estructura

```
public/                 Web publicada (index.html, css, mockup/)
src/main.js             Arranque, sesión y navegación
src/student.js          Vistas del alumno
src/teacher.js          Vistas del profesor
src/core.js             Lógica pura: niveles, plan, análisis de textos
src/data.js             Banco de contenidos por nivel
src/cloud.js            Firebase (Auth + Firestore) y llamada a la IA
src/cloud-demo.js       Modo demostración sin Firebase
src/firebase-config.js  Configuración pública de Firebase y nombre de la academia
netlify/functions/      Función de evaluación con IA
firestore.rules         Reglas de seguridad de la base de datos
tests/                  Pruebas
```
