# Configuración de English Compass (fase gratuita)

Tiempo estimado: 30–45 minutos. Necesitas acceso a las cuentas de Firebase, Netlify y Anthropic de la academia.

## 1. Firebase

1. **Crear el proyecto** (si aún no existe) en la consola de Firebase. Plan **Spark** (gratuito).
2. **Authentication** › Método de acceso › activa **Correo electrónico/contraseña**.
3. **Firestore Database** › Crear base de datos › modo **producción** › elige la región más cercana a la academia (no se puede cambiar después).
4. **Firestore › Reglas**: borra el contenido, pega el archivo [`firestore.rules`](../firestore.rules) de este repositorio y pulsa **Publicar**.
5. **Código de profesor**: en Firestore › Datos, crea la colección `settings` con un documento llamado `academy` y un campo:
   - `teacherCode` (texto): un código que solo conozca la dirección, por ejemplo `PROFES-2026-QX7`.

   Los profesores lo usarán una sola vez para darse de alta. Nadie puede leerlo desde la app.
6. **App web**: Configuración del proyecto (rueda dentada) › Tus apps › icono `</>` › registra la app (sin Hosting). Copia el objeto `firebaseConfig` que aparece.
   - Pégalo en [`src/firebase-config.js`](../src/firebase-config.js) y cambia `ACADEMY_NAME` por el nombre de la academia, o envíamelo y lo hago yo. Estos valores son públicos: no son una contraseña.
7. Apunta el **ID del proyecto** (aparece en la configuración, p. ej. `academia-ingles-1a2b3`). Lo necesitarás en Netlify.

## 2. Anthropic (evaluación con IA)

1. Entra en la consola de Anthropic con la cuenta de la academia.
2. **Billing**: añade una recarga pequeña (por ejemplo 5–10 $).
3. **Limits**: fija un límite de gasto mensual.
4. **API Keys** › Create key. Cópiala: solo se muestra una vez. **No la pegues en el chat ni en el código.**

## 3. Netlify

1. **Add new site › Import an existing project** › GitHub › repositorio `FacturacionEspecial`.
2. Rama: la que vayáis a publicar (la de este trabajo o `main` cuando se fusione). Netlify lee `netlify.toml`: compila con `npm run build` y publica `public/`.
3. **Site configuration › Environment variables**, añade:

   | Variable | Valor |
   |---|---|
   | `ANTHROPIC_API_KEY` | la clave del paso 2 |
   | `FIREBASE_PROJECT_ID` | el ID del proyecto del paso 1.7 |
   | `CLAUDE_MODEL` | opcional. Por defecto `claude-opus-5-5`. Para abaratar: `claude-sonnet-5-5` o `claude-haiku-4-5` |
   | `AI_MONTHLY_LIMIT` | opcional. Evaluaciones con IA por usuario y mes (por defecto 30) |

4. **Deploys › Trigger deploy**. Cuando termine, apunta la dirección del sitio (p. ej. `english-compass.netlify.app`).
5. De vuelta en Firebase: **Authentication › Configuración › Dominios autorizados** › añade esa dirección de Netlify.

## 4. Primer uso

1. Cada profesor abre la web › «Soy profesor y quiero darme de alta» › escribe el código de profesor.
2. Crea su grupo (p. ej. «B1 · martes y jueves») y comparte el **código de invitación** que aparece.
3. Los alumnos abren la web › «Activar mi cuenta con el código» › crean su cuenta y hacen el diagnóstico.

## Límites de la fase gratuita

- Netlify: 300 créditos al mes (unos 15 GB de tráfico). Si se agotan, el sitio se pausa hasta el mes siguiente, sin cobros.
- Firestore: 50.000 lecturas y 20.000 escrituras al día, 1 GB de datos.
- IA: lo que marque el límite de gasto de Anthropic y `AI_MONTHLY_LIMIT` por alumno.
- No se guarda el audio de las grabaciones (Cloud Storage requiere el plan Blaze de Firebase). Es el primer cambio previsto al pasar a la fase de pago.

## Problemas frecuentes

- **«No tienes permiso para esta acción» al registrarse**: revisa que las reglas de `firestore.rules` estén publicadas y que exista `settings/academy` con `teacherCode`.
- **«Tu sesión ha caducado» al evaluar con IA**: `FIREBASE_PROJECT_ID` en Netlify no coincide con el proyecto de `src/firebase-config.js`.
- **«Falta configurar ANTHROPIC_API_KEY…»**: añade las variables y vuelve a desplegar.
- **No se puede grabar**: el reconocimiento de voz necesita Chrome, Edge o Safari, permiso de micrófono y la web servida por `https`.
