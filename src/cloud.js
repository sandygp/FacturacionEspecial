/*
 * Acceso a datos. Con Firebase configurado usa Authentication + Firestore;
 * si firebase-config.js aún tiene los valores de ejemplo, arranca en modo demostración
 * con los datos guardados en este navegador (cloud-demo.js).
 */
import { initializeApp } from 'firebase/app';
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signOut as fbSignOut, sendPasswordResetEmail, updateProfile, deleteUser
} from 'firebase/auth';
import {
  getFirestore, doc, getDoc, setDoc, updateDoc, addDoc, collection, query, where, getDocs, writeBatch, serverTimestamp
} from 'firebase/firestore';
import { firebaseConfig } from './firebase-config.js';
import { createDemoCloud } from './cloud-demo.js';
import { makeInviteCode } from './core.js';

const AUTH_ERRORS = {
  'auth/invalid-credential': 'Correo o contraseña incorrectos.',
  'auth/wrong-password': 'Correo o contraseña incorrectos.',
  'auth/user-not-found': 'Correo o contraseña incorrectos.',
  'auth/invalid-email': 'El correo no es válido.',
  'auth/email-already-in-use': 'Ya existe una cuenta con ese correo. Entra con tu contraseña.',
  'auth/weak-password': 'La contraseña debe tener al menos 8 caracteres.',
  'auth/too-many-requests': 'Demasiados intentos. Espera unos minutos.',
  'auth/network-request-failed': 'Sin conexión. Revisa tu internet.'
};
export function friendlyError(e) {
  if (e && AUTH_ERRORS[e.code]) return AUTH_ERRORS[e.code];
  if (e && e.code === 'permission-denied') return 'No tienes permiso para esta acción.';
  return (e && e.userMessage) || (e && e.message) || 'Algo ha fallado. Inténtalo de nuevo.';
}
const userError = msg => Object.assign(new Error(msg), { userMessage: msg });
const isConfigured = () => firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith('PEGA');

export function createCloud() {
  if (!isConfigured()) return createDemoCloud();

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  const uid = () => auth.currentUser && auth.currentUser.uid;
  const all = async q => (await getDocs(q)).docs.map(d => ({ id: d.id, ...d.data() }));
  let me = null; // documento del usuario actual (para consultas por grupo/profesor)
  let registering = false, authCb = () => {};
  // Durante el registro se espera a que exista el perfil antes de avisar a la app.
  async function register(create) {
    registering = true;
    try { await create(); } finally { registering = false; }
    const u = auth.currentUser;
    if (!u || !me) return null;
    authCb(u ? { uid: u.uid, email: u.email } : null, me);
    return me;
  }

  async function checkPassword(password) {
    if (String(password).length < 8 || !/\d/.test(password)) throw userError('La contraseña debe tener al menos 8 caracteres e incluir un número.');
  }

  return {
    demo: false,
    onAuth(cb) {
      authCb = cb;
      return onAuthStateChanged(auth, async user => {
        if (registering) return;
        me = null;
        if (user) { const s = await getDoc(doc(db, 'users', user.uid)); me = s.exists() ? { id: s.id, ...s.data() } : null; }
        cb(user ? { uid: user.uid, email: user.email } : null, me);
      });
    },
    signIn: (email, password) => signInWithEmailAndPassword(auth, email.trim(), password),
    signOut: () => fbSignOut(auth),
    resetPassword: email => sendPasswordResetEmail(auth, email.trim()),

    // Si falla el registro se borra la cuenta recién creada para que el correo pueda volver a usarse.
    registerStudent: ({ name, email, password, code }) => register(async () => {
      await checkPassword(password);
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      try {
        const inv = await getDoc(doc(db, 'inviteCodes', code.trim().toUpperCase()));
        if (!inv.exists()) throw userError('El código de invitación no existe. Revísalo con tu profesor.');
        const { groupId, teacherId } = inv.data();
        me = { role: 'student', name: name.trim(), email: email.trim(), groupId, teacherId, inviteCode: inv.id, createdAt: Date.now() };
        await setDoc(doc(db, 'users', cred.user.uid), me);
        me.id = cred.user.uid;
        await updateProfile(cred.user, { displayName: name.trim() });
      } catch (e) {
        me = null;
        await deleteUser(cred.user).catch(() => {});
        throw e;
      }
    }),
    registerTeacher: ({ name, email, password, teacherCode }) => register(async () => {
      await checkPassword(password);
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      try {
        me = { role: 'teacher', name: name.trim(), email: email.trim(), signupCode: teacherCode.trim(), createdAt: Date.now() };
        await setDoc(doc(db, 'users', cred.user.uid), me);
        me.id = cred.user.uid;
        await updateProfile(cred.user, { displayName: name.trim() });
      } catch (e) {
        me = null;
        await deleteUser(cred.user).catch(() => {});
        if (e.code === 'permission-denied') throw userError('El código de profesor no es correcto.');
        throw e;
      }
    }),

    async getUser(id) { const s = await getDoc(doc(db, 'users', id)); return s.exists() ? { id: s.id, ...s.data() } : null; },
    updateMe: patch => updateDoc(doc(db, 'users', uid()), patch),
    addSub: (sub, data) => addDoc(collection(db, 'users', uid(), sub), { ...data, createdAt: Date.now() }),
    listSub: (sub, userId = uid()) => all(collection(db, 'users', userId, sub)),

    async createGroup(name, schedule) {
      const ref = doc(collection(db, 'groups'));
      const code = makeInviteCode(name);
      const batch = writeBatch(db);
      batch.set(ref, { name, schedule, teacherId: uid(), inviteCode: code, createdAt: Date.now() });
      batch.set(doc(db, 'inviteCodes', code), { groupId: ref.id, teacherId: uid() });
      await batch.commit();
      return { id: ref.id, name, schedule, inviteCode: code };
    },
    listGroups: () => all(query(collection(db, 'groups'), where('teacherId', '==', uid()))),
    async getGroup(id) { const s = await getDoc(doc(db, 'groups', id)); return s.exists() ? { id: s.id, ...s.data() } : null; },
    listStudents: () => all(query(collection(db, 'users'), where('teacherId', '==', uid()))),

    createAssignment: a => addDoc(collection(db, 'assignments'), { ...a, teacherId: uid(), createdAt: Date.now() }),
    listAssignmentsForGroup: gid => all(query(collection(db, 'assignments'), where('groupId', '==', gid))),
    listAssignmentsByTeacher: () => all(query(collection(db, 'assignments'), where('teacherId', '==', uid()))),
    saveLibrary: item => addDoc(collection(db, 'library'), { ...item, authorId: uid(), createdAt: Date.now() }),
    listLibrary: () => all(collection(db, 'library')),

    createSubmission: s => addDoc(collection(db, 'submissions'), {
      ...s, studentId: uid(), teacherId: me && me.teacherId, status: 'pending', createdAt: Date.now(), submittedAt: serverTimestamp()
    }),
    listMySubmissions: () => all(query(collection(db, 'submissions'), where('studentId', '==', uid()))),
    listTeacherSubmissions: () => all(query(collection(db, 'submissions'), where('teacherId', '==', uid()))),
    reviewSubmission: (id, status, review) => updateDoc(doc(db, 'submissions', id), { status, review, reviewedAt: Date.now() }),

    async evaluate(payload) {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch('/.netlify/functions/evaluate', {
        method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` }, body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw userError(data.error || 'No se pudo evaluar con IA.');
      return data;
    }
  };
}
