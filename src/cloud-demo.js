/*
 * Modo demostración: misma interfaz que cloud.js, con los datos en el localStorage del navegador.
 * Sirve para probar la app antes de configurar Firebase. Cuentas de ejemplo:
 *   profesor@demo.com / demo1234   (código de profesor: PROFE-2026)
 *   lucia@demo.com / demo1234      (alumna del grupo B1, código B1-DEM-O26)
 */
import { analyzeText, LV, makeInviteCode, dateKey, addDays } from './core.js';

const KEY = 'english-compass:demo-db';
const SESSION = 'english-compass:demo-session';
const id = () => Math.random().toString(36).slice(2, 10);
const userError = msg => Object.assign(new Error(msg), { userMessage: msg });
const wait = (ms = 120) => new Promise(r => setTimeout(r, ms));

function seed() {
  const t = 't-demo', g = 'g-demo';
  const db = {
    accounts: { 'profesor@demo.com': { uid: t, password: 'demo1234' }, 'lucia@demo.com': { uid: 's-lucia', password: 'demo1234' } },
    users: {
      [t]: { role: 'teacher', name: 'Profesor de ejemplo', email: 'profesor@demo.com' },
      's-lucia': { role: 'student', name: 'Lucía Martín', email: 'lucia@demo.com', groupId: g, teacherId: t },
      's-javier': { role: 'student', name: 'Javier Ruiz', email: 'javier@demo.com', groupId: g, teacherId: t,
        levels: { reading: 2, listening: 2, grammar: 2, vocabulary: 1, writing: 1, speaking: 1 }, overall: 1, diagDate: dateKey(addDays(new Date(), -20)),
        plan: { minutes: 30, days: 5 } },
      's-marta': { role: 'student', name: 'Marta Gómez', email: 'marta@demo.com', groupId: g, teacherId: t,
        levels: { reading: 3, listening: 3, grammar: 3, vocabulary: 3, writing: 2, speaking: 3 }, overall: 3, diagDate: dateKey(addDays(new Date(), -10)),
        plan: { minutes: 45, days: 5 } }
    },
    sub: { 's-javier': { sessions: [{ id: id(), date: dateKey(addDays(new Date(), -3)), skill: 'grammar', level: 2, correct: 3, total: 5, minutes: 15 }] },
      's-marta': { sessions: [{ id: id(), date: dateKey(new Date()), skill: 'writing', level: 3, correct: 0, total: 0, minutes: 25 }, { id: id(), date: dateKey(addDays(new Date(), -1)), skill: 'listening', level: 3, correct: 3, total: 3, minutes: 20 }] } },
    groups: { [g]: { name: 'B1 · martes y jueves 18:00', schedule: 'Martes y jueves 18:00', teacherId: t, inviteCode: 'B1-DEM-O26' } },
    inviteCodes: { 'B1-DEM-O26': { groupId: g, teacherId: t } },
    assignments: {
      'a-oral': { groupId: g, teacherId: t, type: 'speaking', skill: 'speaking', level: 2, title: 'Working from home', due: dateKey(addDays(new Date(), 3)),
        instructions: 'Graba 2 minutos con tu opinión. La IA te dará una primera nota y yo la reviso.',
        prompt: 'Do you think people should work from home? Give advantages, disadvantages and your opinion.', createdAt: Date.now() - 86400000 }
    },
    library: {},
    submissions: {
      'sub-marta': { assignmentId: 'a-oral', assignmentTitle: 'Working from home', groupId: g, studentId: 's-marta', studentName: 'Marta Gómez', teacherId: t,
        type: 'speaking', level: 2, prompt: 'Do you think people should work from home? Give advantages, disadvantages and your opinion.',
        text: 'I think working from home has a lot of advantages, for example you save time because you do not need to commute, and you can organise your day as you want. However it can be lonely and some people find it difficult to stop working in the evening. In my opinion the best option is a mix of both.',
        ai: { overall: 'B2', summary: 'Respuesta clara y bien organizada, con buen uso de conectores. (Evaluación simulada.)',
          criteria: [{ name: 'Desarrollo de la tarea', level: 'B2', comment: 'Das ventajas, inconvenientes y tu opinión.' }, { name: 'Coherencia', level: 'B2', comment: 'Buen uso de however y for example.' }, { name: 'Gramática', level: 'B1', comment: 'Falta alguna coma.' }, { name: 'Vocabulario', level: 'B2', comment: 'Variado y preciso.' }],
          corrections: [{ original: 'However it can be lonely', corrected: 'However, it can be lonely', explanation: 'Después de however al inicio va coma.' }], tips: ['Prueba con on the other hand o that said.'] },
        status: 'pending', createdAt: Date.now() - 3600000 }
    },
    settings: { teacherCode: 'PROFE-2026' }
  };
  return db;
}

export function createDemoCloud() {
  let db;
  try { db = JSON.parse(localStorage.getItem(KEY)); } catch { db = null; }
  if (!db) db = seed();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch { /* sin almacenamiento */ } };
  let current = null;
  try { current = localStorage.getItem(SESSION); } catch { current = null; }
  let listener = () => {};
  const emit = () => listener(current ? { uid: current, email: db.users[current].email } : null, current ? { id: current, ...db.users[current] } : null);
  const setSession = uid => { current = uid; try { uid ? localStorage.setItem(SESSION, uid) : localStorage.removeItem(SESSION); } catch { /* */ } emit(); };
  const list = (col, pred) => Object.entries(db[col]).map(([k, v]) => ({ id: k, ...v })).filter(pred);
  const checkPassword = p => { if (String(p).length < 8 || !/\d/.test(p)) throw userError('La contraseña debe tener al menos 8 caracteres e incluir un número.'); };
  const newAccount = (email, password) => {
    const e = email.trim().toLowerCase();
    if (db.accounts[e]) throw userError('Ya existe una cuenta con ese correo. Entra con tu contraseña.');
    const uid = 'u-' + id();
    db.accounts[e] = { uid, password };
    return uid;
  };

  return {
    demo: true,
    reset() { db = seed(); save(); setSession(null); },
    onAuth(cb) { listener = cb; setTimeout(emit, 0); return () => {}; },
    async signIn(email, password) {
      await wait();
      const a = db.accounts[email.trim().toLowerCase()];
      if (!a || a.password !== password) throw userError('Correo o contraseña incorrectos.');
      setSession(a.uid);
    },
    async signOut() { setSession(null); },
    async resetPassword() { await wait(); },
    async registerStudent({ name, email, password, code }) {
      await wait(); checkPassword(password);
      const inv = db.inviteCodes[code.trim().toUpperCase()];
      if (!inv) throw userError('El código de invitación no existe. Revísalo con tu profesor.');
      const uid = newAccount(email, password);
      db.users[uid] = { role: 'student', name: name.trim(), email: email.trim(), groupId: inv.groupId, teacherId: inv.teacherId, inviteCode: code.trim().toUpperCase() };
      save(); setSession(uid);
      return db.users[uid];
    },
    async registerTeacher({ name, email, password, teacherCode }) {
      await wait(); checkPassword(password);
      if (teacherCode.trim() !== db.settings.teacherCode) throw userError('El código de profesor no es correcto.');
      const uid = newAccount(email, password);
      db.users[uid] = { role: 'teacher', name: name.trim(), email: email.trim() };
      save(); setSession(uid);
      return db.users[uid];
    },
    async getUser(uid) { return db.users[uid] ? { id: uid, ...db.users[uid] } : null; },
    async updateMe(patch) { Object.assign(db.users[current], patch); save(); },
    async addSub(sub, data) {
      const s = db.sub[current] || (db.sub[current] = {});
      (s[sub] || (s[sub] = [])).push({ id: id(), ...data, createdAt: Date.now() }); save();
    },
    async listSub(sub, uid = current) { return ((db.sub[uid] || {})[sub] || []).slice(); },
    async createGroup(name, schedule) {
      const gid = 'g-' + id(), code = makeInviteCode(name);
      db.groups[gid] = { name, schedule, teacherId: current, inviteCode: code, createdAt: Date.now() };
      db.inviteCodes[code] = { groupId: gid, teacherId: current }; save();
      return { id: gid, ...db.groups[gid] };
    },
    async listGroups() { return list('groups', g => g.teacherId === current); },
    async getGroup(gid) { return db.groups[gid] ? { id: gid, ...db.groups[gid] } : null; },
    async listStudents() { return list('users', u => u.teacherId === current); },
    async createAssignment(a) { db.assignments['a-' + id()] = { ...a, teacherId: current, createdAt: Date.now() }; save(); },
    async listAssignmentsForGroup(gid) { return list('assignments', a => a.groupId === gid); },
    async listAssignmentsByTeacher() { return list('assignments', a => a.teacherId === current); },
    async saveLibrary(item) { db.library['l-' + id()] = { ...item, authorId: current, createdAt: Date.now() }; save(); },
    async listLibrary() { return list('library', () => true); },
    async createSubmission(s) {
      db.submissions['s-' + id()] = { ...s, studentId: current, teacherId: db.users[current].teacherId, status: 'pending', createdAt: Date.now() }; save();
    },
    async listMySubmissions() { return list('submissions', s => s.studentId === current); },
    async listTeacherSubmissions() { return list('submissions', s => s.teacherId === current); },
    async reviewSubmission(sid, status, review) { Object.assign(db.submissions[sid], { status, review, reviewedAt: Date.now() }); save(); },
    async evaluate({ kind, text }) {
      await wait(900);
      if (text.trim().split(/\s+/).length < 15) throw userError('La respuesta es demasiado corta para evaluarla (mínimo 15 palabras).');
      const a = analyzeText(text);
      const L = a.estimate ?? 0;
      const lv = d => LV[Math.max(0, Math.min(5, L + d))];
      const names = kind === 'speaking' ? ['Desarrollo de la tarea', 'Coherencia', 'Gramática', 'Vocabulario'] : ['Adecuación a la tarea', 'Coherencia y cohesión', 'Gramática', 'Vocabulario'];
      return {
        model: 'simulación (modo demo)', remaining: 29,
        evaluation: {
          overall: LV[L],
          summary: 'Evaluación simulada en modo demostración, calculada con métricas del texto. Con Firebase y la clave de IA configuradas, la hará Claude.',
          criteria: names.map((n, i) => ({ name: n, level: lv(i === 2 ? -1 : i === 3 && a.guiraud > 7 ? 1 : 0), comment: i === 1 ? `${a.conn.mid.length + a.conn.adv.length} conectores de nivel intermedio o avanzado.` : 'Comentario de ejemplo.' })),
          corrections: [],
          tips: ['Usa conectores como however, although o on the other hand.', 'Añade un ejemplo concreto para apoyar cada idea.']
        }
      };
    }
  };
}
