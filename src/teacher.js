/* Vistas del profesor: grupo y alumnos, revisión de evaluaciones de IA, tareas y biblioteca. */
import { D } from './data.js';
import { LV, SKILLS, SK, weekMinutes, fmtDate, todayKey, addDays, dateKey } from './core.js';
import { S, views, actions, forms, changes, esc, lvl, lvlCode, render, go, toast, attempt, ladder } from './ui.js';

/* =========================================================
   Datos
   ========================================================= */
export async function loadTeacher() {
  const c = S.cloud;
  const [groups, students, subs, tAssignments, library] = await Promise.all([
    c.listGroups(), c.listStudents(), c.listTeacherSubmissions(), c.listAssignmentsByTeacher(), c.listLibrary()
  ]);
  Object.assign(S, { groups, students, subs, tAssignments, library });
  if (!S.groupId || !groups.some(g => g.id === S.groupId)) S.groupId = groups[0] ? groups[0].id : null;
  const sessions = await Promise.all(students.map(s => c.listSub('sessions', s.id).catch(() => [])));
  S.studentSessions = Object.fromEntries(students.map((s, i) => [s.id, sessions[i]]));
}
const group = () => S.groups.find(g => g.id === S.groupId);
const groupStudents = () => S.students.filter(s => s.groupId === S.groupId).sort((a, b) => a.name.localeCompare(b.name));
const pending = () => S.subs.filter(s => s.status === 'pending' && (s.type === 'writing' || s.type === 'speaking')).sort((a, b) => a.createdAt - b.createdAt);
const TYPE_NAME = { quiz: 'Preguntas propias', writing: 'Redacción (corrige la IA)', speaking: 'Grabación oral (evalúa la IA)', reading: 'Lectura de la biblioteca', listening: 'Escucha de la biblioteca' };

function studentStatus(st) {
  const sessions = S.studentSessions[st.id] || [];
  const last = sessions.map(s => s.date).sort().pop();
  const planned = st.plan ? st.plan.minutes * st.plan.days : null;
  const wm = weekMinutes(sessions);
  if (!st.levels) return { last, wm, planned, pill: ['Sin diagnóstico', 'warn'] };
  if (!last || last < dateKey(addDays(new Date(), -7))) return { last, wm, planned, pill: ['Sin actividad', 'bad'] };
  if (planned && wm < planned * 0.5) return { last, wm, planned, pill: ['Se retrasa', 'warn'] };
  return { last, wm, planned, pill: ['Al día', 'ok'] };
}
const pill = ([t, k]) => `<span class="pill ${k}">${t}</span>`;
const relDay = k => { if (!k) return 'Nunca'; const d = Math.round((new Date(todayKey()) - new Date(k)) / 86400000); return d <= 0 ? 'Hoy' : d === 1 ? 'Ayer' : `Hace ${d} días`; };

/* =========================================================
   Grupo
   ========================================================= */
let showNewGroup = false;
views.grupo = { role: 'teacher', render() {
  if (!S.groups.length || showNewGroup) {
    return `<section class="stack"><p class="eyebrow">Mis grupos</p><h1>${S.groups.length ? 'Nuevo grupo' : 'Crea tu primer grupo'}</h1>
      <p class="lead">Cada grupo tiene un código de invitación. Tus alumnos lo usan para crear su cuenta y quedar en tu grupo.</p></section>
      <form class="panel" data-form="new-group">
        <label class="field" for="g-name">Nombre del grupo<input id="g-name" name="name" required placeholder="B1 · martes y jueves" maxlength="60"></label>
        <label class="field" for="g-sched">Horario (opcional)<input id="g-sched" name="schedule" placeholder="Martes y jueves 18:00" maxlength="60"></label>
        <p class="small error" id="form-msg" hidden></p>
        <div class="row"><button class="btn primary" type="submit">Crear grupo</button>${S.groups.length ? '<button type="button" class="btn ghost" data-action="cancel-group">Cancelar</button>' : ''}</div></form>`;
  }
  const g = group(), studs = groupStudents(), pend = pending().filter(p => p.groupId === g.id);
  const st = studs.map(s => ({ s, ...studentStatus(s) }));
  const withLv = studs.filter(s => s.levels);
  const avgLv = withLv.length ? Math.round(withLv.reduce((a, s) => a + s.overall, 0) / withLv.length) : null;
  return `<section class="stack">
      <div class="row between" style="align-items:flex-end"><div class="stack-sm"><p class="eyebrow">Grupo</p><h1>${esc(g.name)}</h1>${g.schedule ? `<span class="muted">${esc(g.schedule)}</span>` : ''}</div>
      <div class="row">${S.groups.length > 1 ? `<label class="field" for="g-sel">Cambiar de grupo<select id="g-sel" data-change="pick-group">${S.groups.map(x => `<option value="${x.id}"${x.id === g.id ? ' selected' : ''}>${esc(x.name)}</option>`).join('')}</select></label>` : ''}
        <button class="btn" data-action="new-group">Nuevo grupo</button><a class="btn primary" href="#tareas">Asignar tarea</a></div></div></section>
    <section class="panel invite"><div class="stack-sm"><span class="eyebrow">Código de invitación</span><b class="mono invite-code" id="invite-code">${esc(g.inviteCode)}</b>
      <span class="small muted">Tus alumnos entran en la app, pulsan «Activar mi cuenta» y escriben este código.</span></div>
      <button class="btn" data-action="copy-code">Copiar código</button></section>
    <section class="metrics">
      <div class="metric"><b>${studs.length}</b><span>alumnos en el grupo</span></div>
      <div class="metric"><b>${st.filter(x => x.pill[0] === 'Al día').length}</b><span>al día con su plan esta semana</span></div>
      <div class="metric"><b>${avgLv == null ? '—' : LV[avgLv]}</b><span>nivel medio</span></div>
      <div class="metric"><b>${pend.length}</b><span>evaluaciones por revisar</span></div></section>
    <div class="cols">
      <section class="panel wide"><h2>Alumnos</h2>${studs.length ? `<div class="table-wrap"><table>
        <thead><tr><th>Alumno</th><th>Global</th><th>Más débil</th><th>Minutos semana</th><th>Última actividad</th><th>Estado</th><th></th></tr></thead>
        <tbody>${st.map(({ s, last, wm, planned, pill: p }) => {
          const weak = s.levels ? SKILLS.slice().sort((a, b) => s.levels[a.id] - s.levels[b.id])[0] : null;
          return `<tr><td><b>${esc(s.name)}</b></td><td>${s.levels ? lvl(s.overall) : '—'}</td><td>${weak ? `${weak.name} ${lvl(s.levels[weak.id])}` : '—'}</td>
            <td><span class="mini"><span style="width:${planned ? Math.min(100, Math.round(wm / planned * 100)) : 0}%"></span></span><span class="mono">${wm}${planned ? '/' + planned : ''}</span></td>
            <td>${relDay(last)}</td><td>${pill(p)}</td><td><button class="btn small" data-action="open-student" data-id="${s.id}">Ver</button></td></tr>`;
        }).join('')}</tbody></table></div>` : '<p class="muted">Todavía no hay alumnos. Comparte el código de invitación.</p>'}</section>
      <aside class="panel narrow"><h2>Por revisar</h2>${pend.length ? pend.map(p => `<div class="rv"><div class="stack-sm"><b>${esc(p.studentName)} · ${p.type === 'speaking' ? 'Oral' : 'Escritura'}</b><span class="small muted">IA: ${p.ai ? p.ai.overall : '—'} · ${esc(p.assignmentTitle)}</span></div>
        <button class="btn small" data-action="open-review" data-id="${p.id}">Revisar</button></div>`).join('') : '<p class="muted">No hay evaluaciones pendientes.</p>'}
        ${withLv.length ? `<p class="small muted">Destreza más débil del grupo: <b>${weakestOfGroup(withLv)}</b>.</p>` : ''}</aside>
    </div>`;
} };
function weakestOfGroup(studs) {
  const sums = SKILLS.map(s => ({ s, v: studs.reduce((a, st) => a + st.levels[s.id], 0) }));
  return sums.sort((a, b) => a.v - b.v)[0].s.name.toLowerCase();
}
forms['new-group'] = async form => {
  const name = form.name.value.trim(), schedule = form.schedule.value.trim();
  if (!name) return;
  const g = await attempt(() => S.cloud.createGroup(name, schedule), form.querySelector('#form-msg'));
  if (!g) return;
  S.groups.push(g); S.groupId = g.id; showNewGroup = false;
  toast(`Grupo creado. Código de invitación: ${g.inviteCode}`);
  render();
};
actions['new-group'] = () => { showNewGroup = true; render(); };
actions['cancel-group'] = () => { showNewGroup = false; render(); };
changes['pick-group'] = el => { S.groupId = el.value; render(); };
actions['copy-code'] = () => {
  const code = group().inviteCode;
  navigator.clipboard.writeText(code).then(() => toast('Código copiado.'), () => {
    const r = document.createRange(); r.selectNodeContents(document.getElementById('invite-code'));
    const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); toast('Código seleccionado: cópialo con Ctrl+C.');
  });
};

/* ---------- Ficha del alumno ---------- */
let studentId = null;
actions['open-student'] = el => { studentId = el.dataset.id; go('alumno'); };
views.alumno = { role: 'teacher', render() {
  const s = S.students.find(x => x.id === studentId);
  if (!s) return '<section class="stack"><h1>Alumno no encontrado</h1><a class="btn" href="#grupo">Volver al grupo</a></section>';
  const sessions = (S.studentSessions[s.id] || []).slice().sort((a, b) => b.date.localeCompare(a.date));
  const subs = S.subs.filter(x => x.studentId === s.id).sort((a, b) => b.createdAt - a.createdAt);
  return `<section class="stack"><a class="btn ghost" href="#grupo" style="align-self:flex-start">← Grupo</a>
      <p class="eyebrow">Alumno</p><h1>${esc(s.name)}</h1><span class="muted">${esc(s.email)}</span></section>
    ${s.levels ? `<section class="panel"><div class="row between"><h2>Nivel</h2><span class="small muted">Diagnóstico del ${fmtDate(s.diagDate)}</span></div>${ladder(s.levels, s.plan ? s.plan.target : null)}
      ${s.plan ? `<p class="small">Plan: ${s.plan.minutes} min/día, ${s.plan.days} días por semana${s.plan.targetDate ? ', meta el ' + fmtDate(s.plan.targetDate) : ''}.</p>` : '<p class="small muted">Aún no ha creado su plan.</p>'}</section>`
      : '<section class="panel"><p class="muted">Aún no ha hecho el diagnóstico.</p></section>'}
    <section class="panel"><h2>Entregas</h2>${subs.length ? `<div class="table-wrap"><table><thead><tr><th>Tarea</th><th>Tipo</th><th>Resultado</th><th>Estado</th><th></th></tr></thead><tbody>
      ${subs.map(x => `<tr><td>${esc(x.assignmentTitle)}</td><td>${TYPE_NAME[x.type] || x.type}</td><td>${x.total ? `${x.correct}/${x.total}` : x.review && x.review.overall ? lvlCode(x.review.overall) : x.ai ? 'IA ' + x.ai.overall : '—'}</td>
        <td>${x.type === 'writing' || x.type === 'speaking' ? pill(x.status === 'reviewed' ? ['Revisada', 'ok'] : x.status === 'redo' ? ['Repetir', 'bad'] : ['Pendiente', 'warn']) : pill(['Hecha', 'ok'])}</td>
        <td>${(x.type === 'writing' || x.type === 'speaking') ? `<button class="btn small" data-action="open-review" data-id="${x.id}">${x.status === 'pending' ? 'Revisar' : 'Ver'}</button>` : ''}</td></tr>`).join('')}</tbody></table></div>` : '<p class="muted">Sin entregas todavía.</p>'}</section>
    <section class="panel"><h2>Últimas sesiones de práctica</h2>${sessions.length ? `<div class="table-wrap"><table><thead><tr><th>Fecha</th><th>Destreza</th><th>Nivel</th><th>Resultado</th><th>Min</th></tr></thead><tbody>
      ${sessions.slice(0, 15).map(l => `<tr><td>${fmtDate(l.date)}</td><td>${SK[l.skill] ? SK[l.skill].name : l.skill}</td><td>${lvl(l.level)}</td><td class="num">${l.total ? `${l.correct}/${l.total}` : l.ai ? 'IA ' + l.ai : '—'}</td><td class="num">${l.minutes}</td></tr>`).join('')}</tbody></table></div>` : '<p class="muted">Sin sesiones todavía.</p>'}</section>`;
} };

/* =========================================================
   Revisiones
   ========================================================= */
let reviewId = null, reviewDraft = null, reviewOpened = false;
actions['open-review'] = el => { reviewId = el.dataset.id; reviewDraft = null; reviewOpened = true; go('revisiones'); };
views.revisiones = { role: 'teacher', enter() { if (!reviewOpened) { reviewId = null; reviewDraft = null; } }, render() {
  reviewOpened = false;
  const sub = reviewId && S.subs.find(s => s.id === reviewId);
  if (!sub) {
    const pend = pending();
    const done = S.subs.filter(s => s.status !== 'pending' && (s.type === 'writing' || s.type === 'speaking')).sort((a, b) => (b.reviewedAt || 0) - (a.reviewedAt || 0)).slice(0, 10);
    return `<section class="stack"><p class="eyebrow">Revisiones</p><h1>${pend.length ? `${pend.length} evaluaciones por revisar` : 'Todo revisado'}</h1></section>
      <section class="panel">${pend.length ? pend.map(p => `<div class="rv"><div class="stack-sm"><b>${esc(p.studentName)} · ${esc(p.assignmentTitle)}</b><span class="small muted">${p.type === 'speaking' ? 'Oral' : 'Escritura'} · IA: ${p.ai ? p.ai.overall : 'sin evaluar'} · ${fmtDate(dateKey(new Date(p.createdAt)))}</span></div><button class="btn small primary" data-action="open-review" data-id="${p.id}">Revisar</button></div>`).join('') : '<p class="muted">No hay evaluaciones pendientes.</p>'}</section>
      ${done.length ? `<section class="panel"><h2>Revisadas recientemente</h2>${done.map(p => `<div class="rv"><div class="stack-sm"><b>${esc(p.studentName)} · ${esc(p.assignmentTitle)}</b><span class="small muted">Nota final: ${p.review && p.review.overall ? p.review.overall : '—'} · ${p.status === 'redo' ? 'pedida repetición' : 'validada'}</span></div><button class="btn small" data-action="open-review" data-id="${p.id}">Ver</button></div>`).join('')}</section>` : ''}`;
  }
  const ai = sub.ai || { overall: LV[sub.level] || 'B1', criteria: (sub.type === 'speaking' ? ['Desarrollo de la tarea', 'Coherencia', 'Gramática', 'Vocabulario'] : ['Adecuación a la tarea', 'Coherencia y cohesión', 'Gramática', 'Vocabulario']).map(n => ({ name: n, level: LV[sub.level] || 'B1', comment: '' })), corrections: [] };
  const rv = reviewDraft || (reviewDraft = sub.review ? JSON.parse(JSON.stringify(sub.review)) : { overall: ai.overall, criteria: ai.criteria.map(c => c.level), comment: '' });
  const readOnly = sub.status !== 'pending';
  const sel = (name, value, aiValue, label) => `<select name="${name}" aria-label="${label}" data-change="review-field" class="${value !== aiValue ? 'changed' : ''}" ${readOnly ? 'disabled' : ''}>${LV.map(l => `<option${l === value ? ' selected' : ''}>${l}</option>`).join('')}</select>`;
  return `<section class="stack"><button class="btn ghost" data-action="close-review" style="align-self:flex-start">← Revisiones</button>
      <p class="eyebrow">${esc(sub.studentName)} · ${sub.type === 'speaking' ? 'Expresión oral' : 'Escritura'} · nivel ${LV[sub.level] || ''}</p><h1>${esc(sub.assignmentTitle)}</h1></section>
    <div class="cols">
      <section class="panel wide"><h2>Consigna</h2><div class="passage" lang="en">${esc(sub.prompt)}</div>
        <h2>${sub.type === 'speaking' ? 'Transcripción' : 'Texto'} del alumno</h2><div class="passage" lang="en">${esc(sub.text)}</div>
        ${sub.type === 'speaking' && sub.seconds ? `<p class="small muted">Duración: ${Math.floor(sub.seconds / 60)}:${String(sub.seconds % 60).padStart(2, '0')} · ${Math.round(sub.text.split(/\s+/).length / (sub.seconds / 60))} palabras por minuto.</p>` : ''}
        ${ai.summary ? `<h2>Resumen de la IA</h2><p>${esc(ai.summary)}</p>` : '<p class="feedback warn">Esta entrega no tiene evaluación de IA: pon tú la nota.</p>'}
        ${ai.corrections && ai.corrections.length ? `<h3>Correcciones propuestas</h3><ul class="clean">${ai.corrections.map(c => `<li class="correction"><span lang="en"><span class="fix">${esc(c.original)}</span> → <span class="okw">${esc(c.corrected)}</span></span><span class="small muted">${esc(c.explanation)}</span></li>`).join('')}</ul>` : ''}</section>
      <form class="panel narrow" data-form="review" style="flex-basis:400px">
        <h2>Nota por criterio</h2>
        <div class="crit eyebrow"><span>Criterio</span><span>IA</span><span>Tu nota</span></div>
        ${ai.criteria.map((c, i) => `<div class="crit"><span title="${esc(c.comment)}">${esc(c.name)}</span><span class="mono muted">${c.level}</span>${sel('c' + i, rv.criteria[i], c.level, 'Tu nota de ' + c.name)}</div>`).join('')}
        <div class="crit"><b>Nivel global</b><span class="mono muted">${ai.overall}</span>${sel('overall', rv.overall, ai.overall, 'Nivel global')}</div>
        <label class="field" for="rv-comment">Comentario para el alumno<textarea id="rv-comment" name="comment" ${readOnly ? 'readonly' : ''} data-change="review-field">${esc(rv.comment)}</textarea></label>
        ${readOnly ? `<p class="feedback ok">${sub.status === 'redo' ? 'Pediste que repitiera la tarea.' : 'Evaluación validada.'}</p>`
          : '<div class="row"><button class="btn primary" type="submit">Validar y enviar</button><button type="button" class="btn" data-action="review-redo">Pedir que repita</button></div>'}
      </form></div>`;
} };
changes['review-field'] = el => {
  if (el.name === 'comment') reviewDraft.comment = el.value;
  else if (el.name === 'overall') { reviewDraft.overall = el.value; render(); }
  else { reviewDraft.criteria[Number(el.name.slice(1))] = el.value; render(); }
};
async function finishReview(status) {
  const c = document.getElementById('rv-comment'); if (c) reviewDraft.comment = c.value;
  const ok = await attempt(async () => { await S.cloud.reviewSubmission(reviewId, status, reviewDraft); return true; });
  if (!ok) return;
  Object.assign(S.subs.find(s => s.id === reviewId), { status, review: reviewDraft, reviewedAt: Date.now() });
  toast(status === 'redo' ? 'Se ha pedido al alumno que repita la tarea.' : 'Nota validada y enviada al alumno.');
  const next = pending()[0];
  reviewId = next ? next.id : null; reviewDraft = null;
  render(); window.scrollTo(0, 0);
}
forms.review = () => finishReview('reviewed');
actions['review-redo'] = () => finishReview('redo');
actions['close-review'] = () => { reviewId = null; reviewDraft = null; render(); };

/* =========================================================
   Tareas y biblioteca
   ========================================================= */
let draft = null;
const blankQuestion = () => ({ q: '', options: ['', '', '', ''], answer: 0, explain: '' });
const newDraft = () => ({ type: 'writing', title: '', level: 2, due: dateKey(addDays(new Date(), 7)), instructions: '', prompt: '', questions: [blankQuestion()] });

views.tareas = { role: 'teacher', render() {
  if (!S.groups.length) return '<section class="stack"><h1>Primero crea un grupo</h1><a class="btn primary" href="#grupo">Crear grupo</a></section>';
  const d = draft || (draft = newDraft());
  const g = group();
  const assigned = S.tAssignments.filter(a => a.groupId === S.groupId).sort((a, b) => b.createdAt - a.createdAt);
  const studs = groupStudents().length;
  const typeOpt = Object.entries(TYPE_NAME).map(([k, v]) => `<option value="${k}"${k === d.type ? ' selected' : ''}>${v}</option>`).join('');
  return `<section class="stack"><p class="eyebrow">Tareas · ${esc(g.name)}</p><h1>Asignar una tarea</h1></section>
    <div class="cols">
      <form class="panel wide" data-form="assign">
        <div class="row" style="align-items:flex-end">
          <label class="field grow" for="t-title">Título<input id="t-title" name="title" value="${esc(d.title)}" required maxlength="80" data-change="draft"></label>
          <label class="field" for="t-type">Tipo<select id="t-type" name="type" data-change="draft-rerender">${typeOpt}</select></label>
          <label class="field" for="t-level">Nivel<select id="t-level" name="level" data-change="draft-rerender">${LV.map((l, i) => `<option value="${i}"${i === d.level ? ' selected' : ''}>${l}</option>`).join('')}</select></label>
          <label class="field" for="t-due">Entrega<input type="date" id="t-due" name="due" value="${d.due}" data-change="draft"></label></div>
        <label class="field" for="t-instr">Instrucciones para los alumnos<textarea id="t-instr" name="instructions" maxlength="600" data-change="draft">${esc(d.instructions)}</textarea></label>
        ${d.type === 'writing' || d.type === 'speaking' ? `<label class="field" for="t-prompt">Consigna en inglés<textarea id="t-prompt" name="prompt" lang="en" required maxlength="800" data-change="draft">${esc(d.prompt)}</textarea></label>
          <div class="row small"><span class="muted">Ideas de la biblioteca:</span>${(d.type === 'writing' ? D.writingPrompts : D.speakingPrompts)[d.level].map((p, i) => `<button type="button" class="btn small" data-action="use-prompt" data-i="${i}">Consigna ${i + 1}</button>`).join('')}</div>` : ''}
        ${d.type === 'reading' || d.type === 'listening' ? `<div class="passage small" lang="en"><b>${esc((d.type === 'reading' ? D.reading : D.listening)[d.level].title)}</b> · 3 preguntas de nivel ${LV[d.level]} incluidas en la app.</div>` : ''}
        ${d.type === 'quiz' ? d.questions.map((q, n) => `<div class="qblock"><div class="row between"><b>Pregunta ${n + 1}</b>${d.questions.length > 1 ? `<button type="button" class="btn ghost small" data-action="del-q" data-i="${n}">Quitar</button>` : ''}</div>
            <label class="field" for="q${n}">Enunciado<input id="q${n}" name="q${n}.q" lang="en" value="${esc(q.q)}" placeholder="I ___ my keys. I can't open the door." data-change="draft-q"></label>
            <div class="optgrid" lang="en">${q.options.map((o, i) => `<label><input type="radio" name="ans${n}" value="${i}" ${q.answer === i ? 'checked' : ''} data-change="draft-q" aria-label="Marcar la opción ${i + 1} como correcta"><input type="text" name="q${n}.o${i}" value="${esc(o)}" placeholder="Opción ${i + 1}" aria-label="Opción ${i + 1}" data-change="draft-q"></label>`).join('')}</div>
            <label class="field" for="x${n}">Explicación (se muestra al responder)<input id="x${n}" name="q${n}.explain" value="${esc(q.explain)}" data-change="draft-q"></label></div>`).join('')
          + '<div class="row"><button type="button" class="btn dash" data-action="add-q">+ Añadir pregunta</button></div><p class="small muted">Marca con el círculo la opción correcta.</p>' : ''}
        <p class="small error" id="form-msg" hidden></p>
        <div class="row form-actions"><button type="button" class="btn" data-action="save-library">Guardar en la biblioteca</button><button class="btn primary" type="submit">Asignar a ${studs} alumno${studs === 1 ? '' : 's'}</button></div>
      </form>
      <aside class="panel narrow"><h2>Biblioteca de la academia</h2>${S.library.length ? S.library.slice().sort((a, b) => b.createdAt - a.createdAt).map(l => `<div class="lib"><div class="stack-sm"><b>${esc(l.title)}</b><span class="small muted">${TYPE_NAME[l.type]} · ${LV[l.level]}</span></div><button class="btn small" data-action="use-library" data-id="${l.id}">Usar</button></div>`).join('') : '<p class="small muted">Aquí aparecerán las tareas que guardéis los profesores.</p>'}</aside>
    </div>
    <section class="panel"><h2>Tareas asignadas a este grupo</h2>${assigned.length ? `<div class="table-wrap"><table><thead><tr><th>Tarea</th><th>Tipo</th><th>Nivel</th><th>Entrega</th><th>Entregas</th></tr></thead><tbody>
      ${assigned.map(a => `<tr><td><b>${esc(a.title)}</b></td><td>${TYPE_NAME[a.type]}</td><td>${lvl(a.level)}</td><td>${a.due ? fmtDate(a.due) : '—'}</td><td class="num">${new Set(S.subs.filter(s => s.assignmentId === a.id).map(s => s.studentId)).size}/${studs}</td></tr>`).join('')}</tbody></table></div>` : '<p class="muted">Aún no has asignado tareas a este grupo.</p>'}</section>`;
} };
changes.draft = el => { draft[el.name] = el.value; };
changes['draft-rerender'] = el => { draft[el.name] = el.name === 'level' ? Number(el.value) : el.value; render(); };
changes['draft-q'] = el => {
  if (el.type === 'radio') { draft.questions[Number(el.name.slice(3))].answer = Number(el.value); return; }
  const [qk, field] = el.name.split('.'); const q = draft.questions[Number(qk.slice(1))];
  if (field.startsWith('o')) q.options[Number(field.slice(1))] = el.value; else q[field] = el.value;
};
actions['add-q'] = () => { draft.questions.push(blankQuestion()); render(); };
actions['del-q'] = el => { draft.questions.splice(Number(el.dataset.i), 1); render(); };
actions['use-prompt'] = el => { draft.prompt = (draft.type === 'writing' ? D.writingPrompts : D.speakingPrompts)[draft.level][Number(el.dataset.i)]; render(); };
actions['use-library'] = el => {
  const l = S.library.find(x => x.id === el.dataset.id);
  draft = { ...newDraft(), ...JSON.parse(JSON.stringify({ type: l.type, title: l.title, level: l.level, instructions: l.instructions || '', prompt: l.prompt || '', questions: l.questions && l.questions.length ? l.questions : [blankQuestion()] })) };
  render(); window.scrollTo(0, 0);
};

function validDraft() {
  const msg = document.getElementById('form-msg');
  const fail = t => { msg.textContent = t; msg.hidden = false; return null; };
  document.querySelectorAll('[data-form="assign"] [data-change]').forEach(el => { if (el.type !== 'radio' || el.checked) { const h = changes[el.dataset.change]; if (h && el.dataset.change !== 'draft-rerender') h(el); } });
  if (!draft.title.trim()) return fail('Pon un título a la tarea.');
  const item = { type: draft.type, title: draft.title.trim(), level: draft.level, instructions: draft.instructions.trim() };
  if (draft.type === 'writing' || draft.type === 'speaking') {
    if (!draft.prompt.trim()) return fail('Escribe la consigna en inglés.');
    item.prompt = draft.prompt.trim();
  }
  if (draft.type === 'quiz') {
    const qs = draft.questions.map(q => ({ q: q.q.trim(), options: q.options.map(o => o.trim()), answer: q.answer, explain: q.explain.trim() }));
    if (qs.some(q => !q.q || q.options.some(o => !o))) return fail('Completa el enunciado y las cuatro opciones de cada pregunta.');
    item.questions = qs;
  }
  return item;
}
forms.assign = async () => {
  const item = validDraft(); if (!item) return;
  const a = { ...item, groupId: S.groupId, due: draft.due || null };
  const ok = await attempt(async () => { await S.cloud.createAssignment(a); return true; }, document.getElementById('form-msg'));
  if (!ok) return;
  S.tAssignments = await S.cloud.listAssignmentsByTeacher();
  draft = newDraft();
  toast('Tarea asignada al grupo.');
  render(); window.scrollTo(0, 0);
};
actions['save-library'] = async () => {
  const item = validDraft(); if (!item) return;
  const ok = await attempt(async () => { await S.cloud.saveLibrary(item); return true; }, document.getElementById('form-msg'));
  if (!ok) return;
  S.library = await S.cloud.listLibrary();
  toast('Guardada en la biblioteca de la academia.');
  render();
};
