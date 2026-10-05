/* English Compass — arranque, sesión, navegación y eventos. */
import { createCloud } from './cloud.js';
import { ACADEMY_NAME } from './firebase-config.js';
import { S, views, actions, forms, changes, esc, render, setRenderer, route, go, attempt, toast, stopSpeech } from './ui.js';
import { loadStudent } from './student.js';
import { loadTeacher } from './teacher.js';

const app = document.getElementById('app');
const nav = document.getElementById('nav');
const NAV = {
  student: [['inicio', 'Inicio'], ['diagnostico', 'Diagnóstico'], ['plan', 'Mi plan'], ['practica', 'Práctica'], ['progreso', 'Progreso']],
  teacher: [['grupo', 'Mi grupo'], ['revisiones', 'Revisiones'], ['tareas', 'Tareas']]
};
const HOME = { student: 'inicio', teacher: 'grupo' };
document.querySelectorAll('[data-academy]').forEach(el => { el.textContent = ACADEMY_NAME; });

/* ---------- Pantallas sin sesión ---------- */
const authHeader = `<div class="auth-brand"><svg width="56" height="56" viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="14" fill="none" stroke="var(--accent)" stroke-width="2.5"/><path d="M16 6 L19.5 16 L16 26 L12.5 16 Z" fill="var(--accent)"/><path d="M16 6 L19.5 16 L12.5 16 Z" fill="var(--gold)"/></svg>
  <h1>English Compass</h1><span class="muted">${esc(ACADEMY_NAME)}</span></div>`;
const demoNote = () => S.cloud.demo ? `<div class="banner"><span><b>Modo demostración.</b> Los datos se guardan solo en este navegador. Prueba con <span class="mono">profesor@demo.com</span> o <span class="mono">lucia@demo.com</span> (contraseña <span class="mono">demo1234</span>).</span><button class="btn small" data-action="demo-reset">Reiniciar datos</button></div>` : '';

views.entrar = { role: null, render: () => `<div class="auth">${authHeader}${demoNote()}
  <form class="panel" data-form="login">
    <label class="field" for="em">Correo electrónico<input id="em" name="email" type="email" required autocomplete="username"></label>
    <label class="field" for="pw">Contraseña<input id="pw" name="password" type="password" required autocomplete="current-password"></label>
    <p class="small error" id="form-msg" hidden></p>
    <button class="btn primary" type="submit">Entrar</button>
    <button class="btn ghost" type="button" data-action="forgot">¿Has olvidado la contraseña?</button></form>
  <div class="auth-links"><span class="muted small">¿Te ha invitado tu academia?</span><a class="btn" href="#activar">Activar mi cuenta con el código</a>
    <a class="small" href="#alta-profesor">Soy profesor y quiero darme de alta</a></div></div>` };

views.activar = { role: null, render: () => `<div class="auth">${authHeader}
  <form class="panel" data-form="register-student"><h2>Activar cuenta de alumno</h2>
    <label class="field" for="code">Código de invitación<input id="code" name="code" class="mono" required placeholder="B1-ABC-DEF" autocomplete="off"></label>
    <label class="field" for="nm">Nombre y apellido<input id="nm" name="name" required autocomplete="name" maxlength="60"></label>
    <label class="field" for="em2">Correo electrónico<input id="em2" name="email" type="email" required autocomplete="email"></label>
    <label class="field" for="pw2">Contraseña<input id="pw2" name="password" type="password" required minlength="8" autocomplete="new-password"></label>
    <span class="small muted">Al menos 8 caracteres e incluye un número.</span>
    <p class="small error" id="form-msg" hidden></p>
    <button class="btn primary" type="submit">Crear mi cuenta</button></form>
  <div class="auth-links"><a href="#entrar">Ya tengo cuenta</a></div></div>` };

views['alta-profesor'] = { role: null, render: () => `<div class="auth">${authHeader}
  <form class="panel" data-form="register-teacher"><h2>Alta de profesor</h2>
    <p class="small muted">Necesitas el código de profesor que te da la dirección de la academia.</p>
    <label class="field" for="tc">Código de profesor<input id="tc" name="teacherCode" required autocomplete="off"></label>
    <label class="field" for="tn">Nombre y apellido<input id="tn" name="name" required autocomplete="name" maxlength="60"></label>
    <label class="field" for="te">Correo electrónico<input id="te" name="email" type="email" required autocomplete="email"></label>
    <label class="field" for="tp">Contraseña<input id="tp" name="password" type="password" required minlength="8" autocomplete="new-password"></label>
    <span class="small muted">Al menos 8 caracteres e incluye un número.</span>
    <p class="small error" id="form-msg" hidden></p>
    <button class="btn primary" type="submit">Crear cuenta de profesor</button></form>
  <div class="auth-links"><a href="#entrar">Ya tengo cuenta</a></div></div>` };

const busy = (form, on, label) => { const b = form.querySelector('button[type=submit]'); if (b) { b.disabled = on; if (label) b.textContent = label; } };
forms.login = async form => {
  busy(form, true);
  await attempt(() => S.cloud.signIn(form.email.value, form.password.value), form.querySelector('#form-msg'));
  busy(form, false);
};
forms['register-student'] = async form => {
  busy(form, true, 'Creando cuenta…');
  const ok = await attempt(() => S.cloud.registerStudent({ code: form.code.value, name: form.name.value, email: form.email.value, password: form.password.value }), form.querySelector('#form-msg'));
  if (!ok) busy(form, false, 'Crear mi cuenta');
};
forms['register-teacher'] = async form => {
  busy(form, true, 'Creando cuenta…');
  const ok = await attempt(() => S.cloud.registerTeacher({ teacherCode: form.teacherCode.value, name: form.name.value, email: form.email.value, password: form.password.value }), form.querySelector('#form-msg'));
  if (!ok) busy(form, false, 'Crear cuenta de profesor');
};
actions.forgot = async () => {
  const email = document.getElementById('em').value.trim();
  if (!email) { toast('Escribe tu correo y vuelve a pulsar.'); return; }
  const ok = await attempt(async () => { await S.cloud.resetPassword(email); return true; });
  if (ok) toast('Si el correo existe, te hemos enviado un enlace para crear una contraseña nueva.');
};
actions.logout = async () => { stopSpeech(); await S.cloud.signOut(); };
actions['demo-reset'] = () => { S.cloud.reset(); toast('Datos de demostración reiniciados.'); go('entrar'); };

/* ---------- Render ---------- */
function role() { return S.me ? S.me.role : null; }
function renderNav() {
  const r = role(), current = route();
  if (!r) { nav.innerHTML = ''; return; }
  nav.innerHTML = NAV[r].map(([k, l]) => `<a href="#${k}" ${k === current || (current === 'alumno' && k === 'grupo') || (current === 'tarea' && k === 'inicio') ? 'aria-current="page"' : ''}>${l}</a>`).join('')
    + `<button class="navbtn" data-action="logout">Salir</button>`;
}
setRenderer(() => {
  if (!S.ready) { app.innerHTML = '<p class="muted loading">Cargando…</p>'; return; }
  const r = role();
  let name = route();
  const v = views[name];
  if (!v || v.role !== r) { name = r ? HOME[r] : 'entrar'; if (route() !== name) { history.replaceState(null, '', '#' + name); } }
  renderNav();
  document.body.dataset.role = r || 'guest';
  const banner = S.cloud.demo && r ? '<div class="banner small">Modo demostración: los datos se guardan solo en este navegador.</div>' : '';
  app.innerHTML = banner + views[name].render();
});

window.addEventListener('hashchange', () => {
  stopSpeech();
  const v = views[route()];
  if (v && v.enter) v.enter();
  render(); window.scrollTo(0, 0);
});
document.addEventListener('click', e => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const fn = actions[el.dataset.action];
  if (fn) fn(el, e);
});
document.addEventListener('change', e => {
  const el = e.target.closest('[data-change]');
  if (el && changes[el.dataset.change]) changes[el.dataset.change](el, e);
});
document.addEventListener('input', e => {
  if (e.target.tagName === 'TEXTAREA') {
    const wc = document.querySelector('[data-wc]');
    if (wc) wc.textContent = (e.target.value.match(/[A-Za-z']+/g) || []).length;
  }
});
document.addEventListener('submit', e => {
  e.preventDefault();
  const fn = forms[e.target.dataset.form];
  if (fn) fn(e.target, e);
});

/* ---------- Sesión ---------- */
S.cloud = createCloud();
render();
S.cloud.onAuth(async (user, me) => {
  S.user = user; S.me = me; S.ready = false; render();
  if (user && !me) {
    // Cuenta creada pero sin perfil (registro interrumpido): se cierra la sesión.
    S.ready = true; await S.cloud.signOut(); return;
  }
  if (me) {
    await attempt(() => (me.role === 'teacher' ? loadTeacher() : loadStudent()));
    if (['entrar', 'activar', 'alta-profesor', ''].includes(route())) history.replaceState(null, '', '#' + HOME[me.role]);
  }
  S.ready = true;
  render();
});
