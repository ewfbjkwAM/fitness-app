// Timer engine: full-screen sequences (routines, circuits, holds) and a
// small rest bar for lifting. Keeps the screen awake while running and shows
// a phone notification with controls (see media.js).
import { mediaStart, mediaUpdate, mediaStop, mediaPlayState } from './media.js';

let ac = null;
export function beep(freq = 880, dur = 0.12, vol = 0.3) {
  try {
    if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)();
    if (ac.state === 'suspended') ac.resume();
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.connect(g); g.connect(ac.destination);
    o.type = 'sine'; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
    o.start(); o.stop(ac.currentTime + dur);
  } catch (e) { /* audio unavailable */ }
}
export const buzz = (p) => { try { navigator.vibrate && navigator.vibrate(p); } catch (e) {} };
export function unlockAudio() { beep(440, 0.01, 0.001); }

// ---------- wake lock ----------
let lock = null;
let wantLock = 0;
async function acquire() {
  try { if ('wakeLock' in navigator && !lock) { lock = await navigator.wakeLock.request('screen'); lock.addEventListener('release', () => { lock = null; }); } } catch (e) { lock = null; }
}
function holdAwake() { wantLock++; acquire(); }
function letSleep() { wantLock = Math.max(0, wantLock - 1); if (!wantLock && lock) { lock.release().catch(() => {}); lock = null; } }
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && wantLock) acquire(); });

export const fmt = (s) => { s = Math.max(0, Math.ceil(s)); const m = Math.floor(s / 60); const x = s % 60; return m ? `${m}:${String(x).padStart(2, '0')}` : String(x); };

// ---------- full-screen sequence ----------
// phases: [{label, sub, secs, kind:'prep'|'work'|'rest'|'switch'|'hold'}]
let seq = null;

export function runSequence(phases, { title = '', onDone, onEnd } = {}) {
  if (!phases.length) return;
  stopSequence(true);
  unlockAudio();
  holdAwake();
  const el = document.createElement('div');
  el.className = 'seq';
  el.innerHTML = `
    <div class="seq-top"><span class="seq-title"></span><span class="seq-count"></span></div>
    <div class="seq-phase"></div>
    <div class="seq-main">
      <div class="seq-label"></div>
      <div class="seq-time"></div>
      <div class="seq-sub"></div>
    </div>
    <div class="seq-next"></div>
    <div class="seq-bar"><div class="seq-fill"></div></div>
    <div class="seq-ctrls">
      <button class="sbtn" data-a="back" aria-label="Previous">‹</button>
      <button class="sbtn wide" data-a="pause">Pause</button>
      <button class="sbtn" data-a="skip" aria-label="Next">›</button>
    </div>
    <button class="seq-end" data-a="end">End</button>`;
  document.body.appendChild(el);
  document.body.classList.add('noscroll');

  seq = { phases, i: 0, left: phases[0].secs, paused: false, el, last: performance.now(), onDone, onEnd, title };
  el.querySelector('.seq-title').textContent = title;
  el.addEventListener('click', (e) => {
    const a = e.target.closest('[data-a]')?.dataset.a;
    if (!a || !seq) return;
    if (seq.finished && a !== 'end') return;
    if (a === 'pause') setPaused(!seq.paused);
    if (a === 'skip') next(true);
    if (a === 'back') back();
    if (a === 'end') stopSequence(false);
  });
  mediaStart('seq', {
    play: () => setPaused(false),
    pause: () => setPaused(true),
    next: () => seq && !seq.finished && next(true),
    prev: () => seq && !seq.finished && back(),
    stop: () => stopSequence(false),
  });
  enter();
  seq.tick = setInterval(tick, 200);
}

function setPaused(v) {
  if (!seq || seq.finished) return;
  seq.paused = v; seq.last = performance.now();
  mediaPlayState('seq', !v);
  draw();
}
function back() { seq.i = Math.max(0, seq.i - 1); enter(); }

function enter() {
  const p = seq.phases[seq.i];
  seq.left = p.secs;
  seq.lastWhole = Math.ceil(p.secs);
  seq.el.dataset.kind = p.kind || 'work';
  draw();
}

function tick() {
  if (!seq || seq.finished) return;
  if (seq.paused) { seq.last = performance.now(); return; }
  const now = performance.now();
  seq.left -= (now - seq.last) / 1000;
  seq.last = now;
  if (seq.left <= 0) {
    // Catch up in one jump: skip every phase that ended while the phone was
    // busy elsewhere, instead of stepping (and beeping) through each one.
    let over = -seq.left;
    let i = seq.i + 1;
    while (i < seq.phases.length && over >= seq.phases[i].secs) { over -= seq.phases[i].secs; i++; }
    if (i >= seq.phases.length) { seq.i = seq.phases.length - 1; next(false); return; }
    seq.i = i - 1;
    next(false);
    seq.left = seq.phases[seq.i].secs - over;
    seq.lastWhole = Math.ceil(seq.left);
    draw();
    return;
  }
  const whole = Math.ceil(seq.left);
  if (whole !== seq.lastWhole) {
    seq.lastWhole = whole;
    if (whole <= 3 && whole > 0) { beep(880, 0.08, 0.25); buzz(40); }
  }
  draw();
}

function next(manual) {
  seq.i++;
  if (seq.i >= seq.phases.length) {
    beep(523, 0.15); setTimeout(() => beep(659, 0.15), 160); setTimeout(() => beep(784, 0.35), 320);
    buzz([120, 80, 120, 80, 250]);
    const done = seq.onDone;
    finishScreen();
    done && done();
    return;
  }
  const p = seq.phases[seq.i];
  if (!manual) {
    if (p.kind === 'work' || p.kind === 'hold') { beep(1046, 0.25, 0.4); buzz(200); }
    else if (p.kind === 'switch') { beep(660, 0.15, 0.35); setTimeout(() => beep(660, 0.15, 0.35), 200); buzz([100, 60, 100]); }
    else { beep(440, 0.2, 0.3); buzz(120); }
  }
  enter();
}

function draw() {
  const s = seq; const p = s.phases[s.i]; const el = s.el;
  el.querySelector('.seq-count').textContent = `${s.i + 1} / ${s.phases.length}`;
  el.querySelector('.seq-phase').textContent = { prep: 'Get ready', work: 'Work', rest: 'Rest', switch: 'Switch sides', hold: 'Hold', stretch: 'Stretch' }[p.kind || 'work'] || '';
  el.querySelector('.seq-label').textContent = p.label || '';
  el.querySelector('.seq-time').textContent = fmt(s.left);
  el.querySelector('.seq-sub').textContent = p.sub || '';
  const n = s.phases[s.i + 1];
  el.querySelector('.seq-next').textContent = n ? `Next: ${n.label || n.kind} · ${fmt(n.secs)}` : 'Last one';
  el.querySelector('.seq-fill').style.width = `${Math.max(0, (s.left / p.secs) * 100)}%`;
  el.querySelector('[data-a="pause"]').textContent = s.paused ? 'Resume' : 'Pause';
  el.classList.toggle('paused', s.paused);
  const kindName = { prep: 'Get ready', work: 'Work', rest: 'Rest', switch: 'Switch sides', hold: 'Hold', stretch: 'Stretch' }[p.kind || 'work'];
  mediaUpdate('seq', {
    title: `${fmt(s.left)} · ${p.label || kindName}`,
    artist: [kindName, p.sub].filter(Boolean).join(' · '),
    album: s.title || 'Fitness Plan',
    duration: p.secs,
    position: p.secs - s.left,
    playing: !s.paused,
  });
}

function finishScreen() {
  clearInterval(seq.tick);
  const el = seq.el;
  el.dataset.kind = 'done';
  el.querySelector('.seq-phase').textContent = 'Done';
  el.querySelector('.seq-label').textContent = 'Nice work';
  el.querySelector('.seq-time').textContent = '✓';
  el.querySelector('.seq-sub').textContent = '';
  el.querySelector('.seq-next').textContent = '';
  el.querySelector('.seq-fill').style.width = '0%';
  el.querySelector('.seq-ctrls').innerHTML = '<button class="sbtn wide" data-a="end">Close</button>';
  seq.finished = true;
  mediaStop('seq');
  letSleep();
}

export function stopSequence(silent) {
  if (!seq) return;
  clearInterval(seq.tick);
  if (!seq.finished) letSleep();
  mediaStop('seq');
  const end = seq.onEnd;
  seq.el.remove();
  document.body.classList.remove('noscroll');
  seq = null;
  if (!silent && end) end();
}

// ---------- rest bar (between lifting sets) ----------
let rest = null;
export function startRest(secs, label = 'Rest') {
  stopRest();
  unlockAudio();
  holdAwake();
  const el = document.createElement('div');
  el.className = 'restbar';
  el.innerHTML = `<div class="rb-fill"></div><div class="rb-row"><div><div class="rb-label"></div><div class="rb-time"></div></div>
    <div class="rb-btns"><button data-r="-15">−15</button><button data-r="15">+15</button><button data-r="skip">Skip</button></div></div>`;
  document.body.appendChild(el);
  rest = { total: secs, end: performance.now() + secs * 1000, el, lastWhole: secs, label };
  mediaStart('rest', {
    pause: () => { if (rest && !rest.paused) { rest.paused = true; rest.pausedLeft = (rest.end - performance.now()) / 1000; drawRest(); } },
    play: () => { if (rest && rest.paused) { rest.paused = false; rest.end = performance.now() + rest.pausedLeft * 1000; mediaPlayState('rest', true); drawRest(); } },
    next: () => stopRest(),
    stop: () => stopRest(),
    forward: () => adjustRest(15),
    back: () => adjustRest(-15),
  });
  el.querySelector('.rb-label').textContent = label;
  el.addEventListener('click', (e) => {
    const r = e.target.closest('[data-r]')?.dataset.r; if (!r) return;
    if (r === 'skip') return stopRest();
    adjustRest(Number(r));
  });
  drawRest();
  rest.t = setInterval(drawRest, 250);
}

function adjustRest(d) {
  if (!rest) return;
  if (rest.paused) rest.pausedLeft = Math.max(1, rest.pausedLeft + d); else rest.end += d * 1000;
  rest.total = Math.max(5, rest.total + d);
  drawRest();
}

function drawRest() {
  if (!rest) return;
  const left = rest.paused ? rest.pausedLeft : (rest.end - performance.now()) / 1000;
  const whole = Math.ceil(left);
  if (!rest.paused && whole !== rest.lastWhole) { rest.lastWhole = whole; if (whole <= 3 && whole > 0) { beep(880, 0.08, 0.25); buzz(40); } }
  if (left <= 0) { beep(1046, 0.3, 0.4); buzz([200, 80, 200]); stopRest(); return; }
  rest.el.querySelector('.rb-time').textContent = rest.paused ? `${fmt(left)} · paused` : fmt(left);
  rest.el.querySelector('.rb-fill').style.width = `${(left / rest.total) * 100}%`;
  mediaUpdate('rest', { title: `${fmt(left)} · Rest`, artist: rest.label, album: 'Fitness Plan', duration: rest.total, position: rest.total - left, playing: !rest.paused });
}

export function stopRest() {
  if (!rest) return;
  clearInterval(rest.t);
  rest.el.remove();
  rest = null;
  mediaStop('rest');
  letSleep();
}

// ---------- builders ----------
export function routinePhases(routine) {
  const out = [{ label: routine.steps[0].name, sub: 'Get into position', secs: 8, kind: 'prep' }];
  const tr = routine.transition ?? 10;
  routine.steps.forEach((s, i) => {
    if (s.sides) {
      out.push({ label: s.name, sub: `Left side${s.cue ? ' · ' + s.cue : ''}`, secs: s.secs, kind: 'stretch' });
      out.push({ label: s.name, sub: 'Switch to the right side', secs: 5, kind: 'switch' });
      out.push({ label: s.name, sub: `Right side${s.cue ? ' · ' + s.cue : ''}`, secs: s.secs, kind: 'stretch' });
    } else {
      out.push({ label: s.name, sub: s.cue || '', secs: s.secs, kind: 'stretch' });
    }
    const n = routine.steps[i + 1];
    if (n && tr) out.push({ label: n.name, sub: 'Next position', secs: tr, kind: 'rest' });
  });
  return out;
}

export function circuitPhases(c) {
  const out = [];
  if (c.prep) out.push({ label: c.exercises[0], sub: 'Get ready', secs: c.prep, kind: 'prep' });
  for (let r = 1; r <= c.rounds; r++) {
    c.exercises.forEach((ex, i) => {
      out.push({ label: ex, sub: `Round ${r} of ${c.rounds}`, secs: c.work, kind: 'work' });
      const last = i === c.exercises.length - 1;
      if (!last && c.rest) out.push({ label: c.exercises[i + 1], sub: 'Rest · next up', secs: c.rest, kind: 'rest' });
    });
    if (r < c.rounds && c.roundRest) out.push({ label: c.exercises[0], sub: `Round ${r + 1} next`, secs: c.roundRest, kind: 'rest' });
  }
  return out;
}

export function intervalPhases(C) {
  const out = [];
  if (C.prep > 0) out.push({ label: 'Get ready', secs: C.prep, kind: 'prep' });
  for (let st = 1; st <= C.sets; st++) {
    for (let r = 1; r <= C.rounds; r++) {
      const sub = `Round ${r} of ${C.rounds}${C.sets > 1 ? ` · Set ${st} of ${C.sets}` : ''}`;
      out.push({ label: 'Work', sub, secs: C.work, kind: 'work' });
      if (C.rest > 0 && !(r === C.rounds && st === C.sets)) out.push({ label: 'Rest', sub, secs: C.rest, kind: 'rest' });
    }
    if (st < C.sets && C.setrest > 0) out.push({ label: 'Set break', secs: C.setrest, kind: 'rest' });
  }
  return out;
}
