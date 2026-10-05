/*
 * Configuración pública de Firebase (no es secreta: la protegen las reglas de Firestore).
 * Cópiala desde la consola de Firebase › Configuración del proyecto › Tus apps › App web.
 * Mientras apiKey empiece por "PEGA", la app funciona en modo demostración.
 */
export const firebaseConfig = {
  apiKey: 'PEGA_AQUI_TU_API_KEY',
  authDomain: 'tu-proyecto.firebaseapp.com',
  projectId: 'tu-proyecto',
  storageBucket: 'tu-proyecto.appspot.com',
  messagingSenderId: '000000000000',
  appId: '1:000000000000:web:0000000000000000'
};

// Nombre que se muestra en la app.
export const ACADEMY_NAME = 'Tu academia';
