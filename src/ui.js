/* Piezas compartidas de la interfaz: estado, registro de vistas y acciones, utilidades de HTML y voz. */
import { LV, SKILLS, band } from './core.js';

export const S = {
  cloud: null, user: null, me: null, ready: false,
  // alumno
  sessions: [], diagnoses: [], assignments: [], mySubs: [], group: null,
  // profesor
  groups: [], students: [], studentSessions: {}, subs: [], tAssignments: [], library: [], groupId: null
};

export const views = {};      // nombre de ruta -> { role, render }
export const actions = {};    // data-action -> fn(el, event)
export const forms = {};      // data-form -> fn(form, event)
export const changes = {};    // data-change -> fn(el, event)

export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const lvl = (i, big) => (i == null || i < 0) ? '<span class="lvl">—</span>' : `<span class="lvl ${band(i)}${big ? ' big' : ''}">${LV[i]}</span>`;
export const lvlCode = (code, big) => lvl(LV.indexOf(code), big);
export const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

export function route() { return location.hash.replace('#', ''); }
export function go(r) { if (route() === r) render(); else location.hash = '#' + r; }

let renderFn = () => {};
export function setRenderer(fn) { renderFn = fn; }
export function render() { renderFn(); }

export function toast(msg, kind) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg; t.className = 'toast' + (kind ? ' ' + kind : ''); t.hidden = false;
  clearTimeout(toast.h); toast.h = setTimeout(() => { t.hidden = true; }, 3200);
}

/** Ejecuta una acción asíncrona mostrando el error en un aviso. */
export async function attempt(fn, errorEl) {
  try { return await fn(); } catch (e) {
    const { friendlyError } = await import('./cloud.js');
    const msg = friendlyError(e);
    if (errorEl) { errorEl.textContent = msg; errorEl.hidden = false; } else toast(msg, 'error');
    return undefined;
  }
}

export function ladder(levels, target) {
  return `<div class="ladder" role="table" aria-label="Nivel por destreza">
    <div class="ladder-head" role="row"><span></span><div class="scale">${LV.map(l => `<span>${l}</span>`).join('')}</div><span></span></div>
    ${SKILLS.map(s => {
      const L = levels[s.id];
      return `<div class="ladder-row" role="row"><span class="name" role="cell">${s.name}</span>
        <div class="segs" role="cell" aria-label="${s.name}: ${LV[L]}">${LV.map((_, i) =>
          `<span class="seg ${band(i)}${i <= L ? ' on' : ''}${target != null && i === target && L < target ? ' target' : ''}"></span>`).join('')}</div>
        <span role="cell">${lvl(L)}</span></div>`;
    }).join('')}
    <div class="legend"><span><i style="background:var(--band-a)"></i>A · básico</span><span><i style="background:var(--band-b)"></i>B · independiente</span><span><i style="background:var(--band-c)"></i>C · competente</span>${target != null ? '<span><i style="box-shadow:inset 0 0 0 2px var(--gold)"></i>objetivo</span>' : ''}</div>
  </div>`;
}

/** Bloque con la evaluación de la IA (o la revisada por el profesor). */
export function evaluationView(ai, review) {
  if (!ai && !review) return '';
  const crit = (ai && ai.criteria) || [];
  const finalLevel = review && review.overall ? review.overall : ai && ai.overall;
  return `<section class="panel">
    <div class="row between"><h2>${review ? 'Evaluación revisada por tu profesor' : 'Evaluación de la IA'}</h2>${lvlCode(finalLevel, true)}</div>
    ${ai && ai.summary ? `<p>${esc(ai.summary)}</p>` : ''}
    ${crit.length ? `<div class="crit-list">${crit.map((c, i) => {
      const lvC = review && review.criteria && review.criteria[i] ? review.criteria[i] : c.level;
      return `<div class="crit-row"><div><b>${esc(c.name)}</b><p class="small muted">${esc(c.comment)}</p></div>${lvlCode(lvC)}</div>`;
    }).join('')}</div>` : ''}
    ${ai && ai.corrections && ai.corrections.length ? `<div class="stack-sm"><h3>Correcciones</h3><ul class="clean">${ai.corrections.map(c =>
      `<li class="correction"><span lang="en"><span class="fix">${esc(c.original)}</span> → <span class="okw">${esc(c.corrected)}</span></span><span class="small muted">${esc(c.explanation)}</span></li>`).join('')}</ul></div>` : ''}
    ${ai && ai.tips && ai.tips.length ? `<div class="stack-sm"><h3>Consejos</h3><ul class="tips">${ai.tips.map(t => `<li>${esc(t)}</li>`).join('')}</ul></div>` : ''}
    ${review && review.comment ? `<div class="feedback ok"><b>Comentario del profesor:</b> ${esc(review.comment)}</div>` : ''}
  </section>`;
}

/* ---------- Voz ---------- */
export const TTS = typeof window !== 'undefined' && 'speechSynthesis' in window;
export const SR = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
function pickVoice() {
  const vs = TTS ? speechSynthesis.getVoices() : [];
  return vs.find(v => /^en[-_](GB|US)/i.test(v.lang) && /natural|google|neural|samantha|daniel/i.test(v.name)) ||
    vs.find(v => /^en[-_](GB|US)/i.test(v.lang)) || vs.find(v => /^en/i.test(v.lang)) || null;
}
if (TTS) speechSynthesis.getVoices();
export function speak(text, rate, onEnd) {
  if (!TTS) return false;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-GB';
  const v = pickVoice(); if (v) { u.voice = v; u.lang = v.lang; }
  u.rate = rate || 1;
  u.onend = u.onerror = () => onEnd && onEnd();
  speechSynthesis.speak(u);
  return true;
}
export function stopSpeech() { if (TTS) speechSynthesis.cancel(); }
export function setWave(on) { document.querySelectorAll('.wave').forEach(w => w.classList.toggle('on', on)); }
