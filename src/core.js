/* English Compass — lógica pura (sin interfaz ni red): niveles, plan de estudio y análisis de textos. */
import { D } from './data.js';

export const LV = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
export const LV_NAME = ['Acceso', 'Plataforma', 'Umbral', 'Avanzado', 'Dominio operativo', 'Maestría'];
export const SKILLS = [
  { id: 'reading', name: 'Lectura' },
  { id: 'listening', name: 'Comprensión auditiva' },
  { id: 'grammar', name: 'Gramática' },
  { id: 'vocabulary', name: 'Vocabulario' },
  { id: 'writing', name: 'Escritura' },
  { id: 'speaking', name: 'Expresión oral' }
];
export const SK = Object.fromEntries(SKILLS.map(s => [s.id, s]));
export const MC_SKILLS = ['reading', 'listening', 'grammar', 'vocabulary'];
export const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
export const DAY_SETS = { 3: [0, 2, 4], 4: [0, 1, 3, 4], 5: [0, 1, 2, 3, 4], 6: [0, 1, 2, 3, 4, 5], 7: [0, 1, 2, 3, 4, 5, 6] };
export const band = i => (i < 2 ? 'a' : i < 4 ? 'b' : 'c');
export const bandKey = i => band(i).toUpperCase();

/* ---------- Fechas ---------- */
const pad = n => String(n).padStart(2, '0');
export { pad };
export const dateKey = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayKey = () => dateKey(new Date());
export const weekday = (d = new Date()) => (d.getDay() + 6) % 7;
export const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
export const parseKey = k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
export const fmtDate = k => parseKey(k).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
export const weekStart = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return addDays(d, -weekday(d)); };
const avg = a => a.reduce((x, y) => x + y, 0) / (a.length || 1);

/* ---------- Niveles ---------- */
export function overallLevel(levels) { return Math.min(5, Math.floor(avg(SKILLS.map(s => levels[s.id])) + 0.4)); }

/** Nivel más alto en el que se marcó al menos la mitad de los descriptores, sin saltos. -1 = por debajo de A1. */
export function canDoLevel(checkedCounts, statements) {
  let level = -1;
  for (let i = 0; i < 6; i++) {
    if (checkedCounts[i] >= Math.ceil(statements[i].length / 2)) level = i; else break;
  }
  return level;
}

/** Paso del diagnóstico adaptativo: devuelve { level } para seguir o { final } cuando termina. */
export function adaptiveStep(tried, level, pass) {
  tried[level] = pass;
  if (pass) {
    if (level === 5) return { final: 5 };
    if (tried[level + 1] === false) return { final: level };
    return { level: level + 1 };
  }
  if (level === 0) return { final: 0, below: true };
  if (tried[level - 1] === true) return { final: level - 1 };
  return { level: level - 1 };
}

/* ---------- Análisis automático de textos ---------- */
const CONNECTORS = {
  basic: ['and', 'but', 'because', 'so', 'then', 'or', 'also'],
  mid: ['however', 'although', 'therefore', 'while', 'unless', 'whereas', 'moreover', 'in addition', 'on the other hand', 'for example', 'as a result', 'even though', 'instead'],
  adv: ['nevertheless', 'nonetheless', 'furthermore', 'consequently', 'notwithstanding', 'albeit', 'hence', 'thereby', 'in contrast', 'by the same token', 'that said', 'insofar as', 'to some extent', 'not to mention']
};
const STRUCTURES = [
  { id: 'rel', name: 'oraciones de relativo (who/which/whose)', re: /\b(who|which|whose|whom)\b/ },
  { id: 'cond', name: 'condicionales (if … would)', re: /\bif\b[^.!?]*\b(would|'d|could|might)\b|\b(would|could|might)\b[^.!?]*\bif\b/ },
  { id: 'perf', name: 'tiempos perfectos (have/had + participio)', re: /\b(have|has|had)\s+(\w+ed|been|done|gone|seen|made|taken|known|written|given|had)\b/ },
  { id: 'pass', name: 'voz pasiva', re: /\b(is|are|was|were|been|being|be)\s+(\w+ed|built|done|made|taken|known|written|given|seen|sent)\b/ },
  { id: 'modal', name: 'modales en pasado (could/should/must have)', re: /\b(could|should|would|might|must)\s+have\b/ },
  { id: 'inv', name: 'inversión o estructuras enfáticas', re: /\b(not only|no sooner|hardly|rarely|seldom|little did|were it not|had i|should you|what i)\b/ }
];
export const countWords = t => (String(t).match(/[A-Za-z']+/g) || []).length;

export function analyzeText(t) {
  const text = String(t).trim();
  const lower = ' ' + text.toLowerCase().replace(/[’]/g, "'") + ' ';
  const words = lower.match(/[a-z']+/g) || [];
  const wc = words.length;
  const sentences = text.split(/[.!?]+(?:\s|$)/).filter(s => s.trim().split(/\s+/).length >= 2);
  const asl = wc / Math.max(1, sentences.length);
  const guiraud = wc ? new Set(words).size / Math.sqrt(wc) : 0;
  const longRatio = wc ? words.filter(w => w.length >= 7).length / wc : 0;
  const found = k => CONNECTORS[k].filter(c => new RegExp('\\b' + c + '\\b').test(lower));
  const conn = { basic: found('basic'), mid: found('mid'), adv: found('adv') };
  const structs = STRUCTURES.filter(s => s.re.test(lower));
  if (wc < 20) return { wc, asl, guiraud, longRatio, conn, structs, estimate: null };
  let score = 0;
  score += wc >= 40 ? 0.5 : 0; score += wc >= 80 ? 0.5 : 0;
  score += asl < 8 ? 0 : asl < 12 ? 0.5 : asl < 18 ? 1 : 1.2;
  score += guiraud < 5 ? 0 : guiraud < 6.5 ? 0.5 : guiraud < 8 ? 1 : 1.5;
  score += conn.basic.length ? 0.3 : 0;
  score += Math.min(1, conn.mid.length * 0.4) + Math.min(1, conn.adv.length * 0.5);
  score += Math.min(1.2, structs.length * 0.3);
  score += longRatio > 0.22 ? 1 : longRatio > 0.15 ? 0.5 : 0;
  const estimate = score < 1.5 ? 0 : score < 2.5 ? 1 : score < 3.6 ? 2 : score < 4.8 ? 3 : score < 6 ? 4 : 5;
  return { wc, asl, guiraud, longRatio, conn, structs, estimate, score };
}

export function writingTips(a) {
  const tips = [];
  if (a.estimate === null) return ['Escribe al menos 20 palabras para poder estimar tu nivel.'];
  if (a.asl < 9) tips.push('Tus frases son muy cortas. Une ideas con conectores (because, although, which).');
  if (a.asl > 28) tips.push('Algunas frases son muy largas. Divide las que tengan más de una idea principal.');
  if (!a.conn.mid.length) tips.push('Prueba conectores de nivel intermedio: however, although, therefore, on the other hand.');
  else if (!a.conn.adv.length) tips.push('Para subir a C1, incorpora conectores como nevertheless, furthermore o that said.');
  if (a.guiraud < 6) tips.push('Repites bastantes palabras. Busca sinónimos.');
  const missing = STRUCTURES.filter(s => !a.structs.includes(s)).slice(0, 2);
  if (missing.length) tips.push('Estructuras que podrías practicar: ' + missing.map(s => s.name).join('; ') + '.');
  return tips;
}

/** Proporción de palabras de la frase objetivo que aparecen en lo reconocido (0–1). */
export function wordMatch(target, heard) {
  const norm = x => x.toLowerCase().replace(/[^a-z' ]/g, ' ').split(/\s+/).filter(Boolean);
  const t = norm(target), h = norm(heard);
  const bag = {}; h.forEach(w => { bag[w] = (bag[w] || 0) + 1; });
  let hit = 0; t.forEach(w => { if (bag[w]) { bag[w]--; hit++; } });
  return t.length ? hit / t.length : 0;
}

/* ---------- Plan de estudio ---------- */
/** Horas estimadas para pasar del nivel global actual al siguiente, según la distancia de cada destreza. */
export function planHours(levels) {
  const overall = overallLevel(levels);
  if (overall === 5) return 120;
  const target = overall + 1;
  const gapAvg = avg(SKILLS.map(s => Math.min(1, Math.max(0, target - levels[s.id]))));
  const extraGaps = SKILLS.reduce((n, s) => n + Math.max(0, target - levels[s.id] - 1), 0);
  return Math.round(D.hours[overall] * (0.5 + 0.5 * gapAvg) + extraGaps * 25);
}

/** Minutos al día necesarios para llegar a la fecha objetivo (redondeado a 5, entre 10 y 180). */
export function minutesForDate(hours, targetKey, days, from = new Date()) {
  const weeks = Math.max(1, (parseKey(targetKey) - from) / (7 * 86400000));
  const raw = hours * 60 / (weeks * days);
  return Math.min(180, Math.max(10, Math.ceil(raw / 5) * 5));
}

/**
 * Genera el plan. opts: { mode: 'time', minutes, days } o { mode: 'date', date: 'AAAA-MM-DD', days }.
 */
export function buildPlan(levels, opts) {
  const overall = overallLevel(levels);
  const maintain = overall === 5;
  const target = Math.min(overall + 1, 5);
  const days = opts.days;
  const hours = planHours(levels);
  const minutes = opts.mode === 'date' ? minutesForDate(hours, opts.date, days) : opts.minutes;
  const weeks = Math.max(2, Math.ceil(hours * 60 / (minutes * days)));
  const weights = {}, practiceLevel = {};
  SKILLS.forEach(s => {
    const gap = target - levels[s.id];
    weights[s.id] = gap > 0 ? 1 + 1.5 * gap : (maintain ? 1 : 0.6);
    practiceLevel[s.id] = gap > 0 ? Math.min(levels[s.id] + 1, 5) : levels[s.id];
  });

  const perDay = minutes >= 40 ? 3 : minutes >= 20 ? 2 : 1;
  const blockMin = Math.round(minutes / perDay);
  const total = perDay * days;
  const counts = Object.fromEntries(SKILLS.map(s => [s.id, 0]));
  let left = total;
  if (total >= SKILLS.length) { SKILLS.forEach(s => { counts[s.id] = 1; }); left -= SKILLS.length; }
  const wsum = SKILLS.reduce((a, s) => a + weights[s.id], 0);
  const raw = SKILLS.map(s => ({ id: s.id, v: left * weights[s.id] / wsum }));
  raw.forEach(r => { counts[r.id] += Math.floor(r.v); });
  let rest = total - Object.values(counts).reduce((a, b) => a + b, 0);
  raw.sort((a, b) => (b.v % 1) - (a.v % 1) || weights[b.id] - weights[a.id]).forEach(r => { if (rest > 0) { counts[r.id]++; rest--; } });

  const remaining = Object.assign({}, counts);
  const used = Object.fromEntries(SKILLS.map(s => [s.id, 0]));
  const schedule = DAYS.map((_, i) => ({ day: i, blocks: [] }));
  DAY_SETS[days].forEach(di => {
    for (let b = 0; b < perDay; b++) {
      const inDay = schedule[di].blocks.map(x => x.skill);
      const pick = SKILLS.map(s => s.id).filter(id => remaining[id] > 0)
        .sort((a, c) => (inDay.includes(a) - inDay.includes(c)) || remaining[c] - remaining[a] || weights[c] - weights[a])[0];
      if (!pick) break;
      remaining[pick]--;
      const acts = D.activities[pick][bandKey(practiceLevel[pick])];
      schedule[di].blocks.push({ skill: pick, minutes: blockMin, activity: acts[used[pick] % acts.length] });
      used[pick]++;
    }
  });

  const ms = [{ week: Math.min(4, weeks), text: 'Primer control: repite el diagnóstico y actualiza el plan. A partir de aquí, cada 4 semanas.' }];
  if (weeks >= 12) ms.push({ week: Math.round(weeks / 4), text: 'Revisa tus aciertos en Progreso: las destrezas por encima del 70 % pueden practicar ya en el nivel objetivo.' });
  if (weeks >= 6) ms.push({ week: Math.ceil(weeks / 2), text: `Mitad del camino: examen de práctica de ${D.exams[target]}.` });
  if (weeks >= 12) ms.push({ week: Math.round(weeks * 3 / 4), text: 'Simulacro completo con tiempo y ajuste del plan.' });
  ms.push({ week: weeks, text: maintain ? 'Revisión final y nuevo ciclo de perfeccionamiento.' : `Meta ${LV[target]}: diagnóstico completo. Si quieres certificarlo, ${D.exams[target]}.` });
  const milestones = ms.filter((m, i) => !i || m.week > ms[i - 1].week);

  const weakest = SKILLS.slice().sort((a, b) => levels[a.id] - levels[b.id])[0];
  const t1 = Math.max(1, Math.round(weeks / 3)), t2 = Math.max(t1 + 1, Math.round(weeks * 2 / 3));
  const phases = [
    { from: 1, to: t1, name: 'Base', text: `Rutina diaria y refuerzo de ${weakest.name.toLowerCase()}.` },
    { from: t1 + 1, to: t2, name: 'Consolidación', text: `Materiales de nivel ${LV[target]} aunque cueste. Mucha lectura y escucha.` },
    { from: t2 + 1, to: weeks, name: 'Transferencia', text: 'Inglés en tareas reales: conversación, textos largos y simulacros.' }
  ].filter(p => p.from <= p.to);

  return {
    created: todayKey(), mode: opts.mode, targetDate: opts.mode === 'date' ? opts.date : null,
    from: overall, target, maintain, minutes, days, perDay, weeks, hours,
    endDate: dateKey(addDays(new Date(), weeks * 7)), counts, practiceLevel, schedule, milestones, phases,
    levels: Object.assign({}, levels)
  };
}

/* ---------- Seguimiento ---------- */
export function weekMinutes(sessions) {
  const ws = dateKey(weekStart());
  return sessions.filter(l => l.date >= ws).reduce((a, l) => a + (l.minutes || 0), 0);
}
export function streak(sessions) {
  const days = new Set(sessions.map(l => l.date));
  let d = new Date(); let n = 0;
  if (!days.has(dateKey(d))) d = addDays(d, -1);
  while (days.has(dateKey(d))) { n++; d = addDays(d, -1); }
  return n;
}
export function makeInviteCode(groupName) {
  const prefix = (String(groupName).match(/[A-C][12]/i) || ['GR'])[0].toUpperCase();
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  const rnd = new Uint32Array(6);
  globalThis.crypto.getRandomValues(rnd);
  rnd.forEach(n => { s += alphabet[n % alphabet.length]; });
  return `${prefix}-${s.slice(0, 3)}-${s.slice(3)}`;
}
