/* English Compass — lógica de la aplicación (vanilla JS, sin dependencias). */
(function () {
  'use strict';

  const D = window.EC_DATA;
  const LV = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  const LV_NAME = ['Acceso', 'Plataforma', 'Umbral', 'Avanzado', 'Dominio operativo', 'Maestría'];
  const SKILLS = [
    { id: 'reading', name: 'Lectura' },
    { id: 'listening', name: 'Comprensión auditiva' },
    { id: 'grammar', name: 'Gramática' },
    { id: 'vocabulary', name: 'Vocabulario' },
    { id: 'writing', name: 'Escritura' },
    { id: 'speaking', name: 'Expresión oral' }
  ];
  const SK = Object.fromEntries(SKILLS.map(s => [s.id, s]));
  const MC_SKILLS = ['reading', 'listening', 'grammar', 'vocabulary'];
  const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  const DAY_SETS = { 3: [0, 2, 4], 4: [0, 1, 3, 4], 5: [0, 1, 2, 3, 4], 6: [0, 1, 2, 3, 4, 5], 7: [0, 1, 2, 3, 4, 5, 6] };
  const band = i => (i < 2 ? 'a' : i < 4 ? 'b' : 'c');
  const bandKey = i => band(i).toUpperCase();
  const app = document.getElementById('app');

  /* ---------- Utilidades ---------- */
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const lvl = (i, big) => `<span class="lvl ${band(i)}${big ? ' big' : ''}">${LV[i]}</span>`;
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const avg = a => a.reduce((x, y) => x + y, 0) / (a.length || 1);
  const pad = n => String(n).padStart(2, '0');
  const dateKey = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const todayKey = () => dateKey(new Date());
  const weekday = (d = new Date()) => (d.getDay() + 6) % 7;
  const fmtDate = k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }); };
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const weekStart = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return addDays(d, -weekday(d)); };

  /* ---------- Estado persistente ---------- */
  const KEY = 'english-compass:v1';
  const fresh = () => ({ profile: null, history: [], plan: null, log: [], done: {}, example: false });
  let state;
  try { state = JSON.parse(localStorage.getItem(KEY)) || fresh(); } catch (e) { state = fresh(); }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* almacenamiento no disponible */ } }

  /* ---------- Audio: síntesis y reconocimiento de voz ---------- */
  const TTS = 'speechSynthesis' in window;
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  function pickVoice() {
    const vs = TTS ? speechSynthesis.getVoices() : [];
    return vs.find(v => /^en[-_](GB|US)/i.test(v.lang) && /natural|google|neural|samantha|daniel/i.test(v.name)) ||
      vs.find(v => /^en[-_](GB|US)/i.test(v.lang)) || vs.find(v => /^en/i.test(v.lang)) || null;
  }
  if (TTS) { speechSynthesis.getVoices(); speechSynthesis.onvoiceschanged = () => {}; }
  function speak(text, rate, onEnd) {
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
  function stopSpeech() { if (TTS) speechSynthesis.cancel(); }
  function setWave(on) { document.querySelectorAll('.wave').forEach(w => w.classList.toggle('on', on)); }

  /* ---------- Cálculo de niveles ---------- */
  function overallLevel(levels) { return Math.min(5, Math.floor(avg(SKILLS.map(s => levels[s.id])) + 0.4)); }

  function canDoLevel(checkedCounts, statements) {
    let level = -1;
    for (let i = 0; i < 6; i++) {
      if (checkedCounts[i] >= Math.ceil(statements[i].length / 2)) level = i; else break;
    }
    return level;
  }

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
  function analyzeText(t) {
    const text = t.trim();
    const lower = ' ' + text.toLowerCase().replace(/[’]/g, "'") + ' ';
    const words = lower.match(/[a-z']+/g) || [];
    const wc = words.length;
    const sentences = text.split(/[.!?]+(?:\s|$)/).filter(s => s.trim().split(/\s+/).length >= 2);
    const sc = Math.max(1, sentences.length);
    const asl = wc / sc;
    const uniq = new Set(words).size;
    const guiraud = wc ? uniq / Math.sqrt(wc) : 0;
    const longRatio = wc ? words.filter(w => w.length >= 7).length / wc : 0;
    const found = k => CONNECTORS[k].filter(c => new RegExp('\\b' + c + '\\b').test(lower));
    const conn = { basic: found('basic'), mid: found('mid'), adv: found('adv') };
    const structs = STRUCTURES.filter(s => s.re.test(lower));
    if (wc < 20) return { wc, sc, asl, guiraud, longRatio, conn, structs, estimate: null };
    let score = 0;
    score += wc >= 40 ? 0.5 : 0; score += wc >= 80 ? 0.5 : 0;
    score += asl < 8 ? 0 : asl < 12 ? 0.5 : asl < 18 ? 1 : 1.2;
    score += guiraud < 5 ? 0 : guiraud < 6.5 ? 0.5 : guiraud < 8 ? 1 : 1.5;
    score += conn.basic.length ? 0.3 : 0;
    score += Math.min(1, conn.mid.length * 0.4) + Math.min(1, conn.adv.length * 0.5);
    score += Math.min(1.2, structs.length * 0.3);
    score += longRatio > 0.22 ? 1 : longRatio > 0.15 ? 0.5 : 0;
    const estimate = score < 1.5 ? 0 : score < 2.5 ? 1 : score < 3.6 ? 2 : score < 4.8 ? 3 : score < 6 ? 4 : 5;
    return { wc, sc, asl, guiraud, longRatio, conn, structs, estimate, score };
  }
  function writingTips(a) {
    const tips = [];
    if (a.estimate === null) { tips.push('Escribe al menos 20 palabras para poder estimar tu nivel.'); return tips; }
    if (a.asl < 9) tips.push('Tus frases son muy cortas. Une ideas con conectores (because, although, which) para ganar fluidez.');
    if (a.asl > 28) tips.push('Algunas frases son muy largas. Divide las que tengan más de una idea principal.');
    if (!a.conn.mid.length) tips.push('Prueba conectores de nivel intermedio: however, although, therefore, on the other hand.');
    else if (!a.conn.adv.length) tips.push('Para subir a C1, incorpora conectores como nevertheless, furthermore, consequently o that said.');
    if (a.guiraud < 6) tips.push('Repites bastantes palabras. Busca sinónimos y evita repetir el mismo verbo o adjetivo.');
    const missing = STRUCTURES.filter(s => !a.structs.includes(s)).slice(0, 2);
    if (missing.length) tips.push('Estructuras que no aparecen y podrías practicar: ' + missing.map(s => s.name).join('; ') + '.');
    if (!tips.length) tips.push('Buen texto. Revisa ahora la precisión: concordancia sujeto-verbo, artículos y preposiciones.');
    return tips;
  }
  function renderAnalysis(a) {
    const est = a.estimate === null ? '—' : LV[a.estimate];
    return `<div class="metrics">
      <div class="metric"><b>${a.wc}</b><span>palabras</span></div>
      <div class="metric"><b>${a.asl.toFixed(1)}</b><span>palabras por frase</span></div>
      <div class="metric"><b>${a.guiraud.toFixed(1)}</b><span>riqueza léxica (índice de Guiraud)</span></div>
      <div class="metric"><b>${a.conn.mid.length + a.conn.adv.length}</b><span>conectores intermedios/avanzados</span></div>
      <div class="metric"><b>${est}</b><span>estimación orientativa</span></div>
    </div>
    <div class="stack-sm"><h3>Recomendaciones</h3><ul class="tips">${writingTips(a).map(t => `<li>${esc(t)}</li>`).join('')}</ul>
    <p class="small muted">La estimación se basa en métricas del texto (longitud, variedad léxica, conectores y estructuras). No evalúa la corrección gramatical: compárala con un modelo o pide revisión a un profesor.</p></div>`;
  }

  /* ---------- Plan de estudio ---------- */
  function buildPlan(levels, minutes, days) {
    const overall = overallLevel(levels);
    const maintain = overall === 5;
    const target = Math.min(overall + 1, 5);
    const weights = {}, practiceLevel = {};
    SKILLS.forEach(s => {
      const gap = target - levels[s.id];
      weights[s.id] = gap > 0 ? 1 + 1.5 * gap : (maintain ? 1 : 0.6);
      practiceLevel[s.id] = gap > 0 ? Math.min(levels[s.id] + 1, 5) : levels[s.id];
    });
    const gapAvg = avg(SKILLS.map(s => Math.min(1, Math.max(0, target - levels[s.id]))));
    const extraGaps = SKILLS.reduce((n, s) => n + Math.max(0, target - levels[s.id] - 1), 0);
    const hours = maintain ? 120 : Math.round(D.hours[overall] * (0.5 + 0.5 * gapAvg) + extraGaps * 25);
    const weeks = Math.max(2, Math.ceil(hours * 60 / (minutes * days)));

    const perDay = minutes >= 40 ? 3 : minutes >= 20 ? 2 : 1;
    const blockMin = Math.round(minutes / perDay);
    const total = perDay * days;
    // Reparto de bloques semanales por destreza (mínimo 1 si hay sitio) con restos mayores.
    const counts = Object.fromEntries(SKILLS.map(s => [s.id, 0]));
    let left = total;
    if (total >= SKILLS.length) { SKILLS.forEach(s => { counts[s.id] = 1; }); left -= SKILLS.length; }
    const wsum = avg(Object.values(weights)) * SKILLS.length;
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

    // Hitos: primera revisión a las 4 semanas, controles en cada cuarto del plan y meta final.
    const ms = [{ week: Math.min(4, weeks), text: 'Primer control: repite el diagnóstico y regenera el plan con tus nuevos niveles. A partir de aquí, repítelo cada 4 semanas.' }];
    if (weeks >= 12) ms.push({ week: Math.round(weeks / 4), text: 'Revisa tus aciertos por destreza en Progreso: las que estén por encima del 70 % pueden practicar ya en el nivel objetivo.' });
    if (weeks >= 6) ms.push({ week: Math.ceil(weeks / 2), text: `Mitad del camino: haz un examen de práctica de ${D.exams[target]} (hay muestras gratuitas en la web de Cambridge English).` });
    if (weeks >= 12) ms.push({ week: Math.round(weeks * 3 / 4), text: 'Simulacro con tiempo de las cuatro partes del examen y ajuste del plan según los resultados.' });
    ms.push({ week: weeks, text: maintain
      ? 'Revisión final: diagnóstico completo y nuevo ciclo de perfeccionamiento.'
      : `Meta ${LV[target]}: diagnóstico completo. Si quieres certificarlo, preséntate a ${D.exams[target]}.` });
    const milestones = ms.filter((m, i) => !i || m.week > ms[i - 1].week);

    const weakest = SKILLS.slice().sort((a, b) => levels[a.id] - levels[b.id])[0];
    const t1 = Math.max(1, Math.round(weeks / 3)), t2 = Math.max(t1 + 1, Math.round(weeks * 2 / 3));
    const phases = [
      { from: 1, to: t1, name: 'Base', text: `Rutina diaria y refuerzo de ${weakest.name.toLowerCase()}. Repasa las estructuras y el vocabulario de ${LV[Math.max(0, target - 1)]} que aún fallen.` },
      { from: t1 + 1, to: t2, name: 'Consolidación', text: `Trabaja con materiales de nivel ${LV[target]} aunque cueste. Prioriza la cantidad de lectura y escucha.` },
      { from: t2 + 1, to: weeks, name: 'Transferencia', text: 'Usa el inglés en tareas reales: conversaciones, textos largos y simulacros con tiempo.' }
    ].filter(p => p.from <= p.to);

    const start = new Date();
    return {
      created: todayKey(), from: overall, target, maintain, minutes, days, perDay, weeks, hours,
      endDate: dateKey(addDays(start, weeks * 7)), weights, practiceLevel, counts, schedule, milestones, phases,
      levels: Object.assign({}, levels)
    };
  }

  /* ---------- Registro de sesiones ---------- */
  function logSession(entry) {
    entry.date = todayKey();
    state.log.push(entry);
    // Marca automáticamente la primera tarea pendiente de esa destreza para hoy.
    if (state.plan) {
      const blocks = state.plan.schedule[weekday()].blocks;
      const done = state.done[entry.date] || (state.done[entry.date] = []);
      const idx = blocks.findIndex((b, i) => b.skill === entry.skill && !done.includes(i));
      if (idx >= 0) done.push(idx);
    }
    save();
  }
  function weekMinutes() {
    const ws = dateKey(weekStart());
    return state.log.filter(l => l.date >= ws).reduce((a, l) => a + (l.minutes || 0), 0);
  }
  function streak() {
    const days = new Set(state.log.map(l => l.date));
    Object.keys(state.done).forEach(k => { if (state.done[k].length) days.add(k); });
    let d = new Date(); let n = 0;
    if (!days.has(dateKey(d))) d = addDays(d, -1);
    while (days.has(dateKey(d))) { n++; d = addDays(d, -1); }
    return n;
  }

  /* ---------- Componentes compartidos ---------- */
  function ladder(levels, target) {
    return `<div class="ladder" role="table" aria-label="Nivel por destreza">
      <div class="ladder-head" role="row"><span></span><div class="scale">${LV.map(l => `<span>${l}</span>`).join('')}</div><span></span></div>
      ${SKILLS.map(s => {
        const L = levels[s.id];
        return `<div class="ladder-row" role="row"><span class="name" role="cell">${s.name}</span>
          <div class="segs" role="cell" aria-label="${s.name}: ${LV[L]}">${LV.map((_, i) =>
            `<span class="seg ${band(i)}${i <= L ? ' on' : ''}${target != null && i === target && L < target ? ' target' : ''}"></span>`).join('')}</div>
          <span role="cell">${lvl(L)}</span></div>`;
      }).join('')}
      <div class="legend"><span><i style="background:var(--band-a)"></i>A · usuario básico</span><span><i style="background:var(--band-b)"></i>B · usuario independiente</span><span><i style="background:var(--band-c)"></i>C · usuario competente</span>${target != null ? '<span><i style="box-shadow:inset 0 0 0 2px var(--gold)"></i>nivel objetivo</span>' : ''}</div>
    </div>`;
  }
  function exampleBanner() {
    return state.example ? `<div class="banner"><span><b>Perfil de ejemplo.</b> Estos niveles y sesiones son ficticios. Haz el diagnóstico para obtener los tuyos.</span><button class="btn small" data-action="clear-example">Quitar ejemplo</button></div>` : '';
  }
  function mcQuestion(q, name, i) {
    return `<fieldset class="q" style="border:0;padding:0;margin:0"><legend class="q-text">${i + 1}. ${esc(q.q)}</legend>
      <div class="opts">${q.options.map((o, j) => `<label class="opt" data-q="${i}" data-o="${j}"><input type="radio" name="${name}${i}" value="${j}"><span>${esc(o)}</span></label>`).join('')}</div></fieldset>`;
  }
  function audioBox(id, extra) {
    return `<div class="audio-box"><button class="btn primary" data-action="play" data-id="${id}">▶ Escuchar</button><span class="wave" aria-hidden="true"><i></i><i></i><i></i><i></i></span>${extra || ''}</div>
      ${TTS ? '' : '<p class="feedback ko">Tu navegador no puede reproducir voz sintética. Se muestra la transcripción para que puedas continuar.</p>'}`;
  }
  function collect(form, name, n) {
    const out = [];
    for (let i = 0; i < n; i++) { const r = form.querySelector(`input[name="${name}${i}"]:checked`); out.push(r ? Number(r.value) : null); }
    return out;
  }

  /* =========================================================
     VISTA: Inicio
     ========================================================= */
  function viewHome() {
    if (!state.profile) {
      return `<section class="stack">
        <p class="eyebrow">Marco Común Europeo de Referencia · A1 a C2</p>
        <h1>¿Qué nivel de inglés tienes hoy y qué necesitas para subir al siguiente?</h1>
        <p class="lead">Mide seis destrezas, recibe un plan semanal con horas realistas y practica lectura, escucha, gramática, vocabulario, escritura y expresión oral en un solo lugar.</p>
        <div class="row"><a class="btn primary" href="#diagnostico">Empezar diagnóstico (≈ 20 min)</a><button class="btn" data-action="load-example">Ver un perfil de ejemplo</button></div>
      </section>
      <section class="panel"><h2>Cómo funciona</h2>
        <ol class="steps">
          <li><b>Diagnóstico adaptativo</b><span class="muted small">Empieza en B1 y sube o baja según aciertes. Lectura, escucha, gramática y vocabulario se miden con preguntas; escritura con un texto analizado y autoevaluación; expresión oral con autoevaluación.</span></li>
          <li><b>Plan al siguiente nivel</b><span class="muted small">Calcula semanas a partir de las horas guiadas de referencia y tu disponibilidad, y reparte más tiempo a tus destrezas más débiles.</span></li>
          <li><b>Práctica y seguimiento</b><span class="muted small">Cada día ves tus tareas, practicas en la app y registras minutos y aciertos. Cada 4 semanas repites el diagnóstico.</span></li>
        </ol>
      </section>
      <section class="panel"><h2>Los seis niveles</h2>
        <div class="cefr">${LV.map((l, i) => `<div class="${band(i)}">${lvl(i)}<b>${LV_NAME[i]}</b><span class="small muted">${D.cando.speaking[i][0]}</span></div>`).join('')}</div>
      </section>`;
    }
    const p = state.profile, plan = state.plan;
    const target = plan ? plan.target : Math.min(p.overall + 1, 5);
    let today = '';
    if (plan) {
      const wd = weekday(), blocks = plan.schedule[wd].blocks, done = state.done[todayKey()] || [];
      const planned = plan.minutes * plan.days, wm = weekMinutes();
      today = `<section class="panel">
        <div class="row between"><h2>Hoy · ${DAYS[wd]}</h2><span class="small muted">${done.length}/${blocks.length} tareas</span></div>
        ${blocks.length ? `<div>${blocks.map((b, i) => `<div class="task${done.includes(i) ? ' done' : ''}">
            <input type="checkbox" id="task-${i}" data-action="toggle-task" data-i="${i}" ${done.includes(i) ? 'checked' : ''} aria-label="Marcar como hecha">
            <div class="task-body"><span class="tag">${SK[b.skill].name} · ${b.minutes} min · ${LV[plan.practiceLevel[b.skill]]}</span><label for="task-${i}">${esc(b.activity)}</label></div>
            <a class="btn small" href="#practica" data-action="goto-practice" data-skill="${b.skill}">Practicar</a></div>`).join('')}</div>`
          : '<p class="muted">Hoy es día de descanso en tu plan. Si te apetece, haz una sesión corta de escucha.</p>'}
        <div class="stack-sm"><div class="row between small"><span>Minutos esta semana</span><span class="mono">${wm} / ${planned}</span></div>
        <div class="progressbar"><span style="width:${Math.min(100, Math.round(wm / planned * 100))}%"></span></div></div>
      </section>`;
    }
    return `${exampleBanner()}
      <section class="panel">
        <div class="row between"><div class="stack-sm"><p class="eyebrow">Diagnóstico del ${fmtDate(p.date)}</p>
          <div class="hero-levels"><span class="stack-sm"><span class="small muted">Nivel global</span>${lvl(p.overall, true)}</span><span class="arrow">→</span><span class="stack-sm"><span class="small muted">Objetivo</span>${lvl(target, true)}</span></div></div>
          <div class="row">${plan ? '<a class="btn" href="#plan">Ver plan</a>' : '<a class="btn primary" href="#plan">Crear mi plan</a>'}<a class="btn ghost" href="#diagnostico">Repetir diagnóstico</a></div></div>
        ${ladder(p.levels, target)}
      </section>
      ${today}`;
  }

  /* =========================================================
     VISTA: Diagnóstico
     ========================================================= */
  let diag = null;
  const DIAG_STAGES = ['reading', 'listening', 'grammar', 'vocabulary', 'writing', 'speaking'];
  function diagStart() { diag = { stage: 0, results: {}, below: {}, mc: { skill: 'reading', level: 2, tried: {}, plays: 0 }, writing: null }; }

  function viewDiag() {
    if (!diag) {
      return `<section class="stack"><p class="eyebrow">Diagnóstico</p><h1>Prueba de nivel en seis destrezas</h1>
        <p class="lead">Unos 20 minutos. Las preguntas se adaptan: si aciertas sube la dificultad y si fallas baja. No consultes el diccionario; el objetivo es saber dónde estás, no sacar nota.</p></section>
        <section class="panel"><h2>Qué vas a hacer</h2>
        <ul class="clean">
          <li><b>Lectura y comprensión auditiva:</b> textos y audios breves con 3 preguntas cada uno. El audio se reproduce con voz sintética y puedes oírlo dos veces.</li>
          <li><b>Gramática y vocabulario:</b> bloques de 3 preguntas por nivel.</li>
          <li><b>Escritura:</b> un texto corto de 80–150 palabras y una lista de descriptores «puedo…».</li>
          <li><b>Expresión oral:</b> autoevaluación con descriptores del MCER.</li>
        </ul>
        <div class="row"><button class="btn primary" data-action="diag-start">Comenzar</button>${TTS ? '' : '<span class="small muted">Tu navegador no tiene voz sintética: en la escucha verás la transcripción.</span>'}</div></section>`;
    }
    const stageName = DIAG_STAGES[diag.stage];
    const prog = `<div class="stack-sm"><div class="row between small"><span class="eyebrow">Parte ${Math.min(diag.stage + 1, 6)} de 6 · ${stageName ? SK[stageName].name : 'Resultados'}</span></div>
      <div class="progressbar"><span style="width:${Math.round(diag.stage / 6 * 100)}%"></span></div></div>`;
    if (diag.stage < 4) return prog + viewDiagMC();
    if (diag.stage === 4) return prog + viewDiagCando('writing');
    if (diag.stage === 5) return prog + viewDiagCando('speaking');
    return viewDiagResults();
  }

  function mcItems(skill, level) {
    if (skill === 'reading') return D.reading[level].questions;
    if (skill === 'listening') return D.listening[level].questions;
    return D[skill][level].slice(0, 3);
  }
  function viewDiagMC() {
    const { skill, level } = diag.mc;
    const qs = mcItems(skill, level);
    let head = '';
    if (skill === 'reading') head = `<h2>${esc(D.reading[level].title)}</h2><div class="passage" lang="en">${esc(D.reading[level].text)}</div>`;
    if (skill === 'listening') {
      const l = D.listening[level];
      head = `<h2>${esc(l.title)}</h2>
        ${audioBox('diag-listen', `<span class="small muted">Reproducciones restantes: <b class="mono" id="plays-left">${2 - diag.mc.plays}</b></span>`)}
        ${TTS ? '' : `<div class="passage" lang="en">${esc(l.script)}</div>`}`;
    }
    if (skill === 'grammar') head = '<h2>Elige la opción correcta</h2>';
    if (skill === 'vocabulary') head = '<h2>Elige la palabra adecuada</h2>';
    return `<form class="panel" data-form="diag-mc" lang="en">${head}
      ${qs.map((q, i) => mcQuestion(q, 'dq', i)).join('')}
      <p class="small muted" lang="es" id="diag-msg"></p>
      <div class="row"><button class="btn primary" type="submit" lang="es">Continuar</button></div></form>`;
  }
  function submitDiagMC(form) {
    const { skill } = diag.mc;
    const L = diag.mc.level;
    const qs = mcItems(skill, L);
    const ans = collect(form, 'dq', qs.length);
    if (ans.includes(null)) { form.querySelector('#diag-msg').textContent = 'Responde todas las preguntas. Si no sabes, elige la que te parezca más probable.'; return; }
    stopSpeech();
    const correct = ans.filter((a, i) => a === qs[i].answer).length;
    const pass = correct >= 2;
    const mc = diag.mc;
    mc.tried[L] = pass;
    let final;
    if (pass) { if (L === 5) final = 5; else if (mc.tried[L + 1] === false) final = L; else mc.level = L + 1; }
    else { if (L === 0) { final = 0; diag.below[skill] = true; } else if (mc.tried[L - 1] === true) final = L - 1; else mc.level = L - 1; }
    mc.plays = 0;
    if (final !== undefined) {
      diag.results[skill] = final;
      diag.stage++;
      if (diag.stage < 4) diag.mc = { skill: DIAG_STAGES[diag.stage], level: 2, tried: {}, plays: 0 };
    }
    render(); window.scrollTo(0, 0);
  }

  function viewDiagCando(skill) {
    const st = D.cando[skill];
    const isW = skill === 'writing';
    return `<form class="panel" data-form="diag-cando" data-skill="${skill}">
      <h2>${isW ? 'Escritura' : 'Expresión oral'}</h2>
      ${isW ? `<div class="stack-sm"><p><b>1. Escribe un texto breve.</b> Se analizará automáticamente (longitud, variedad de vocabulario, conectores y estructuras).</p>
        <div class="passage" lang="en">${esc(D.diagnosticWritingPrompt)}</div>
        <textarea id="diag-text" aria-label="Tu texto" lang="en" spellcheck="false" placeholder="Write here…"></textarea>
        <p class="small muted"><span class="mono" id="wc">0</span> palabras</p></div>
        <p><b>2. Marca lo que eres capaz de hacer por escrito</b> sin ayuda.</p>`
      : `<p>Marca lo que eres capaz de hacer <b>hablando en inglés</b> sin preparación previa. Sé realista: piensa en cómo te desenvuelves de verdad, no en cómo te gustaría.</p>`}
      <div>${st.map((arr, i) => `<div class="cando-level"><div class="row">${lvl(i)}<span class="small muted">${LV_NAME[i]}</span></div>
        ${arr.map((s, j) => `<label class="check"><input type="checkbox" name="cd${i}" value="${j}" id="cd-${skill}-${i}-${j}"><span>${esc(s)}</span></label>`).join('')}</div>`).join('')}</div>
      <p class="small muted" id="diag-msg"></p>
      <div class="row"><button class="btn primary" type="submit">Continuar</button></div></form>`;
  }
  function submitDiagCando(form) {
    const skill = form.dataset.skill;
    const counts = [0, 1, 2, 3, 4, 5].map(i => form.querySelectorAll(`input[name="cd${i}"]:checked`).length);
    const self = canDoLevel(counts, D.cando[skill]);
    let level = Math.max(0, self);
    if (skill === 'writing') {
      const a = analyzeText(form.querySelector('#diag-text').value);
      if (a.estimate === null && a.wc > 0) { form.querySelector('#diag-msg').textContent = 'Escribe al menos 20 palabras, o deja el texto vacío para usar solo la autoevaluación.'; return; }
      diag.writing = a;
      if (a.estimate !== null) level = Math.round((Math.max(0, self) + a.estimate) / 2);
    }
    if (self < 0) diag.below[skill] = true;
    diag.results[skill] = level;
    diag.stage++;
    if (diag.stage === 6) {
      const levels = Object.assign({}, diag.results);
      const profile = { date: todayKey(), levels, overall: overallLevel(levels), below: diag.below };
      if (state.example) { state = fresh(); }
      state.profile = profile; state.history.push(profile);
      save();
    }
    render(); window.scrollTo(0, 0);
  }
  function viewDiagResults() {
    const p = state.profile, target = Math.min(p.overall + 1, 5);
    const sorted = SKILLS.slice().sort((a, b) => p.levels[a.id] - p.levels[b.id]);
    const below = Object.keys(p.below || {});
    return `<section class="stack"><p class="eyebrow">Resultados</p><h1>Tu nivel global es ${LV[p.overall]}</h1>
      <p class="lead">${p.overall === 5 ? 'Estás en el nivel más alto del marco. El plan se centrará en perfeccionar y mantener.' : `Tu siguiente meta es ${LV[target]} (${LV_NAME[target]}). La destreza que más tira hacia abajo es <b>${sorted[0].name.toLowerCase()}</b>; tu punto fuerte es <b>${sorted[5].name.toLowerCase()}</b>.`}</p></section>
      <section class="panel"><div class="hero-levels">${lvl(p.overall, true)}<span class="arrow">→</span>${lvl(target, true)}</div>${ladder(p.levels, target)}
      ${below.length ? `<p class="small muted">En ${below.map(s => SK[s].name.toLowerCase()).join(', ')} no superaste el bloque A1: empieza por lo más básico.</p>` : ''}</section>
      ${diag && diag.writing && diag.writing.estimate !== null ? `<section class="panel"><h2>Análisis de tu texto</h2>${renderAnalysis(diag.writing)}</section>` : ''}
      <section class="panel"><h2>Siguiente paso</h2><p>Crea un plan semanal ajustado a tu tiempo disponible. Más adelante podrás regenerarlo.</p>
      <div class="row"><a class="btn primary" href="#plan">Crear mi plan</a><button class="btn ghost" data-action="diag-reset">Hacer el diagnóstico de nuevo</button></div></section>`;
  }

  /* =========================================================
     VISTA: Plan
     ========================================================= */
  function planForm(current) {
    const m = current ? current.minutes : 30, d = current ? current.days : 5;
    return `<form class="row" data-form="plan" style="align-items:flex-end">
      <label class="field" for="pl-min">Minutos al día<select id="pl-min" name="minutes">${[15, 20, 30, 45, 60, 90].map(v => `<option value="${v}"${v === m ? ' selected' : ''}>${v} min</option>`).join('')}</select></label>
      <label class="field" for="pl-days">Días por semana<select id="pl-days" name="days">${[3, 4, 5, 6, 7].map(v => `<option value="${v}"${v === d ? ' selected' : ''}>${v} días</option>`).join('')}</select></label>
      <button class="btn primary" type="submit">${current ? 'Regenerar plan' : 'Generar plan'}</button></form>`;
  }
  function viewPlan() {
    const p = state.profile;
    if (!p) return `<section class="stack"><p class="eyebrow">Mi plan</p><h1>Primero necesitamos saber tu nivel</h1><p class="lead">El plan se construye a partir de tu diagnóstico.</p>
      <div class="row"><a class="btn primary" href="#diagnostico">Hacer el diagnóstico</a><button class="btn" data-action="load-example">Ver un plan de ejemplo</button></div></section>`;
    const plan = state.plan;
    if (!plan) return `${exampleBanner()}<section class="stack"><p class="eyebrow">Mi plan</p><h1>Plan para pasar de ${LV[p.overall]} a ${LV[Math.min(p.overall + 1, 5)]}</h1>
      <p class="lead">Dime cuánto tiempo puedes dedicar. Es mejor poco y constante que mucho y esporádico.</p></section>
      <section class="panel">${planForm(null)}</section>`;
    const wd = weekday();
    const stale = p.date !== plan.created && state.history.length && JSON.stringify(plan.levels) !== JSON.stringify(p.levels);
    return `${exampleBanner()}
      ${stale ? '<div class="banner"><span>Tienes un diagnóstico más reciente que este plan.</span><button class="btn small primary" data-action="regen">Actualizar plan</button></div>' : ''}
      <section class="stack"><p class="eyebrow">Mi plan · creado el ${fmtDate(plan.created)}</p>
        <h1>${plan.maintain ? 'Perfeccionamiento en C2' : `De ${LV[plan.from]} a ${LV[plan.target]} en unas ${plan.weeks} semanas`}</h1>
        <p class="lead">Unas ${plan.hours} horas de práctica a ${plan.minutes} min/día, ${plan.days} días por semana. Fecha objetivo: <b>${fmtDate(plan.endDate)}</b>. La estimación parte de las horas de aprendizaje guiado de referencia y de la distancia entre tus destrezas y la meta.</p>
        ${plan.minutes * plan.days < 300 ? `<p class="small muted">Con 60 min al día, 6 días por semana, serían unas ${Math.max(2, Math.ceil(plan.hours / 6))} semanas.</p>` : ''}</section>
      <section class="panel"><h2>Dónde pones el foco</h2>${ladder(plan.levels, plan.target)}
        <div class="bars">${SKILLS.slice().sort((a, b) => plan.counts[b.id] - plan.counts[a.id]).map(s => {
          const mins = plan.counts[s.id] * Math.round(plan.minutes / plan.perDay);
          return `<div class="bar-row"><span>${s.name}</span><div class="bar"><span style="width:${Math.round(mins / (plan.minutes * plan.days) * 100)}%"></span></div><span class="mono">${mins}′/sem</span></div>`;
        }).join('')}</div>
        <p class="small muted">Las destrezas por debajo de ${LV[plan.target]} reciben más tiempo; el resto se mantiene con al menos un bloque semanal.</p></section>
      <section class="panel"><h2>Semana tipo</h2>
        <div class="week-wrap"><div class="week">${plan.schedule.map(d => `<div class="day${d.day === wd ? ' today' : ''}${d.blocks.length ? '' : ' rest'}"><h4>${DAYS[d.day]}${d.day === wd ? '<span class="tag">hoy</span>' : ''}</h4>
          ${d.blocks.length ? d.blocks.map(b => `<div class="blk"><b>${SK[b.skill].name}</b><span class="muted">${b.minutes} min · ${LV[plan.practiceLevel[b.skill]]}</span></div>`).join('') : '<span class="small muted">Descanso</span>'}</div>`).join('')}</div></div></section>
      <section class="grid-2">
        <div class="panel"><h2>Fases</h2><ul class="timeline">${plan.phases.map(ph => `<li><span class="mono small">Sem. ${ph.from}${ph.to > ph.from ? '–' + ph.to : ''}</span><div><b>${ph.name}</b><p class="small muted">${esc(ph.text)}</p></div></li>`).join('')}</ul></div>
        <div class="panel"><h2>Hitos</h2><ul class="timeline">${plan.milestones.map(m => `<li><span class="mono small">Sem. ${m.week}</span><span class="small">${esc(m.text)}</span></li>`).join('')}</ul></div>
      </section>
      <section class="panel"><h2>Actividades por destreza</h2>
        <div class="grid-2">${SKILLS.map(s => `<div class="stack-sm"><div class="row">${lvl(plan.practiceLevel[s.id])}<b>${s.name}</b></div>
          <ul class="tips small">${D.activities[s.id][bandKey(plan.practiceLevel[s.id])].map(a => `<li>${esc(a)}</li>`).join('')}</ul></div>`).join('')}</div></section>
      <section class="panel"><h2>Ajustar disponibilidad</h2>${planForm(plan)}</section>`;
  }

  /* =========================================================
     VISTA: Práctica
     ========================================================= */
  let prac = { skill: 'reading', level: null, session: null };
  function defaultLevel(skill) {
    if (state.plan) return state.plan.practiceLevel[skill];
    if (state.profile) return Math.min(5, state.profile.levels[skill] + 1);
    return 2;
  }
  function viewPractice() {
    if (prac.level == null) prac.level = defaultLevel(prac.skill);
    const s = prac.session;
    return `<section class="stack"><p class="eyebrow">Práctica</p><h1>${SK[prac.skill].name}</h1>
      <div class="chips" role="group" aria-label="Destreza">${SKILLS.map(x => `<button class="chip" data-action="prac-skill" data-skill="${x.id}" aria-pressed="${x.id === prac.skill}">${x.name}</button>`).join('')}</div>
      <div class="row small"><span class="muted">Nivel:</span><div class="chips" role="group" aria-label="Nivel">${LV.map((l, i) => `<button class="chip" data-action="prac-level" data-level="${i}" aria-pressed="${i === prac.level}">${l}</button>`).join('')}</div>
      ${state.profile ? `<span class="muted">Recomendado: ${LV[defaultLevel(prac.skill)]}</span>` : ''}</div></section>
      ${s ? practiceSession() : practiceIntro()}`;
  }
  function practiceIntro() {
    const k = prac.skill, L = prac.level;
    const info = {
      reading: `Un texto de nivel ${LV[L]} con 3 preguntas de comprensión.`,
      listening: `Un audio de nivel ${LV[L]} con 3 preguntas. Puedes ajustar la velocidad y ver la transcripción al terminar.`,
      grammar: `5 preguntas de gramática de nivel ${LV[L]}, con explicación de cada respuesta.`,
      vocabulary: `5 preguntas de vocabulario de nivel ${LV[L]}: colocaciones, phrasal verbs y registro.`,
      writing: `Una consigna de nivel ${LV[L]}. Al terminar verás métricas del texto y recomendaciones.`,
      speaking: `Shadowing (escucha y repite) o una charla cronometrada con consigna de nivel ${LV[L]}.`
    }[k];
    const btns = k === 'speaking'
      ? '<button class="btn primary" data-action="prac-start" data-mode="shadow">Shadowing</button><button class="btn" data-action="prac-start" data-mode="talk">Charla cronometrada</button>'
      : '<button class="btn primary" data-action="prac-start">Empezar</button>';
    return `<section class="panel"><p>${info}</p><div class="row">${btns}</div></section>`;
  }
  function startPractice(mode) {
    const k = prac.skill, L = prac.level;
    const s = { skill: k, level: L, start: Date.now(), mode: mode || null };
    if (k === 'grammar' || k === 'vocabulary') Object.assign(s, { items: shuffle(D[k][L]), idx: 0, correct: 0, answered: null });
    if (k === 'reading' || k === 'listening') Object.assign(s, { checked: null, rate: k === 'listening' ? D.listening[L].rate : 1 });
    if (k === 'writing') s.prompt = D.writingPrompts[L][Math.floor(Math.random() * 2)];
    if (k === 'speaking' && mode === 'talk') Object.assign(s, { prompt: D.speakingPrompts[L][Math.floor(Math.random() * 2)], secs: L < 2 ? 60 : L < 4 ? 90 : 120, left: null });
    if (k === 'speaking' && mode === 'shadow') s.scores = {};
    prac.session = s;
  }
  const minutesSince = t => Math.max(1, Math.round((Date.now() - t) / 60000));
  function finishPractice(correct, total) {
    const s = prac.session;
    logSession({ skill: s.skill, level: s.level, correct, total, minutes: minutesSince(s.start) });
    s.finished = { correct, total };
  }
  function practiceSession() {
    const s = prac.session;
    if (s.finished) {
      const f = s.finished;
      return `<section class="panel"><h2>Sesión guardada</h2>
        ${f.total ? `<p>Has acertado <b class="mono">${f.correct}/${f.total}</b> (${Math.round(f.correct / f.total * 100)} %).</p>` : '<p>Sesión registrada en tu progreso.</p>'}
        ${f.total && f.correct / f.total >= 0.8 && s.level < 5 ? `<p class="feedback ok">Buen resultado. Prueba el nivel ${LV[s.level + 1]} cuando aciertes así de forma constante.</p>` : ''}
        ${f.total && f.correct / f.total < 0.5 && s.level > 0 ? `<p class="feedback ko">Te ha costado. Repasa las explicaciones o practica un rato en ${LV[s.level - 1]}.</p>` : ''}
        <div class="row"><button class="btn primary" data-action="prac-again">Otra sesión</button><a class="btn" href="#inicio">Volver a hoy</a></div></section>`;
    }
    const k = s.skill;
    if (k === 'grammar' || k === 'vocabulary') return quizSession(s);
    if (k === 'reading' || k === 'listening') return comprehensionSession(s);
    if (k === 'writing') return writingSession(s);
    return s.mode === 'talk' ? talkSession(s) : shadowSession(s);
  }
  function quizSession(s) {
    const q = s.items[s.idx], n = s.items.length, a = s.answered;
    return `<section class="panel"><div class="stack-sm"><div class="row between small"><span class="muted">Pregunta ${s.idx + 1} de ${n}</span><span class="mono">${s.correct} aciertos</span></div>
      <div class="progressbar"><span style="width:${s.idx / n * 100}%"></span></div></div>
      <p class="q-text" lang="en" style="font-size:1.15rem">${esc(q.q)}</p>
      <div class="opts" lang="en">${q.options.map((o, j) => `<button class="opt${a !== null ? (j === q.answer ? ' correct' : j === a ? ' wrong' : '') : ''}" data-action="quiz-answer" data-o="${j}" ${a !== null ? 'disabled' : ''}>${esc(o)}</button>`).join('')}</div>
      ${a !== null ? `<div class="feedback ${a === q.answer ? 'ok' : 'ko'}"><b>${a === q.answer ? 'Correcto.' : 'Respuesta correcta: ' + esc(q.options[q.answer]) + '.'}</b> ${q.explain ? esc(q.explain) : ''}</div>
        <div class="row"><button class="btn primary" data-action="quiz-next">${s.idx + 1 < n ? 'Siguiente' : 'Terminar'}</button></div>` : ''}</section>`;
  }
  function comprehensionSession(s) {
    const isL = s.skill === 'listening';
    const src = isL ? D.listening[s.level] : D.reading[s.level];
    const ch = s.checked;
    const head = isL
      ? `${audioBox('prac-listen', `<label class="small" for="rate">Velocidad <select id="rate" data-action-change="rate">${[0.7, 0.8, 0.9, 1, 1.1, 1.2].map(r => `<option value="${r}"${Math.abs(r - s.rate) < 0.01 ? ' selected' : ''}>${r}×</option>`).join('')}</select></label>`)}
         ${!TTS || ch ? `<details${ch ? ' open' : ''}><summary>Transcripción</summary><div class="passage" lang="en">${esc(src.script)}</div></details>` : ''}`
      : `<div class="passage" lang="en">${esc(src.text)}</div>`;
    return `<form class="panel" data-form="comp"><h2 lang="en">${esc(src.title)}</h2>${head}
      <div class="stack" lang="en">${src.questions.map((q, i) => mcQuestion(q, 'cq', i)).join('')}</div>
      <p class="small muted" id="comp-msg"></p>
      <div class="row">${ch ? `<span><b class="mono">${ch.correct}/${src.questions.length}</b> correctas</span><button type="button" class="btn primary" data-action="comp-save">Guardar sesión</button>` : '<button class="btn primary" type="submit">Comprobar</button>'}</div></form>`;
  }
  function writingSession(s) {
    return `<form class="panel" data-form="write"><h2>Consigna</h2><div class="passage" lang="en">${esc(s.prompt)}</div>
      <label class="field" for="w-text">Tu texto</label>
      <textarea id="w-text" lang="en" spellcheck="false" placeholder="Write here…">${esc(s.text || '')}</textarea>
      <p class="small muted"><span class="mono" id="wc">${s.text ? (s.text.match(/[A-Za-z']+/g) || []).length : 0}</span> palabras</p>
      <div class="row"><button class="btn primary" type="submit">Analizar</button>${s.analysis ? '<button type="button" class="btn" data-action="write-save">Guardar sesión</button>' : ''}</div>
      ${s.analysis ? `<div class="stack">${renderAnalysis(s.analysis)}</div>` : ''}</form>`;
  }
  function shadowSession(s) {
    const sents = D.shadowing[s.level];
    return `<section class="panel"><h2>Shadowing</h2>
      <p class="small muted">Escucha cada frase y repítela en voz alta imitando ritmo y entonación. ${SR ? 'Pulsa «Repetir» para que el navegador compare lo que dices.' : 'Tu navegador no reconoce voz: valora tú mismo cómo te ha salido.'}</p>
      <ul class="clean">${sents.map((t, i) => {
        const sc = s.scores[i];
        return `<li class="stack-sm" style="padding:0.75rem 0;border-top:1px solid var(--line)">
          <p lang="en"><b>${esc(t)}</b></p>
          <div class="row"><button class="btn small" data-action="say" data-i="${i}">▶ Escuchar</button><button class="btn small" data-action="say-slow" data-i="${i}">Lento</button>
          ${SR ? `<button class="btn small" data-action="rec" data-i="${i}">● Repetir</button>` : ''}
          <span class="chips">${['Bien', 'Regular', 'Repetir'].map((l, j) => `<button class="chip" data-action="self-rate" data-i="${i}" data-v="${2 - j}" aria-pressed="${sc && sc.self === 2 - j}">${l}</button>`).join('')}</span></div>
          ${sc && sc.heard != null ? `<p class="feedback ${sc.match >= 0.8 ? 'ok' : 'ko'} small">Te he entendido: «${esc(sc.heard)}» · coincidencia ${Math.round(sc.match * 100)} %</p>` : ''}
          ${sc && sc.err ? `<p class="feedback ko small">${esc(sc.err)}</p>` : ''}</li>`;
      }).join('')}</ul>
      <div class="row"><button class="btn primary" data-action="shadow-save">Guardar sesión</button></div></section>`;
  }
  function talkSession(s) {
    const left = s.left == null ? s.secs : s.left;
    const checks = ['He hablado todo el tiempo sin parar más de 3 segundos.', 'He usado al menos 3 conectores (because, however, although…).', 'He dado ejemplos concretos.', 'He usado vocabulario nuevo de esta semana.', 'Me he corregido a mí mismo cuando me he equivocado.'];
    return `<section class="panel"><h2>Charla cronometrada</h2><div class="passage" lang="en">${esc(s.prompt)}</div>
      <p class="small muted">Piensa 30 segundos, pulsa «Empezar» y habla en voz alta hasta que acabe el tiempo. Si puedes, grábate con el móvil para escucharte después.</p>
      <div class="row"><span class="timer" id="timer">${Math.floor(left / 60)}:${pad(left % 60)}</span>
        <button class="btn primary" data-action="talk-timer">${s.running ? 'Parar' : s.left === 0 ? 'Otra vez' : 'Empezar'}</button></div>
      <div class="stack-sm"><b>Autoevaluación</b>${checks.map((c, i) => `<label class="check"><input type="checkbox" id="tk-${i}" name="tk"><span>${c}</span></label>`).join('')}</div>
      <div class="row"><button class="btn primary" data-action="talk-save">Guardar sesión</button></div></section>`;
  }
  function wordMatch(target, heard) {
    const norm = x => x.toLowerCase().replace(/[^a-z' ]/g, ' ').split(/\s+/).filter(Boolean);
    const t = norm(target), h = norm(heard);
    const bag = {}; h.forEach(w => { bag[w] = (bag[w] || 0) + 1; });
    let hit = 0; t.forEach(w => { if (bag[w]) { bag[w]--; hit++; } });
    return t.length ? hit / t.length : 0;
  }
  let talkInterval = null;

  /* =========================================================
     VISTA: Progreso
     ========================================================= */
  function viewProgress() {
    const log = state.log;
    const ws = dateKey(weekStart());
    const weekSessions = log.filter(l => l.date >= ws).length;
    const scored = log.filter(l => l.total);
    const acc = scored.length ? Math.round(scored.reduce((a, l) => a + l.correct, 0) / scored.reduce((a, l) => a + l.total, 0) * 100) : null;
    const totalMin = log.reduce((a, l) => a + (l.minutes || 0), 0);
    const bySkill = SKILLS.map(s => {
      const ls = log.filter(l => l.skill === s.id);
      const sc = ls.filter(l => l.total);
      return { s, n: ls.length, min: ls.reduce((a, l) => a + (l.minutes || 0), 0), acc: sc.length ? sc.reduce((a, l) => a + l.correct, 0) / sc.reduce((a, l) => a + l.total, 0) : null };
    });
    const maxMin = Math.max(1, ...bySkill.map(b => b.min));
    return `${exampleBanner()}<section class="stack"><p class="eyebrow">Progreso</p><h1>Tu constancia y tus resultados</h1></section>
      <section class="metrics">
        <div class="metric"><b>${streak()}</b><span>días seguidos</span></div>
        <div class="metric"><b>${weekMinutes()}</b><span>minutos esta semana${state.plan ? ' de ' + state.plan.minutes * state.plan.days : ''}</span></div>
        <div class="metric"><b>${weekSessions}</b><span>sesiones esta semana</span></div>
        <div class="metric"><b>${acc == null ? '—' : acc + ' %'}</b><span>aciertos totales</span></div>
        <div class="metric"><b>${Math.round(totalMin / 6) / 10}</b><span>horas acumuladas${state.plan ? ' de ~' + state.plan.hours : ''}</span></div>
      </section>
      <section class="grid-2">
        <div class="panel"><h2>Tiempo por destreza</h2><div class="bars">${bySkill.map(b => `<div class="bar-row"><span>${b.s.name}</span><div class="bar"><span style="width:${Math.round(b.min / maxMin * 100)}%"></span></div><span class="mono">${b.min}′</span></div>`).join('')}</div></div>
        <div class="panel"><h2>Aciertos por destreza</h2><div class="bars">${bySkill.filter(b => MC_SKILLS.includes(b.s.id)).map(b => `<div class="bar-row"><span>${b.s.name}</span><div class="bar"><span style="width:${b.acc == null ? 0 : Math.round(b.acc * 100)}%;background:${b.acc == null ? 'transparent' : b.acc >= 0.7 ? 'var(--good)' : b.acc >= 0.5 ? 'var(--gold)' : 'var(--bad)'}"></span></div><span class="mono">${b.acc == null ? '—' : Math.round(b.acc * 100) + ' %'}</span></div>`).join('')}</div>
          <p class="small muted">Verde: 70 % o más, listo para subir de nivel en esa destreza.</p></div>
      </section>
      <section class="panel"><h2>Historial de diagnósticos</h2>${state.history.length ? `<div class="table-wrap"><table><thead><tr><th>Fecha</th><th>Global</th>${SKILLS.map(s => `<th>${s.name}</th>`).join('')}</tr></thead>
        <tbody>${state.history.slice().reverse().map(h => `<tr><td>${fmtDate(h.date)}</td><td>${lvl(h.overall)}</td>${SKILLS.map(s => `<td>${lvl(h.levels[s.id])}</td>`).join('')}</tr>`).join('')}</tbody></table></div>` : '<p class="muted">Aún no has hecho ningún diagnóstico. <a href="#diagnostico">Hazlo ahora</a>.</p>'}</section>
      <section class="panel"><h2>Últimas sesiones</h2>${log.length ? `<div class="table-wrap"><table><thead><tr><th>Fecha</th><th>Destreza</th><th>Nivel</th><th>Resultado</th><th>Minutos</th></tr></thead>
        <tbody>${log.slice(-12).reverse().map(l => `<tr><td>${fmtDate(l.date)}</td><td>${SK[l.skill].name}</td><td>${lvl(l.level)}</td><td class="num">${l.total ? `${l.correct}/${l.total}` : '—'}</td><td class="num">${l.minutes}</td></tr>`).join('')}</tbody></table></div>` : '<p class="muted">Cuando practiques, tus sesiones aparecerán aquí.</p>'}</section>
      <section class="panel"><h2>Datos</h2><p class="small muted">Tu progreso se guarda solo en este navegador.</p>
        ${resetConfirm ? '<div class="banner warn"><span>¿Borrar diagnósticos, plan y sesiones? No se puede deshacer.</span><div class="row"><button class="btn small danger" data-action="reset-yes">Sí, borrar todo</button><button class="btn small" data-action="reset-no">Cancelar</button></div></div>' : '<div class="row"><button class="btn danger" data-action="reset">Borrar todos mis datos</button></div>'}</section>`;
  }
  let resetConfirm = false;

  /* ---------- Perfil de ejemplo ---------- */
  function loadExample() {
    const levels = { reading: 2, listening: 1, grammar: 2, vocabulary: 2, writing: 1, speaking: 1 };
    const d0 = addDays(new Date(), -27);
    state = fresh();
    state.example = true;
    state.history.push({ date: dateKey(d0), levels: { reading: 1, listening: 1, grammar: 1, vocabulary: 2, writing: 1, speaking: 0 }, overall: 1 });
    state.profile = { date: dateKey(addDays(new Date(), -1)), levels, overall: overallLevel(levels) };
    state.history.push(state.profile);
    state.plan = buildPlan(levels, 30, 5);
    const sample = [['listening', 2, 2, 3, 14], ['grammar', 2, 4, 5, 12], ['speaking', 2, 0, 0, 15], ['reading', 3, 2, 3, 15], ['writing', 2, 0, 0, 16], ['vocabulary', 2, 3, 5, 10], ['listening', 2, 3, 3, 15]];
    sample.forEach((x, i) => state.log.push({ date: dateKey(addDays(new Date(), -(sample.length - i))), skill: x[0], level: x[1], correct: x[2], total: x[3], minutes: x[4] }));
    save();
  }

  /* =========================================================
     Enrutado y eventos
     ========================================================= */
  const VIEWS = { inicio: viewHome, diagnostico: viewDiag, plan: viewPlan, practica: viewPractice, progreso: viewProgress };
  function route() { const h = location.hash.replace('#', ''); return VIEWS[h] ? h : 'inicio'; }
  function render() {
    const r = route();
    document.querySelectorAll('[data-nav]').forEach(a => { if (a.dataset.nav === r) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    app.innerHTML = VIEWS[r]();
  }
  window.addEventListener('hashchange', () => { stopSpeech(); resetConfirm = false; render(); window.scrollTo(0, 0); });

  const actions = {
    'load-example': () => { loadExample(); location.hash = '#inicio'; render(); },
    'clear-example': () => { state = fresh(); save(); render(); },
    'diag-start': () => { diagStart(); render(); },
    'diag-reset': () => { diag = null; render(); },
    'toggle-task': el => {
      const k = todayKey(), i = Number(el.dataset.i);
      const done = state.done[k] || (state.done[k] = []);
      const at = done.indexOf(i);
      if (at >= 0) done.splice(at, 1); else done.push(i);
      save(); render();
    },
    'goto-practice': el => { prac = { skill: el.dataset.skill, level: null, session: null }; },
    regen: () => { const p = state.plan; state.plan = buildPlan(state.profile.levels, p.minutes, p.days); save(); render(); },
    play: el => {
      const id = el.dataset.id;
      if (id === 'diag-listen') {
        if (diag.mc.plays >= 2) return;
        diag.mc.plays++;
        const pl = document.getElementById('plays-left'); if (pl) pl.textContent = 2 - diag.mc.plays;
        if (diag.mc.plays >= 2) el.disabled = true;
        const l = D.listening[diag.mc.level];
        setWave(true); speak(l.script, l.rate, () => setWave(false));
      } else {
        const s = prac.session; setWave(true);
        speak(D.listening[s.level].script, s.rate, () => setWave(false));
      }
    },
    'prac-skill': el => { stopSpeech(); prac = { skill: el.dataset.skill, level: null, session: null }; render(); },
    'prac-level': el => { stopSpeech(); prac.level = Number(el.dataset.level); prac.session = null; render(); },
    'prac-start': el => { startPractice(el.dataset.mode); render(); },
    'prac-again': () => { const m = prac.session && prac.session.mode; startPractice(m); render(); },
    'quiz-answer': el => {
      const s = prac.session; if (s.answered !== null) return;
      s.answered = Number(el.dataset.o);
      if (s.answered === s.items[s.idx].answer) s.correct++;
      render();
    },
    'quiz-next': () => {
      const s = prac.session;
      if (s.idx + 1 < s.items.length) { s.idx++; s.answered = null; } else finishPractice(s.correct, s.items.length);
      render();
    },
    'comp-save': () => { const s = prac.session; finishPractice(s.checked.correct, s.checked.total); render(); },
    'write-save': () => { finishPractice(0, 0); render(); },
    say: el => speak(D.shadowing[prac.session.level][el.dataset.i], 0.95),
    'say-slow': el => speak(D.shadowing[prac.session.level][el.dataset.i], 0.7),
    'self-rate': el => { const s = prac.session, i = el.dataset.i; s.scores[i] = Object.assign(s.scores[i] || {}, { self: Number(el.dataset.v) }); render(); },
    rec: el => {
      const s = prac.session, i = el.dataset.i, target = D.shadowing[s.level][i];
      stopSpeech();
      let r;
      try { r = new SR(); } catch (e) { s.scores[i] = { err: 'No se pudo iniciar el reconocimiento de voz.' }; render(); return; }
      r.lang = 'en-US'; r.interimResults = false; r.maxAlternatives = 1;
      el.textContent = '● Escuchando…'; el.disabled = true;
      r.onresult = e => { const heard = e.results[0][0].transcript; s.scores[i] = Object.assign(s.scores[i] || {}, { heard, match: wordMatch(target, heard), err: null }); };
      r.onerror = e => { s.scores[i] = Object.assign(s.scores[i] || {}, { err: e.error === 'not-allowed' ? 'No hay permiso para usar el micrófono. Valora tú mismo cómo te ha salido.' : 'No te he oído bien. Inténtalo de nuevo más cerca del micrófono.' }); };
      r.onend = () => render();
      r.start();
    },
    'shadow-save': () => {
      const s = prac.session, n = D.shadowing[s.level].length;
      let correct = 0, total = 0;
      for (let i = 0; i < n; i++) { const sc = s.scores[i]; if (!sc) continue; if (sc.match != null) { total++; if (sc.match >= 0.8) correct++; } else if (sc.self != null) { total++; if (sc.self === 2) correct++; } }
      finishPractice(correct, total); render();
    },
    'talk-timer': () => {
      const s = prac.session;
      if (s.running) { clearInterval(talkInterval); s.running = false; render(); return; }
      if (s.left == null || s.left === 0) s.left = s.secs;
      s.running = true; render();
      talkInterval = setInterval(() => {
        if (!prac.session || prac.session !== s) { clearInterval(talkInterval); return; }
        s.left--;
        const t = document.getElementById('timer'); if (t) t.textContent = `${Math.floor(s.left / 60)}:${pad(s.left % 60)}`;
        if (s.left <= 0) { clearInterval(talkInterval); s.running = false; render(); }
      }, 1000);
    },
    'talk-save': () => { clearInterval(talkInterval); const n = document.querySelectorAll('input[name="tk"]:checked').length; finishPractice(n, 5); render(); },
    reset: () => { resetConfirm = true; render(); },
    'reset-no': () => { resetConfirm = false; render(); },
    'reset-yes': () => { state = fresh(); save(); diag = null; prac = { skill: 'reading', level: null, session: null }; resetConfirm = false; render(); }
  };

  document.addEventListener('click', e => {
    const el = e.target.closest('[data-action]');
    if (!el || el.tagName === 'INPUT' && el.type === 'checkbox' && el.dataset.action !== 'toggle-task') return;
    const fn = actions[el.dataset.action];
    if (fn) fn(el, e);
  });
  document.addEventListener('change', e => {
    if (e.target.dataset.actionChange === 'rate' && prac.session) prac.session.rate = Number(e.target.value);
  });
  document.addEventListener('input', e => {
    if (e.target.tagName === 'TEXTAREA') {
      const wc = document.getElementById('wc'); if (wc) wc.textContent = (e.target.value.match(/[A-Za-z']+/g) || []).length;
      if (prac.session && e.target.id === 'w-text') prac.session.text = e.target.value;
    }
  });
  document.addEventListener('submit', e => {
    e.preventDefault();
    const f = e.target, kind = f.dataset.form;
    if (kind === 'diag-mc') submitDiagMC(f);
    else if (kind === 'diag-cando') submitDiagCando(f);
    else if (kind === 'plan') {
      const minutes = Number(f.minutes.value), days = Number(f.days.value);
      state.plan = buildPlan(state.profile.levels, minutes, days); save(); render(); window.scrollTo(0, 0);
    } else if (kind === 'comp') {
      const s = prac.session, src = s.skill === 'listening' ? D.listening[s.level] : D.reading[s.level];
      const ans = collect(f, 'cq', src.questions.length);
      if (ans.includes(null)) { f.querySelector('#comp-msg').textContent = 'Responde todas las preguntas antes de comprobar.'; return; }
      stopSpeech();
      s.checked = { correct: ans.filter((a, i) => a === src.questions[i].answer).length, total: src.questions.length, ans };
      render();
      const form = app.querySelector('form[data-form="comp"]');
      ans.forEach((a, i) => {
        form.querySelectorAll(`input[name="cq${i}"]`).forEach(inp => { inp.disabled = true; if (Number(inp.value) === a) inp.checked = true; });
        form.querySelectorAll(`.opt[data-q="${i}"]`).forEach(o => {
          const j = Number(o.dataset.o);
          if (j === src.questions[i].answer) o.classList.add('correct'); else if (j === a) o.classList.add('wrong');
        });
      });
    } else if (kind === 'write') {
      const s = prac.session; s.text = f.querySelector('#w-text').value;
      s.analysis = analyzeText(s.text); render();
    }
  });

  // Expuesto para pruebas.
  window.EC = { analyzeText, buildPlan, overallLevel, canDoLevel, wordMatch };
  render();
})();
