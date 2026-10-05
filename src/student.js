/* Vistas del alumno: inicio, diagnóstico, plan, práctica (con IA), tareas de clase y progreso. */
import { D } from './data.js';
import {
  LV, LV_NAME, SKILLS, SK, MC_SKILLS, DAYS, bandKey, todayKey, weekday, fmtDate, overallLevel, canDoLevel, adaptiveStep,
  analyzeText, writingTips, wordMatch, buildPlan, planHours, minutesForDate, weekMinutes, streak, countWords, pad, addDays, dateKey
} from './core.js';
import {
  S, views, actions, forms, changes, esc, lvl, lvlCode, shuffle, render, go, toast, attempt, ladder, evaluationView,
  TTS, SR, speak, stopSpeech, setWave
} from './ui.js';

/* =========================================================
   Datos
   ========================================================= */
export async function loadStudent() {
  const c = S.cloud;
  const [sessions, diagnoses, mySubs, group, assignments] = await Promise.all([
    c.listSub('sessions'), c.listSub('diagnoses'), c.listMySubmissions(),
    S.me.groupId ? c.getGroup(S.me.groupId) : null,
    S.me.groupId ? c.listAssignmentsForGroup(S.me.groupId) : []
  ]);
  Object.assign(S, { sessions, diagnoses, mySubs, group, assignments: assignments.sort((a, b) => (a.due || '').localeCompare(b.due || '')) });
}

const hasLevels = () => S.me && S.me.levels;
const minutesSince = t => Math.max(1, Math.round((Date.now() - t) / 60000));

async function logSession(entry) {
  const e = { ...entry, date: todayKey() };
  await attempt(() => S.cloud.addSub('sessions', e));
  S.sessions.push(e);
  const plan = S.me.plan;
  if (plan && plan.schedule) {
    const blocks = plan.schedule[weekday()].blocks;
    const done = (S.me.done && S.me.done[e.date]) || [];
    const idx = blocks.findIndex((b, i) => b.skill === e.skill && !done.includes(i));
    if (idx >= 0) await saveDone([...done, idx]);
  }
}
async function saveDone(list) {
  const done = { [todayKey()]: list };
  S.me.done = done;
  await attempt(() => S.cloud.updateMe({ done }));
}
const submissionFor = aid => S.mySubs.filter(s => s.assignmentId === aid).sort((a, b) => b.createdAt - a.createdAt)[0];
const STATUS = { pending: ['Pendiente de revisión', 'warn'], reviewed: ['Revisada', 'ok'], redo: ['Repetir', 'bad'], done: ['Hecha', 'ok'] };
const statusPill = s => { const [t, k] = STATUS[s] || STATUS.pending; return `<span class="pill ${k}">${t}</span>`; };

/* =========================================================
   Inicio
   ========================================================= */
views.inicio = { role: 'student', render() {
  const me = S.me;
  const tasks = classTasks();
  if (!hasLevels()) {
    return `<section class="stack"><p class="eyebrow">Hola, ${esc(me.name.split(' ')[0])}</p>
      <h1>¿Qué nivel de inglés tienes hoy y qué necesitas para subir al siguiente?</h1>
      <p class="lead">Empieza con el diagnóstico: mide seis destrezas en unos 20 minutos y prepara tu plan. Tu profesor verá tu avance.</p>
      <div class="row"><a class="btn primary" href="#diagnostico">Empezar diagnóstico</a></div></section>
      ${tasks}
      <section class="panel"><h2>Cómo funciona</h2><ol class="steps">
        <li><b>Diagnóstico adaptativo</b><span class="muted small">Sube o baja de nivel según aciertes.</span></li>
        <li><b>Plan al siguiente nivel</b><span class="muted small">Por tiempo diario o por fecha objetivo.</span></li>
        <li><b>Práctica con IA y profesor</b><span class="muted small">La IA corrige tus textos y grabaciones; tu profesor valida la nota.</span></li></ol></section>`;
  }
  const plan = me.plan;
  const target = plan ? plan.target : Math.min(me.overall + 1, 5);
  let today = '';
  if (plan && plan.schedule) {
    const wd = weekday(), blocks = plan.schedule[wd].blocks, done = (me.done && me.done[todayKey()]) || [];
    const planned = plan.minutes * plan.days, wm = weekMinutes(S.sessions);
    today = `<section class="panel">
      <div class="row between"><h2>Hoy · ${DAYS[wd]}</h2><span class="small muted">${done.length}/${blocks.length} tareas</span></div>
      ${blocks.length ? `<div>${blocks.map((b, i) => `<div class="task${done.includes(i) ? ' done' : ''}">
          <input type="checkbox" id="task-${i}" data-action="toggle-task" data-i="${i}" ${done.includes(i) ? 'checked' : ''}>
          <div class="task-body"><span class="tag">${SK[b.skill].name} · ${b.minutes} min · ${LV[plan.practiceLevel[b.skill]]}</span><label for="task-${i}">${esc(b.activity)}</label></div>
          ${done.includes(i) ? '<span></span>' : `<button class="btn small" data-action="goto-practice" data-skill="${b.skill}">Practicar</button>`}</div>`).join('')}</div>`
        : '<p class="muted">Hoy es día de descanso en tu plan.</p>'}
      <div class="stack-sm"><div class="row between small"><span>Minutos esta semana</span><span class="mono">${wm} / ${planned}</span></div>
      <div class="progressbar"><span style="width:${Math.min(100, Math.round(wm / planned * 100))}%"></span></div></div></section>`;
  }
  return `<section class="panel">
      <div class="row between"><div class="hero-levels">
        <span class="stack-sm"><span class="small muted">Nivel global</span>${lvl(me.overall, true)}</span><span class="arrow">→</span>
        <span class="stack-sm"><span class="small muted">Objetivo</span>${lvl(target, true)}</span></div>
        <div class="stack-sm" style="text-align:right"><b class="mono" style="font-size:1.5rem">${streak(S.sessions)}</b><span class="small muted">días seguidos</span></div></div>
      ${plan ? '' : '<div class="banner"><span>Ya tienes tu nivel. Ahora crea tu plan.</span><a class="btn small primary" href="#plan">Crear mi plan</a></div>'}
    </section>
    ${tasks}${today}`;
} };

function classTasks() {
  const open = S.assignments.filter(a => { const s = submissionFor(a.id); return !s || s.status === 'redo'; });
  const recent = S.mySubs.filter(s => s.status === 'reviewed' && s.reviewedAt && Date.now() - s.reviewedAt < 7 * 86400000);
  if (!open.length && !recent.length) return '';
  return `<section class="panel class-task"><h2>Tareas de clase</h2>
    ${open.map(a => `<div class="row between task-line"><div class="stack-sm"><b>${esc(a.title)}</b><span class="small muted">${TYPE_NAME[a.type]} · ${LV[a.level]}${a.due ? ' · entrega ' + fmtDate(a.due) : ''}${submissionFor(a.id) ? ' · tu profesor pide que la repitas' : ''}</span></div>
      <button class="btn small primary" data-action="open-assignment" data-id="${a.id}">Hacer tarea</button></div>`).join('')}
    ${recent.map(s => `<div class="row between task-line"><div class="stack-sm"><b>${esc(s.assignmentTitle || 'Tarea')}</b><span class="small muted">Revisada por tu profesor</span></div>
      <button class="btn small" data-action="open-assignment" data-id="${s.assignmentId}">Ver nota</button></div>`).join('')}
  </section>`;
}
const TYPE_NAME = { quiz: 'Preguntas', writing: 'Redacción con IA', speaking: 'Grabación oral con IA', reading: 'Lectura', listening: 'Escucha' };

actions['toggle-task'] = el => {
  const i = Number(el.dataset.i), done = ((S.me.done && S.me.done[todayKey()]) || []).slice();
  const at = done.indexOf(i);
  if (at >= 0) done.splice(at, 1); else done.push(i);
  saveDone(done).then(render);
};
actions['goto-practice'] = el => { prac = { skill: el.dataset.skill, level: null, session: null }; go('practica'); };

/* =========================================================
   Diagnóstico
   ========================================================= */
let diag = null;
const DIAG_STAGES = ['reading', 'listening', 'grammar', 'vocabulary', 'writing', 'speaking'];
const newMC = skill => ({ skill, level: 2, tried: {}, plays: 0 });

views.diagnostico = { role: 'student', render() {
  if (!diag) {
    return `<section class="stack"><p class="eyebrow">Diagnóstico</p><h1>Prueba de nivel en seis destrezas</h1>
      <p class="lead">Unos 20 minutos. Las preguntas se adaptan: si aciertas sube la dificultad y si fallas baja. No uses diccionario.</p></section>
      <section class="panel"><ul class="clean">
        <li><b>Lectura y escucha:</b> textos y audios breves con 3 preguntas. El audio se puede oír dos veces.</li>
        <li><b>Gramática y vocabulario:</b> bloques de 3 preguntas por nivel.</li>
        <li><b>Escritura:</b> un texto de 80–150 palabras que corrige la IA, y una lista de «puedo…».</li>
        <li><b>Expresión oral:</b> autoevaluación con descriptores del MCER.</li></ul>
      ${hasLevels() ? `<p class="small muted">Último diagnóstico: ${fmtDate(S.me.diagDate)} (${LV[S.me.overall]}).</p>` : ''}
      <div class="row"><button class="btn primary" data-action="diag-start">Comenzar</button></div></section>`;
  }
  if (diag.stage === 6) return diagResults();
  const st = DIAG_STAGES[diag.stage];
  const prog = `<div class="stack-sm"><span class="eyebrow">Parte ${diag.stage + 1} de 6 · ${SK[st].name}</span>
    <div class="progressbar"><span style="width:${Math.round(diag.stage / 6 * 100)}%"></span></div></div>`;
  return prog + (diag.stage < 4 ? diagMC() : diagCando(st));
} };

function mcItems(skill, level) {
  if (skill === 'reading') return D.reading[level].questions;
  if (skill === 'listening') return D.listening[level].questions;
  return D[skill][level].slice(0, 3);
}
function mcQuestion(q, name, i) {
  return `<fieldset class="q"><legend class="q-text">${i + 1}. ${esc(q.q)}</legend>
    <div class="opts">${q.options.map((o, j) => `<label class="opt" data-q="${i}" data-o="${j}"><input type="radio" name="${name}${i}" value="${j}"><span>${esc(o)}</span></label>`).join('')}</div></fieldset>`;
}
function audioBox(id, extra) {
  return `<div class="audio-box"><button type="button" class="btn primary" data-action="play" data-id="${id}">▶ Escuchar</button><span class="wave" aria-hidden="true"><i></i><i></i><i></i><i></i></span>${extra || ''}</div>
    ${TTS ? '' : '<p class="feedback ko">Tu navegador no tiene voz sintética. Se muestra la transcripción.</p>'}`;
}
function diagMC() {
  const { skill, level } = diag.mc;
  let head = '';
  if (skill === 'reading') head = `<h2 lang="en">${esc(D.reading[level].title)}</h2><div class="passage" lang="en">${esc(D.reading[level].text)}</div>`;
  if (skill === 'listening') {
    const l = D.listening[level];
    head = `<h2 lang="en">${esc(l.title)}</h2>${audioBox('diag-listen', `<span class="small muted">Quedan <b class="mono" id="plays-left">${2 - diag.mc.plays}</b></span>`)}
      ${TTS ? '' : `<div class="passage" lang="en">${esc(l.script)}</div>`}`;
  }
  if (skill === 'grammar') head = '<h2>Elige la opción correcta</h2>';
  if (skill === 'vocabulary') head = '<h2>Elige la palabra adecuada</h2>';
  return `<form class="panel" data-form="diag-mc">${head}<div class="stack" lang="en">${mcItems(skill, level).map((q, i) => mcQuestion(q, 'dq', i)).join('')}</div>
    <p class="small error" id="form-msg" hidden></p><div class="row"><button class="btn primary" type="submit">Continuar</button></div></form>`;
}
function collect(form, name, n) {
  const out = [];
  for (let i = 0; i < n; i++) { const r = form.querySelector(`input[name="${name}${i}"]:checked`); out.push(r ? Number(r.value) : null); }
  return out;
}
forms['diag-mc'] = form => {
  const { skill, level } = diag.mc;
  const qs = mcItems(skill, level), ans = collect(form, 'dq', qs.length);
  if (ans.includes(null)) { const m = form.querySelector('#form-msg'); m.textContent = 'Responde todas las preguntas. Si no sabes, elige la más probable.'; m.hidden = false; return; }
  stopSpeech();
  const step = adaptiveStep(diag.mc.tried, level, ans.filter((a, i) => a === qs[i].answer).length >= 2);
  diag.mc.plays = 0;
  if (step.final !== undefined) {
    diag.results[skill] = step.final;
    if (step.below) diag.below[skill] = true;
    diag.stage++;
    if (diag.stage < 4) diag.mc = newMC(DIAG_STAGES[diag.stage]);
  } else diag.mc.level = step.level;
  render(); window.scrollTo(0, 0);
};
actions['diag-start'] = () => { diag = { stage: 0, results: {}, below: {}, mc: newMC('reading'), writing: null }; render(); };
actions['diag-reset'] = () => { diag = null; render(); };

function diagCando(skill) {
  const isW = skill === 'writing';
  return `<form class="panel" data-form="diag-cando" data-skill="${skill}"><h2>${SK[skill].name}</h2>
    ${isW ? `<div class="stack-sm"><p><b>1. Escribe un texto breve.</b> Lo corregirá la IA.</p>
      <div class="passage" lang="en">${esc(D.diagnosticWritingPrompt)}</div>
      <textarea id="diag-text" aria-label="Tu texto" lang="en" spellcheck="false" placeholder="Write here…"></textarea>
      <p class="small muted"><span class="mono" data-wc>0</span> palabras</p></div><p><b>2. Marca lo que puedes hacer por escrito</b> sin ayuda.</p>`
    : '<p>Marca lo que puedes hacer <b>hablando en inglés</b> sin preparación. Sé realista.</p>'}
    <div>${D.cando[skill].map((arr, i) => `<div class="cando-level"><div class="row">${lvl(i)}<span class="small muted">${LV_NAME[i]}</span></div>
      ${arr.map((s, j) => `<label class="check"><input type="checkbox" name="cd${i}" value="${j}"><span>${esc(s)}</span></label>`).join('')}</div>`).join('')}</div>
    <p class="small error" id="form-msg" hidden></p>
    <div class="row"><button class="btn primary" type="submit">${isW ? 'Corregir y continuar' : 'Ver resultados'}</button></div></form>`;
}
forms['diag-cando'] = async (form) => {
  const skill = form.dataset.skill;
  const counts = [0, 1, 2, 3, 4, 5].map(i => form.querySelectorAll(`input[name="cd${i}"]:checked`).length);
  const self = canDoLevel(counts, D.cando[skill]);
  let level = Math.max(0, self);
  const msg = form.querySelector('#form-msg');
  if (skill === 'writing') {
    const text = form.querySelector('#diag-text').value;
    if (text.trim() && countWords(text) < 20) { msg.textContent = 'Escribe al menos 20 palabras, o deja el texto vacío para usar solo la autoevaluación.'; msg.hidden = false; return; }
    if (text.trim()) {
      const btn = form.querySelector('button[type=submit]'); btn.disabled = true; btn.textContent = 'Corrigiendo con IA…';
      const res = await attempt(() => S.cloud.evaluate({ kind: 'writing', level: 'B1', prompt: D.diagnosticWritingPrompt, text }), msg);
      const textLevel = res ? LV.indexOf(res.evaluation.overall) : analyzeText(text).estimate;
      diag.writing = res ? res.evaluation : null;
      if (!res) { msg.hidden = true; toast('No se pudo usar la IA; se ha estimado el nivel con métricas del texto.'); }
      if (textLevel != null && textLevel >= 0) level = Math.round((Math.max(0, self) + textLevel) / 2);
    }
  }
  if (self < 0) diag.below[skill] = true;
  diag.results[skill] = level;
  diag.stage++;
  if (diag.stage === 6) await saveDiagnosis();
  render(); window.scrollTo(0, 0);
};
async function saveDiagnosis() {
  const levels = Object.assign({}, diag.results);
  const overall = overallLevel(levels);
  const patch = { levels, overall, diagDate: todayKey(), below: diag.below };
  await attempt(async () => {
    await S.cloud.updateMe(patch);
    await S.cloud.addSub('diagnoses', { date: todayKey(), levels, overall });
  });
  Object.assign(S.me, patch);
  S.diagnoses.push({ date: todayKey(), levels, overall });
}
function diagResults() {
  const me = S.me, target = Math.min(me.overall + 1, 5);
  const sorted = SKILLS.slice().sort((a, b) => me.levels[a.id] - me.levels[b.id]);
  return `<section class="stack"><p class="eyebrow">Resultados</p><h1>Tu nivel global es ${LV[me.overall]}</h1>
    <p class="lead">${me.overall === 5 ? 'Estás en el nivel más alto del marco.' : `Tu meta es ${LV[target]}. Lo que más te frena es <b>${sorted[0].name.toLowerCase()}</b>; tu punto fuerte, <b>${sorted[5].name.toLowerCase()}</b>.`}</p></section>
    <section class="panel"><div class="hero-levels">${lvl(me.overall, true)}<span class="arrow">→</span>${lvl(target, true)}</div>${ladder(me.levels, target)}</section>
    ${diag.writing ? evaluationView(diag.writing) : ''}
    <section class="panel"><h2>Siguiente paso</h2><p>${me.plan ? 'Actualiza tu plan con estos niveles.' : 'Crea tu plan semanal.'}</p>
      <div class="row"><button class="btn primary" data-action="diag-to-plan">${me.plan ? 'Actualizar mi plan' : 'Crear mi plan'}</button></div></section>`;
}
actions['diag-to-plan'] = () => { diag = null; go('plan'); };

/* =========================================================
   Plan
   ========================================================= */
let planDraft = null; // { mode, minutes, days, date }
const defaultDate = () => dateKey(addDays(new Date(), 26 * 7));

function planForm() {
  const p = S.me.plan;
  const d = planDraft || (planDraft = { mode: p ? p.mode || 'time' : 'time', minutes: p ? p.minutes : 30, days: p ? p.days : 5, date: (p && p.targetDate) || defaultDate() });
  const hours = planHours(S.me.levels);
  const need = d.mode === 'date' ? minutesForDate(hours, d.date, d.days) : null;
  const weeks = Math.ceil(hours * 60 / ((need || d.minutes) * d.days));
  return `<form class="panel" data-form="plan">
    <span class="small"><b>Calcular el plan a partir de</b></span>
    <div class="toggle" role="group" aria-label="Modo de cálculo">
      <button type="button" data-action="plan-mode" data-v="time" aria-pressed="${d.mode === 'time'}">Mi tiempo diario</button>
      <button type="button" data-action="plan-mode" data-v="date" aria-pressed="${d.mode === 'date'}">Una fecha objetivo</button></div>
    <div class="row" style="align-items:flex-end">
      ${d.mode === 'date'
        ? `<label class="field" for="pl-date">Fecha objetivo<input type="date" id="pl-date" name="date" value="${d.date}" min="${dateKey(addDays(new Date(), 21))}" data-change="plan-input"></label>`
        : `<label class="field" for="pl-min">Minutos al día<select id="pl-min" name="minutes" data-change="plan-input">${[15, 20, 30, 45, 60, 90].map(v => `<option value="${v}"${v === d.minutes ? ' selected' : ''}>${v} min</option>`).join('')}</select></label>`}
      <label class="field" for="pl-days">Días por semana<select id="pl-days" name="days" data-change="plan-input">${[3, 4, 5, 6, 7].map(v => `<option value="${v}"${v === d.days ? ' selected' : ''}>${v} días</option>`).join('')}</select></label>
    </div>
    <div class="feedback info">${d.mode === 'date'
      ? `Necesitas unos <b class="mono">${need} min</b> al día, ${d.days} días por semana.${need >= 180 ? ' Es mucho: considera una fecha más lejana.' : ''}`
      : `Con <b class="mono">${d.minutes} min</b> al día, ${d.days} días por semana, llegarías en unas <b>${weeks} semanas</b> (${fmtDate(dateKey(addDays(new Date(), weeks * 7)))}).`}
      <span class="small muted">Unas ${hours} h de práctica.</span></div>
    <div class="row"><button class="btn primary" type="submit">${p ? 'Actualizar plan' : 'Guardar plan'}</button></div></form>`;
}
actions['plan-mode'] = el => { planDraft.mode = el.dataset.v; render(); };
changes['plan-input'] = el => {
  if (el.name === 'date') planDraft.date = el.value; else planDraft[el.name] = Number(el.value);
  render();
};
forms.plan = async () => {
  const plan = buildPlan(S.me.levels, planDraft);
  await attempt(() => S.cloud.updateMe({ plan }));
  S.me.plan = plan;
  toast('Plan guardado. Tu profesor lo verá en el panel del grupo.');
  render(); window.scrollTo(0, 0);
};

views.plan = { role: 'student', render() {
  if (!hasLevels()) return `<section class="stack"><p class="eyebrow">Mi plan</p><h1>Primero necesitamos saber tu nivel</h1>
    <div class="row"><a class="btn primary" href="#diagnostico">Hacer el diagnóstico</a></div></section>`;
  const plan = S.me.plan;
  const stale = plan && JSON.stringify(plan.levels) !== JSON.stringify(S.me.levels);
  if (!plan) return `<section class="stack"><p class="eyebrow">Mi plan</p><h1>Plan para pasar de ${LV[S.me.overall]} a ${LV[Math.min(S.me.overall + 1, 5)]}</h1>
    <p class="lead">Elige si prefieres partir de tu tiempo disponible o de una fecha. Mejor poco y constante.</p></section>${planForm()}`;
  const wd = weekday();
  return `${stale ? '<div class="banner"><span>Tienes un diagnóstico más reciente que este plan. Actualízalo abajo.</span></div>' : ''}
    <section class="stack"><p class="eyebrow">Mi plan · creado el ${fmtDate(plan.created)}</p>
      <h1>${plan.maintain ? 'Perfeccionamiento en C2' : plan.mode === 'date' ? `De ${LV[plan.from]} a ${LV[plan.target]} antes del ${fmtDate(plan.targetDate)}` : `De ${LV[plan.from]} a ${LV[plan.target]} en unas ${plan.weeks} semanas`}</h1>
      <p class="lead">~${plan.hours} h · ${plan.minutes} min/día · ${plan.days} días por semana · fin estimado ${fmtDate(plan.endDate)}</p></section>
    <section class="panel"><h2>Dónde pones el foco</h2>${ladder(plan.levels, plan.target)}
      <div class="bars">${SKILLS.slice().sort((a, b) => plan.counts[b.id] - plan.counts[a.id]).map(s => {
        const mins = plan.counts[s.id] * Math.round(plan.minutes / plan.perDay);
        return `<div class="bar-row"><span>${s.name}</span><div class="bar"><span style="width:${Math.round(mins / (plan.minutes * plan.days) * 100)}%"></span></div><span class="mono">${mins}′/sem</span></div>`;
      }).join('')}</div></section>
    <section class="panel"><h2>Semana tipo</h2>
      <div class="week-wrap"><div class="week">${plan.schedule.map(d => `<div class="day${d.day === wd ? ' today' : ''}${d.blocks.length ? '' : ' rest'}"><h4>${DAYS[d.day]}</h4>
        ${d.blocks.length ? d.blocks.map(b => `<div class="blk"><b>${SK[b.skill].name}</b><span class="muted">${b.minutes} min · ${LV[plan.practiceLevel[b.skill]]}</span></div>`).join('') : '<span class="small muted">Descanso</span>'}</div>`).join('')}</div></div></section>
    <section class="grid-2">
      <div class="panel"><h2>Fases</h2><ul class="timeline">${plan.phases.map(ph => `<li><span class="mono small">Sem. ${ph.from}${ph.to > ph.from ? '–' + ph.to : ''}</span><div><b>${ph.name}</b><p class="small muted">${esc(ph.text)}</p></div></li>`).join('')}</ul></div>
      <div class="panel"><h2>Hitos</h2><ul class="timeline">${plan.milestones.map(m => `<li><span class="mono small">Sem. ${m.week}</span><span class="small">${esc(m.text)}</span></li>`).join('')}</ul></div>
    </section>
    <section class="stack"><h2>Ajustar el plan</h2>${planForm()}</section>`;
} };

/* =========================================================
   Práctica (incluye escritura y expresión oral con IA)
   ========================================================= */
let prac = { skill: 'reading', level: null, session: null };
const defaultLevel = skill => S.me.plan ? S.me.plan.practiceLevel[skill] : hasLevels() ? Math.min(5, S.me.levels[skill] + 1) : 2;

views.practica = { role: 'student', render() {
  if (prac.level == null) prac.level = defaultLevel(prac.skill);
  return `<section class="stack"><p class="eyebrow">Práctica</p><h1>${SK[prac.skill].name}</h1>
    <div class="chips" role="group" aria-label="Destreza">${SKILLS.map(x => `<button class="chip" data-action="prac-skill" data-skill="${x.id}" aria-pressed="${x.id === prac.skill}">${x.name}</button>`).join('')}</div>
    <div class="row small"><span class="muted">Nivel:</span><div class="chips" role="group" aria-label="Nivel">${LV.map((l, i) => `<button class="chip" data-action="prac-level" data-level="${i}" aria-pressed="${i === prac.level}">${l}</button>`).join('')}</div>
    ${hasLevels() ? `<span class="muted">Recomendado: ${LV[defaultLevel(prac.skill)]}</span>` : ''}</div></section>
    ${prac.session ? practiceSession(prac.session) : practiceIntro()}`;
} };
function practiceIntro() {
  const k = prac.skill, L = LV[prac.level];
  const info = {
    reading: `Un texto de nivel ${L} con 3 preguntas.`, listening: `Un audio de nivel ${L} con 3 preguntas. Puedes ajustar la velocidad.`,
    grammar: `5 preguntas de gramática de nivel ${L} con explicación.`, vocabulary: `5 preguntas de vocabulario de nivel ${L}.`,
    writing: `Una consigna de nivel ${L}. La IA corrige tu texto.`, speaking: 'Shadowing (escucha y repite) o una respuesta oral que evalúa la IA.'
  }[k];
  const btns = k === 'speaking'
    ? '<button class="btn primary" data-action="prac-start" data-mode="talk">Respuesta oral con IA</button><button class="btn" data-action="prac-start" data-mode="shadow">Shadowing</button>'
    : '<button class="btn primary" data-action="prac-start">Empezar</button>';
  return `<section class="panel"><p>${info}</p><div class="row">${btns}</div></section>`;
}
function startPractice(mode) {
  const k = prac.skill, L = prac.level;
  const s = { skill: k, level: L, start: Date.now(), mode: mode || null };
  if (k === 'grammar' || k === 'vocabulary') Object.assign(s, { items: shuffle(D[k][L]), idx: 0, correct: 0, answered: null });
  if (k === 'reading' || k === 'listening') Object.assign(s, { checked: null, rate: k === 'listening' ? D.listening[L].rate : 1, src: k === 'listening' ? D.listening[L] : D.reading[L] });
  if (k === 'writing') Object.assign(s, { prompt: D.writingPrompts[L][Math.floor(Math.random() * 2)], text: '' });
  if (k === 'speaking' && mode === 'talk') Object.assign(s, { prompt: D.speakingPrompts[L][Math.floor(Math.random() * 2)], text: '', secs: 0 });
  if (k === 'speaking' && mode === 'shadow') s.scores = {};
  prac.session = s;
}
async function finishPractice(correct, total) {
  const s = prac.session;
  s.finished = { correct, total };
  render();
  await logSession({ skill: s.skill, level: s.level, correct, total, minutes: minutesSince(s.start) });
}
function practiceSession(s) {
  if (s.finished) {
    const f = s.finished, r = f.total ? f.correct / f.total : null;
    return `<section class="panel"><h2>Sesión guardada</h2>
      ${f.total ? `<p>Has acertado <b class="mono">${f.correct}/${f.total}</b>.</p>` : '<p>Sesión registrada en tu progreso.</p>'}
      ${r != null && r >= 0.8 && s.level < 5 ? `<p class="feedback ok">Buen resultado. Prueba ${LV[s.level + 1]} cuando aciertes así de forma constante.</p>` : ''}
      ${r != null && r < 0.5 && s.level > 0 ? `<p class="feedback ko">Te ha costado. Repasa o practica un rato en ${LV[s.level - 1]}.</p>` : ''}
      <div class="row"><button class="btn primary" data-action="prac-again">Otra sesión</button><a class="btn" href="#inicio">Volver a hoy</a></div></section>`;
  }
  if (s.skill === 'grammar' || s.skill === 'vocabulary') return quizView(s.items[s.idx], s.idx, s.items.length, s.correct, s.answered);
  if (s.skill === 'reading' || s.skill === 'listening') return comprehensionView(s, 'comp');
  if (s.skill === 'writing') return writingView(s, 'prac-write');
  return s.mode === 'talk' ? talkView(s, 'prac-talk') : shadowView(s);
}
export function quizView(q, idx, n, correct, a) {
  return `<section class="panel"><div class="stack-sm"><div class="row between small"><span class="muted">Pregunta ${idx + 1} de ${n}</span><span class="mono">${correct} aciertos</span></div>
    <div class="progressbar"><span style="width:${idx / n * 100}%"></span></div></div>
    <p class="q-text" lang="en" style="font-size:1.15rem">${esc(q.q)}</p>
    <div class="opts" lang="en">${q.options.map((o, j) => `<button class="opt${a !== null ? (j === q.answer ? ' correct' : j === a ? ' wrong' : '') : ''}" data-action="quiz-answer" data-o="${j}" ${a !== null ? 'disabled' : ''}>${esc(o)}</button>`).join('')}</div>
    ${a !== null ? `<div class="feedback ${a === q.answer ? 'ok' : 'ko'}"><b>${a === q.answer ? 'Correcto.' : 'Respuesta correcta: ' + esc(q.options[q.answer]) + '.'}</b> ${q.explain ? esc(q.explain) : ''}</div>
      <div class="row"><button class="btn primary" data-action="quiz-next">${idx + 1 < n ? 'Siguiente' : 'Terminar'}</button></div>` : ''}</section>`;
}
function comprehensionView(s, formName) {
  const isL = s.skill === 'listening', src = s.src, ch = s.checked;
  const head = isL
    ? `${audioBox('prac-listen', `<label class="small" for="rate">Velocidad <select id="rate" data-change="rate">${[0.7, 0.8, 0.9, 1, 1.1, 1.2].map(r => `<option value="${r}"${Math.abs(r - s.rate) < 0.01 ? ' selected' : ''}>${r}×</option>`).join('')}</select></label>`)}
       ${!TTS || ch ? `<details${ch ? ' open' : ''}><summary>Transcripción</summary><div class="passage" lang="en">${esc(src.script)}</div></details>` : ''}`
    : `<div class="passage" lang="en">${esc(src.text)}</div>`;
  return `<form class="panel" data-form="${formName}"><h2 lang="en">${esc(src.title)}</h2>${head}
    <div class="stack" lang="en">${src.questions.map((q, i) => {
      const a = ch && ch.ans[i];
      return `<fieldset class="q"><legend class="q-text">${i + 1}. ${esc(q.q)}</legend><div class="opts">${q.options.map((o, j) =>
        `<label class="opt${ch ? (j === q.answer ? ' correct' : j === a ? ' wrong' : '') : ''}"><input type="radio" name="cq${i}" value="${j}" ${ch ? 'disabled' : ''} ${ch && j === a ? 'checked' : ''}><span>${esc(o)}</span></label>`).join('')}</div></fieldset>`;
    }).join('')}</div>
    <p class="small error" id="form-msg" hidden></p>
    <div class="row">${ch ? `<span><b class="mono">${ch.correct}/${src.questions.length}</b> correctas</span><button type="button" class="btn primary" data-action="${formName}-save">Guardar</button>` : '<button class="btn primary" type="submit">Comprobar</button>'}</div></form>`;
}
function checkComprehension(form, s) {
  const ans = collect(form, 'cq', s.src.questions.length);
  if (ans.includes(null)) { const m = form.querySelector('#form-msg'); m.textContent = 'Responde todas las preguntas antes de comprobar.'; m.hidden = false; return false; }
  stopSpeech();
  s.checked = { ans, correct: ans.filter((a, i) => a === s.src.questions[i].answer).length, total: s.src.questions.length };
  return true;
}
forms.comp = form => { if (checkComprehension(form, prac.session)) render(); };
actions['comp-save'] = () => finishPractice(prac.session.checked.correct, prac.session.checked.total);

function writingView(s, formName) {
  return `<form class="panel" data-form="${formName}"><h2>Consigna</h2><div class="passage" lang="en">${esc(s.prompt)}</div>
    <label class="field" for="w-text">Tu texto</label>
    <textarea id="w-text" lang="en" spellcheck="false" placeholder="Write here…" ${s.ai ? 'readonly' : ''}>${esc(s.text || '')}</textarea>
    <p class="small muted"><span class="mono" data-wc>${countWords(s.text || '')}</span> palabras</p>
    <p class="small error" id="form-msg" hidden></p>
    ${s.ai ? '' : `<div class="row"><button class="btn primary" type="submit" ${s.busy ? 'disabled' : ''}>${s.busy ? 'Corrigiendo con IA…' : 'Corregir con IA'}</button></div>`}
  </form>${s.ai ? evaluationView(s.ai) : ''}`;
}
async function evaluateInto(s, kind, form) {
  const text = form.querySelector('#w-text, #talk-text').value;
  s.text = text;
  const msg = form.querySelector('#form-msg');
  if (countWords(text) < 15) { msg.textContent = 'Escribe o di al menos 15 palabras.'; msg.hidden = false; return false; }
  s.busy = true; render();
  const res = await attempt(() => S.cloud.evaluate({ kind, level: LV[s.level], prompt: s.prompt, text }));
  s.busy = false;
  if (res) { s.ai = res.evaluation; if (res.remaining != null && res.remaining <= 5) toast(`Te quedan ${res.remaining} evaluaciones con IA este mes.`); }
  render();
  return !!res;
}
forms['prac-write'] = async form => {
  const s = prac.session;
  if (await evaluateInto(s, 'writing', form)) await logSession({ skill: 'writing', level: s.level, correct: 0, total: 0, minutes: minutesSince(s.start), ai: s.ai.overall });
};

/* ---------- Respuesta oral con reconocimiento de voz ---------- */
let rec = null, recTimer = null;
function talkView(s, formName) {
  const t = `${Math.floor(s.secs / 60)}:${pad(s.secs % 60)}`;
  return `<form class="panel" data-form="${formName}"><h2>Consigna</h2><div class="passage" lang="en">${esc(s.prompt)}</div>
    ${SR ? `<p class="small muted">Piensa 30 segundos, pulsa «Grabar» y habla entre 1 y 2 minutos. El navegador convierte tu voz en texto; luego la IA lo evalúa.</p>
      <div class="row rec-row"><button type="button" class="rec${s.recording ? ' on' : ''}" data-action="talk-rec" ${s.ai ? 'disabled' : ''}>${s.recording ? 'Parar' : 'Grabar'}</button><span class="timer" id="talk-timer">${t}</span></div>`
    : '<p class="feedback ko">Tu navegador no convierte voz en texto. Usa Chrome, Edge o Safari para grabar tu respuesta.</p>'}
    <label class="field" for="talk-text">Lo que has dicho (transcripción)</label>
    <textarea id="talk-text" lang="en" spellcheck="false" placeholder="${SR ? 'Aquí aparecerá tu transcripción.' : ''}" ${s.ai || s.recording ? 'readonly' : ''}>${esc(s.text || '')}</textarea>
    <p class="small muted">Corrige solo palabras que el navegador haya entendido mal, no tu gramática. <span class="mono" data-wc>${countWords(s.text || '')}</span> palabras.</p>
    <p class="small error" id="form-msg" hidden></p>
    ${s.ai ? '' : `<div class="row"><button class="btn primary" type="submit" ${s.busy || s.recording ? 'disabled' : ''}>${s.busy ? 'Evaluando con IA…' : 'Evaluar con IA'}</button></div>`}
    <p class="small muted">En esta versión no se guarda el audio: la IA y tu profesor evalúan la transcripción, así que la pronunciación no se puntúa.</p>
  </form>${s.ai ? evaluationView(s.ai) : ''}`;
}
export function toggleRecording(s) {
  if (s.recording) { rec && rec.stop(); return; }
  let base = s.text ? s.text.trim() + ' ' : '';
  try { rec = new SR(); } catch { toast('No se pudo iniciar el reconocimiento de voz.', 'error'); return; }
  rec.lang = 'en-US'; rec.continuous = true; rec.interimResults = true;
  rec.onresult = e => {
    let finalText = '', interim = '';
    for (let i = 0; i < e.results.length; i++) { const r = e.results[i]; if (r.isFinal) finalText += r[0].transcript + ' '; else interim += r[0].transcript; }
    s.text = (base + finalText).replace(/\s+/g, ' ').trim();
    const ta = document.getElementById('talk-text');
    if (ta) ta.value = (s.text + ' ' + interim).trim();
    const wc = document.querySelector('[data-wc]'); if (wc) wc.textContent = countWords(ta ? ta.value : s.text);
  };
  rec.onerror = e => { if (e.error === 'not-allowed' || e.error === 'service-not-allowed') toast('No hay permiso para usar el micrófono. Actívalo en el navegador.', 'error'); };
  rec.onend = () => { s.recording = false; clearInterval(recTimer); render(); };
  s.recording = true; render();
  rec.start();
  recTimer = setInterval(() => {
    s.secs++;
    const el = document.getElementById('talk-timer'); if (el) el.textContent = `${Math.floor(s.secs / 60)}:${pad(s.secs % 60)}`;
    if (s.secs >= 180) rec.stop();
  }, 1000);
}
actions['talk-rec'] = () => toggleRecording(prac.session);
forms['prac-talk'] = async form => {
  const s = prac.session;
  if (await evaluateInto(s, 'speaking', form)) await logSession({ skill: 'speaking', level: s.level, correct: 0, total: 0, minutes: minutesSince(s.start), ai: s.ai.overall });
};

function shadowView(s) {
  const sents = D.shadowing[s.level];
  return `<section class="panel"><h2>Shadowing</h2>
    <p class="small muted">Escucha cada frase y repítela imitando ritmo y entonación. ${SR ? 'Pulsa «Repetir» para que el navegador compare lo que dices.' : 'Valora tú cómo te ha salido.'}</p>
    <ul class="clean">${sents.map((t, i) => {
      const sc = s.scores[i];
      return `<li class="stack-sm shadow-item"><p lang="en"><b>${esc(t)}</b></p>
        <div class="row"><button class="btn small" data-action="say" data-i="${i}">▶ Escuchar</button><button class="btn small" data-action="say-slow" data-i="${i}">Lento</button>
        ${SR ? `<button class="btn small" data-action="shadow-rec" data-i="${i}">● Repetir</button>` : ''}
        <span class="chips">${['Bien', 'Regular', 'Repetir'].map((l, j) => `<button class="chip" data-action="self-rate" data-i="${i}" data-v="${2 - j}" aria-pressed="${!!sc && sc.self === 2 - j}">${l}</button>`).join('')}</span></div>
        ${sc && sc.heard != null ? `<p class="feedback ${sc.match >= 0.8 ? 'ok' : 'ko'} small">Te he entendido: «${esc(sc.heard)}» · ${Math.round(sc.match * 100)} %</p>` : ''}</li>`;
    }).join('')}</ul>
    <div class="row"><button class="btn primary" data-action="shadow-save">Guardar sesión</button></div></section>`;
}
actions.say = el => speak(D.shadowing[prac.session.level][el.dataset.i], 0.95);
actions['say-slow'] = el => speak(D.shadowing[prac.session.level][el.dataset.i], 0.7);
actions['self-rate'] = el => { const s = prac.session; s.scores[el.dataset.i] = { ...(s.scores[el.dataset.i] || {}), self: Number(el.dataset.v) }; render(); };
actions['shadow-rec'] = el => {
  const s = prac.session, i = el.dataset.i, target = D.shadowing[s.level][i];
  stopSpeech();
  let r; try { r = new SR(); } catch { return; }
  r.lang = 'en-US';
  el.textContent = '● Escuchando…'; el.disabled = true;
  r.onresult = e => { const heard = e.results[0][0].transcript; s.scores[i] = { ...(s.scores[i] || {}), heard, match: wordMatch(target, heard) }; };
  r.onerror = e => { if (e.error === 'not-allowed') toast('No hay permiso para usar el micrófono.', 'error'); };
  r.onend = () => render();
  r.start();
};
actions['shadow-save'] = () => {
  const s = prac.session; let correct = 0, total = 0;
  Object.values(s.scores).forEach(sc => { if (sc.match != null) { total++; if (sc.match >= 0.8) correct++; } else if (sc.self != null) { total++; if (sc.self === 2) correct++; } });
  finishPractice(correct, total);
};

actions['prac-skill'] = el => { stopSpeech(); prac = { skill: el.dataset.skill, level: null, session: null }; render(); };
actions['prac-level'] = el => { stopSpeech(); prac.level = Number(el.dataset.level); prac.session = null; render(); };
actions['prac-start'] = el => { startPractice(el.dataset.mode); render(); };
actions['prac-again'] = () => { startPractice(prac.session && prac.session.mode); render(); };
actions['quiz-answer'] = el => {
  const s = activeQuiz(); if (s.answered !== null) return;
  s.answered = Number(el.dataset.o);
  if (s.answered === s.items[s.idx].answer) s.correct++;
  render();
};
actions['quiz-next'] = () => {
  const s = activeQuiz();
  if (s.idx + 1 < s.items.length) { s.idx++; s.answered = null; render(); }
  else if (s === task) submitQuizTask(); else finishPractice(s.correct, s.items.length);
};
actions.play = el => {
  if (el.dataset.id === 'diag-listen') {
    if (diag.mc.plays >= 2) return;
    diag.mc.plays++;
    const pl = document.getElementById('plays-left'); if (pl) pl.textContent = 2 - diag.mc.plays;
    if (diag.mc.plays >= 2) el.disabled = true;
    const l = D.listening[diag.mc.level];
    setWave(true); speak(l.script, l.rate, () => setWave(false));
  } else {
    const s = el.dataset.id === 'task-listen' ? task : prac.session;
    setWave(true); speak(s.src.script, s.rate, () => setWave(false));
  }
};
changes.rate = el => { const s = task && task.src && route() === 'tarea' ? task : prac.session; if (s) s.rate = Number(el.value); };
const route = () => location.hash.replace('#', '');

/* =========================================================
   Tareas de clase
   ========================================================= */
let task = null; // sesión de la tarea abierta
const activeQuiz = () => (route() === 'tarea' ? task : prac.session);

actions['open-assignment'] = el => {
  const a = S.assignments.find(x => x.id === el.dataset.id);
  if (!a) return;
  task = { assignment: a, level: a.level, prompt: a.prompt, start: Date.now(), text: '', secs: 0 };
  if (a.type === 'quiz') Object.assign(task, { items: a.questions, idx: 0, correct: 0, answered: null });
  if (a.type === 'reading') Object.assign(task, { skill: 'reading', src: D.reading[a.level], checked: null, rate: 1 });
  if (a.type === 'listening') Object.assign(task, { skill: 'listening', src: D.listening[a.level], checked: null, rate: D.listening[a.level].rate });
  go('tarea');
};

views.tarea = { role: 'student', render() {
  if (!task) return '<section class="stack"><h1>Elige una tarea</h1><a class="btn" href="#inicio">Volver a inicio</a></section>';
  const a = task.assignment, sub = submissionFor(a.id);
  const head = `<section class="stack"><a class="btn ghost" href="#inicio" style="align-self:flex-start">← Volver</a>
    <p class="eyebrow">Tarea de clase · ${TYPE_NAME[a.type]} · ${LV[a.level]}${a.due ? ' · entrega ' + fmtDate(a.due) : ''}</p>
    <h1>${esc(a.title)}</h1>${a.instructions ? `<p class="lead">${esc(a.instructions)}</p>` : ''}</section>`;
  if (sub && sub.status !== 'redo' && !task.justSent) {
    return `${head}<section class="panel"><div class="row between"><h2>Tu entrega</h2>${statusPill(sub.type === 'quiz' ? 'done' : sub.status)}</div>
      ${sub.type === 'quiz' ? `<p>Has acertado <b class="mono">${sub.correct}/${sub.total}</b>.</p>` : `<div class="passage" lang="en">${esc(sub.text)}</div>`}</section>
      ${evaluationView(sub.ai, sub.status === 'reviewed' ? sub.review : null)}`;
  }
  if (task.justSent) {
    return `${head}<section class="panel"><h2>Tarea enviada</h2><p>${a.type === 'quiz' || a.type === 'reading' || a.type === 'listening' ? `Has acertado <b class="mono">${task.correct}/${task.total}</b>. Tu profesor verá el resultado.` : 'Tu profesor revisará la evaluación de la IA y te dará la nota final.'}</p>
      <div class="row"><a class="btn primary" href="#inicio">Volver a inicio</a></div></section>${task.ai ? evaluationView(task.ai) : ''}`;
  }
  if (a.type === 'quiz') return head + quizView(task.items[task.idx], task.idx, task.items.length, task.correct, task.answered);
  if (a.type === 'reading' || a.type === 'listening') return head + comprehensionView(task, 'task-comp').replace('data-id="prac-listen"', 'data-id="task-listen"').replace('data-action="task-comp-save"', 'data-action="task-comp-send"');
  if (a.type === 'writing') return head + writingView(task, 'task-write') + (task.ai ? '<div class="row"><button class="btn primary" data-action="task-send">Enviar a mi profesor</button></div>' : '');
  return head + talkView(task, 'task-talk') + (task.ai ? '<div class="row"><button class="btn primary" data-action="task-send">Enviar a mi profesor</button></div>' : '');
} };

async function sendTask(extra) {
  const a = task.assignment;
  const ok = await attempt(async () => {
    await S.cloud.createSubmission({
      assignmentId: a.id, assignmentTitle: a.title, groupId: a.groupId, studentName: S.me.name, type: a.type, level: a.level,
      prompt: a.prompt || '', ...extra
    });
    return true;
  });
  if (!ok) return;
  S.mySubs = await S.cloud.listMySubmissions();
  task.justSent = true;
  await logSession({ skill: SKILL_OF[a.type], level: a.level, correct: extra.correct || 0, total: extra.total || 0, minutes: minutesSince(task.start) });
  render(); window.scrollTo(0, 0);
}
const SKILL_OF = { quiz: 'grammar', writing: 'writing', speaking: 'speaking', reading: 'reading', listening: 'listening' };
function submitQuizTask() { task.total = task.items.length; sendTask({ correct: task.correct, total: task.items.length, text: '' }); }
forms['task-comp'] = form => { if (checkComprehension(form, task)) render(); };
actions['task-comp-send'] = () => { task.correct = task.checked.correct; task.total = task.checked.total; sendTask({ correct: task.checked.correct, total: task.checked.total, text: '' }); };
forms['task-write'] = form => evaluateInto(task, 'writing', form);
forms['task-talk'] = form => evaluateInto(task, 'speaking', form);
actions['task-send'] = () => sendTask({ text: task.text, ai: task.ai, seconds: task.secs || null });
const _talkRec = actions['talk-rec'];
actions['talk-rec'] = () => (route() === 'tarea' ? toggleRecording(task) : _talkRec());

/* =========================================================
   Progreso
   ========================================================= */
views.progreso = { role: 'student', render() {
  const log = S.sessions;
  const scored = log.filter(l => l.total);
  const acc = scored.length ? Math.round(scored.reduce((a, l) => a + l.correct, 0) / scored.reduce((a, l) => a + l.total, 0) * 100) : null;
  const totalMin = log.reduce((a, l) => a + (l.minutes || 0), 0);
  const bySkill = SKILLS.map(s => {
    const sc = log.filter(l => l.skill === s.id && l.total);
    return { s, acc: sc.length ? sc.reduce((a, l) => a + l.correct, 0) / sc.reduce((a, l) => a + l.total, 0) : null };
  });
  const plan = S.me.plan;
  const subs = S.mySubs.filter(x => x.type === 'writing' || x.type === 'speaking').sort((a, b) => b.createdAt - a.createdAt);
  return `<section class="stack"><p class="eyebrow">Progreso</p><h1>Tu constancia y tus resultados</h1></section>
    <section class="metrics">
      <div class="metric"><b>${streak(log)}</b><span>días seguidos</span></div>
      <div class="metric"><b>${weekMinutes(log)}</b><span>min esta semana${plan ? ' de ' + plan.minutes * plan.days : ''}</span></div>
      <div class="metric"><b>${acc == null ? '—' : acc + ' %'}</b><span>aciertos totales</span></div>
      <div class="metric"><b>${(totalMin / 60).toFixed(1).replace('.', ',')}</b><span>horas${plan ? ' de ~' + plan.hours : ''}</span></div></section>
    <section class="panel"><h2>Aciertos por destreza</h2><div class="bars">${bySkill.filter(b => MC_SKILLS.includes(b.s.id)).map(b =>
      `<div class="bar-row"><span>${b.s.name}</span><div class="bar"><span style="width:${b.acc == null ? 0 : Math.round(b.acc * 100)}%;background:${b.acc == null ? 'transparent' : b.acc >= 0.7 ? 'var(--good)' : b.acc >= 0.5 ? 'var(--gold)' : 'var(--bad)'}"></span></div><span class="mono">${b.acc == null ? '—' : Math.round(b.acc * 100) + ' %'}</span></div>`).join('')}</div>
      <p class="small muted">Verde: 70 % o más, lista para practicar en el nivel siguiente.</p></section>
    <section class="panel"><h2>Evaluaciones de clase</h2>${subs.length ? `<ul class="clean">${subs.map(x => `<li class="row between task-line"><div class="stack-sm"><b>${esc(x.assignmentTitle)}</b><span class="small muted">${TYPE_NAME[x.type]} · IA: ${x.ai ? x.ai.overall : '—'}${x.review && x.review.overall ? ' · profesor: ' + x.review.overall : ''}</span></div>${statusPill(x.status)}</li>`).join('')}</ul>` : '<p class="muted">Aún no has entregado tareas de redacción u oral.</p>'}</section>
    <section class="panel"><h2>Diagnósticos</h2>${S.diagnoses.length ? `<div class="table-wrap"><table><thead><tr><th>Fecha</th><th>Global</th>${SKILLS.map(s => `<th>${s.name}</th>`).join('')}</tr></thead>
      <tbody>${S.diagnoses.slice().sort((a, b) => b.date.localeCompare(a.date)).map(h => `<tr><td>${fmtDate(h.date)}</td><td>${lvl(h.overall)}</td>${SKILLS.map(s => `<td>${lvl(h.levels[s.id])}</td>`).join('')}</tr>`).join('')}</tbody></table></div>` : '<p class="muted">Aún no has hecho el diagnóstico.</p>'}</section>
    <section class="panel"><h2>Últimas sesiones</h2>${log.length ? `<div class="table-wrap"><table><thead><tr><th>Fecha</th><th>Destreza</th><th>Nivel</th><th>Resultado</th><th>Min</th></tr></thead>
      <tbody>${log.slice(-12).reverse().map(l => `<tr><td>${fmtDate(l.date)}</td><td>${SK[l.skill].name}</td><td>${lvl(l.level)}</td><td class="num">${l.total ? `${l.correct}/${l.total}` : l.ai ? 'IA ' + l.ai : '—'}</td><td class="num">${l.minutes}</td></tr>`).join('')}</tbody></table></div>` : '<p class="muted">Cuando practiques, tus sesiones aparecerán aquí.</p>'}</section>`;
} };
