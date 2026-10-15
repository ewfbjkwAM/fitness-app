import {
  SESSIONS, ROUTINES, CIRCUITS, ACTIVITIES, DAY_NAMES, DAY_LONG, DROP_ORDER, SKIN_AM, SKIN_PM,
  DAILY_TICKS, WEEKLY_TICKS, FOOD_PRESETS, SOCIAL_RULES, MEAL_OPTIONS, SHOPPING, TIMER_PRESETS, TARGETS,
} from './data.js';
import {
  S, save, replaceAll, exportJSON, ymd, parse, addDays, dayIdx, mondayOf, today, daysBetween,
  planWeek, week, day, foodFor,
} from './store.js';
import { buildWeek, nightType } from './schedule.js';
import { runSequence, startRest, stopRest, routinePhases, circuitPhases, intervalPhases, fmt } from './timer.js';

const $app = document.getElementById('app');
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const niceDate = (d) => `${DAY_LONG[dayIdx(d)]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
const shortDate = (s) => { const d = parse(s); return `${d.getDate()} ${MONTHS[d.getMonth()]}`; };
const restTxt = (s) => (s >= 60 ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : `${s}s`);

let view = {};          // per-render scratch
let logTab = 'food';
let foodDate = ymd(today());
let moreTab = null;

// ---------- toast & sheet ----------
function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast'; t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.classList.add('show'), 10);
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 2200);
}
function sheet(html, onClick) {
  closeSheet();
  const wrap = document.createElement('div');
  wrap.className = 'sheet-wrap';
  wrap.innerHTML = `<div class="sheet" role="dialog"><div class="sheet-grip"></div>${html}</div>`;
  wrap.addEventListener('click', (e) => {
    if (e.target === wrap) return closeSheet();
    onClick && onClick(e, wrap);
  });
  document.body.appendChild(wrap);
  requestAnimationFrame(() => wrap.classList.add('open'));
  return wrap;
}
function closeSheet() { document.querySelectorAll('.sheet-wrap').forEach((w) => w.remove()); }

// ---------- schedule helpers ----------
const doneKey = (d, key) => `${d}:${key}`;
function isDone(mon, d, key) { return !!week(mon).done[doneKey(d, key)]; }
function setDone(mon, d, key, v) { const w = week(mon); if (v) w.done[doneKey(d, key)] = true; else delete w.done[doneKey(d, key)]; save(); }
function markTodayDone(match) {
  const t = today(); const mon = ymd(mondayOf(t)); const W = buildWeek(mon); const d = dayIdx(t);
  const item = W.days[d].find((x) => match(x.key, ACTIVITIES[x.key]));
  if (item) setDone(mon, d, item.key, true);
}

function catClass(key) {
  return { gluteA: 'c-glute', gluteB: 'c-glute', upper: 'c-upper', boulder: 'c-climb', cardioMon: 'c-run', cardioSat: 'c-run', yoga: 'c-yoga', flexFull: 'c-yoga', mobility: 'c-yoga', surf: 'c-surf', rest: 'c-rest', circuit: 'c-upper' }[key] || '';
}

// ---------- TODAY ----------
function viewToday() {
  const t = today(); const tk = ymd(t); const mon = ymd(mondayOf(t)); const d = dayIdx(t);
  const wk = planWeek(t); const W = buildWeek(mon); const w = week(mon);
  const start = parse(S().settings.start);
  const untilStart = daysBetween(t, start);

  let html = `<header class="top"><div><div class="eyebrow">${wk > 0 ? `Week ${wk}` : 'Before week 1'}</div><h1>${niceDate(t)}</h1></div>
    <button class="chip tier" data-act="tier">${{ full: 'Full week', busy: 'Busy week', survival: 'Travel week' }[W.tier]} ▾</button></header>`;

  if (untilStart > 0) {
    html += prepCard(untilStart, start);
  }

  // Audit banner
  if (wk > 0 && daysBetween(start, t) < 14) {
    html += `<a class="banner" href="#/log/food">Food log · day ${daysBetween(start, t) + 1} of 14 — log everything, estimates are fine →</a>`;
  }

  html += `<section><h2>Today</h2>`;
  W.days[d].forEach((x) => { html += itemCard(x, mon, d); });
  html += `</section>`;

  if (W.notes.length) html += `<div class="notes">${W.notes.map((n) => `<p>${esc(n)}</p>`).join('')}</div>`;

  html += weekStrip(W, mon, d);
  html += skinCard(t, tk);
  html += ticksCard(t, tk, d);
  html += foodMini(tk);
  return html;
}

function prepCard(n, start) {
  const items = [
    ['yoga', 'Book Saturday Yin & Yang at Portside O\'Connor'],
    ['frem', 'Check the Fremantle Snap timetable in the Snap App'],
    ['bench', 'Check your gym has a 45° back extension bench'],
    ['kit', 'Buy nail kit, body lotion and SA cleanser'],
    ['slider', 'Buy a slider disc (Kmart) and a football for bridges'],
    ['gp', 'See your GP about an ankle scan or MRI'],
    ['shop', 'Weekly shop (list in More → Food)'],
    ['mealprep', 'First Sunday meal prep'],
    ['cal', 'Add the two skincare reminders to Google Calendar'],
  ];
  const p = S().prep;
  return `<section class="card prep"><h2>Plan starts ${DAY_LONG[dayIdx(start)]} ${start.getDate()} ${MONTHS[start.getMonth()]} · in ${n} day${n > 1 ? 's' : ''}</h2>
    <ul class="ticks">${items.map(([id, l]) => `<li><label class="tick ${p[id] ? 'on' : ''}"><input type="checkbox" data-act="prep" data-id="${id}" ${p[id] ? 'checked' : ''}><span>${esc(l)}</span></label></li>`).join('')}</ul></section>`;
}

function itemCard(x, mon, d, compact = false) {
  const a = ACTIVITIES[x.key]; if (!a) return '';
  const done = isDone(mon, d, x.key);
  const btns = [];
  if (a.session) btns.push(`<a class="btn primary" href="#/session/${a.session}">${S().active[`${a.session}|${ymd(addDays(parse(mon), d))}`] ? 'Continue' : 'Start'}</a>`);
  if (a.routine) btns.push(`<a class="btn primary" href="#/routine/${a.routine}">Start</a>`);
  if (a.circuit) btns.push(`<a class="btn primary" href="#/circuit/${a.circuit}">Start</a>`);
  if (a.pre) btns.push(`<a class="btn" href="#/routine/${a.pre}">Pre-surf</a>`);
  if (a.cooldown) btns.push(`<a class="btn" href="#/routine/${a.cooldown}">${a.key === 'surf' ? 'Post-surf' : 'Cool-down'}</a>`);
  btns.push(`<button class="btn ghost" data-act="done" data-d="${d}" data-k="${x.key}" data-mon="${mon}">${done ? 'Undo' : 'Mark done'}</button>`);
  const sess = a.session ? SESSIONS[a.session] : null;
  return `<article class="item ${catClass(x.key)} ${done ? 'done' : ''} ${x.optional ? 'optional' : ''}">
    <div class="item-head"><div>
      <div class="item-name">${esc(a.name)}${done ? ' <span class="ok">✓</span>' : ''}</div>
      <div class="item-meta">${[a.time, sess ? `${sess.minutes} min` : '', x.optional ? 'optional' : '', x.moved != null ? `moved from ${DAY_NAMES[x.moved]}` : ''].filter(Boolean).map(esc).join(' · ')}</div>
    </div></div>
    ${x.note ? `<p class="item-note">${esc(x.note)}</p>` : ''}
    ${!compact && a.detail ? `<p class="item-detail">${esc(a.detail)}</p>` : ''}
    ${compact ? '' : `<div class="btns">${btns.join('')}</div>`}
  </article>`;
}

function weekStrip(W, mon, todayD) {
  const w = week(mon);
  return `<section><div class="row-between"><h2>This week</h2><span class="hint">Tap a day to plan surf or date night</span></div>
  <div class="strip">${W.days.map((list, i) => `<button class="sday ${i === todayD ? 'today' : ''}" data-act="day" data-d="${i}" data-mon="${mon}">
    <span class="sd-name">${DAY_NAMES[i]}</span>
    ${(w.surf || []).includes(i) ? '<span class="tag surf">surf</span>' : ''}${w.dateNight === i ? '<span class="tag date">date</span>' : ''}
    ${list.map((x) => `<span class="dot ${catClass(x.key)} ${isDone(mon, i, x.key) ? 'done' : ''}" title="${esc(ACTIVITIES[x.key]?.name)}"></span>`).join('')}
    <span class="sd-items">${list.map((x) => esc(shortName(x.key))).join('<br>')}</span>
  </button>`).join('')}</div></section>`;
}
const shortName = (k) => ({ cardioMon: 'Run/soccer', gluteA: 'Glute A', gluteB: 'Glute B', upper: 'Upper', boulder: 'Boulder', yoga: 'Yoga', cardioSat: 'Cardio', flexFull: 'Flex', surf: 'Surf', rest: 'Rest', circuit: 'Circuit', mobility: 'Mobility' }[k] || k);

function daySheet(mon, d) {
  const W = buildWeek(mon); const w = week(mon); const date = addDays(parse(mon), d);
  const surf = (w.surf || []).includes(d);
  const html = `<h3>${niceDate(date)}</h3>
    <label class="switch"><input type="checkbox" data-s="surf" ${surf ? 'checked' : ''}><span>Surf this day</span></label>
    <label class="switch"><input type="checkbox" data-s="date" ${w.dateNight === d ? 'checked' : ''}><span>Date night</span></label>
    <p class="hint">${d === 2 ? 'Date night on Wednesday moves bouldering to Sunday.' : 'Date night only changes the plan on a Wednesday.'}</p>
    <div class="sheet-items">${W.days[d].map((x) => itemCard(x, mon, d, true)).join('')}</div>
    <button class="btn primary block" data-s="close">Done</button>`;
  sheet(html, (e) => {
    const s = e.target.closest('[data-s]')?.dataset.s;
    if (s === 'close') { closeSheet(); render(); return; }
    if (s === 'surf' && e.target.tagName === 'INPUT') {
      w.surf = w.surf || [];
      w.surf = e.target.checked ? [...new Set([...w.surf, d])] : w.surf.filter((x) => x !== d);
      save(); daySheet(mon, d); render(); toast(e.target.checked ? 'Surf added — sessions reshuffled' : 'Surf removed');
    }
    if (s === 'date' && e.target.tagName === 'INPUT') {
      w.dateNight = e.target.checked ? d : null; save(); daySheet(mon, d); render();
    }
  });
}

function tierSheet() {
  const mon = ymd(mondayOf(today())); const w = week(mon);
  const opts = [
    ['full', 'Full week', '6 sessions + a rest day.'],
    ['busy', 'Busy week', 'Glute A, Glute B, Upper, plus bouldering or surf.'],
    ['survival', 'Travel / survival week', '3 × 30-min circuits, daily mobility, steps.'],
  ];
  sheet(`<h3>This week's tier</h3>${opts.map(([v, n, dsc]) => `<button class="opt ${w.tier === v ? 'sel' : ''}" data-t="${v}"><b>${n}</b><span>${dsc}</span></button>`).join('')}
    <p class="hint">Back from a trip? Week 1 survival, week 2 busy, week 3 full.</p>`, (e) => {
    const v = e.target.closest('[data-t]')?.dataset.t; if (!v) return;
    w.tier = v; save(); closeSheet(); render();
  });
}

function skinCard(t, tk) {
  const dd = day(tk); const nt = nightType(t, S().settings.start); const pm = SKIN_PM[nt.type];
  return `<section class="card"><h2>Skincare</h2>
    <div class="skin">
      <button class="skin-col ${dd.skinAM ? 'on' : ''}" data-act="skin" data-w="AM"><div class="skin-h">Morning ${dd.skinAM ? '✓' : ''}</div><ol>${SKIN_AM.map((s) => `<li>${esc(s)}</li>`).join('')}</ol></button>
      <button class="skin-col ${dd.skinPM ? 'on' : ''}" data-act="skin" data-w="PM"><div class="skin-h">Tonight: ${esc(pm.label)} ${dd.skinPM ? '✓' : ''}</div><ol>${pm.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>${nt.reason ? `<div class="skin-why">${esc(nt.reason)}</div>` : ''}</button>
    </div><p class="hint">Reapply SPF every 2 hours outdoors and after every surf.</p></section>`;
}

function ticksCard(t, tk, d) {
  const dd = day(tk);
  const list = [...DAILY_TICKS, ...(WEEKLY_TICKS[d] || [])];
  return `<section class="card"><h2>Daily</h2><ul class="ticks">${list.map((x) => `<li><label class="tick ${dd.ticks[x.id] ? 'on' : ''}"><input type="checkbox" data-act="tick" data-id="${x.id}" ${dd.ticks[x.id] ? 'checked' : ''}><span>${esc(x.label)}</span></label></li>`).join('')}</ul></section>`;
}

function foodTotals(k) { return foodFor(k).reduce((a, f) => ({ kcal: a.kcal + (+f.kcal || 0), p: a.p + (+f.p || 0) }), { kcal: 0, p: 0 }); }

function foodMini(tk) {
  const tot = foodTotals(tk);
  return `<a class="card food-mini" href="#/log/food"><div><h2>Food today</h2><div class="hint">${tot.kcal ? `${tot.kcal} kcal · ${tot.p} g protein` : 'Nothing logged yet'}</div></div><span class="arrow">→</span></a>`;
}

// ---------- SESSION ----------
function lastFor(exId, beforeDate) {
  const list = S().sessions.filter((s) => s.sets[exId] && s.date < beforeDate).sort((a, b) => (a.date < b.date ? 1 : -1));
  return list[0] ? { date: list[0].date, sets: list[0].sets[exId] } : null;
}

function initDraft(id, dk) {
  const key = `${id}|${dk}`; const st = S();
  if (st.active[key]) return st.active[key];
  const sess = SESSIONS[id]; const draft = { started: Date.now(), sets: {}, sugg: {} };
  sess.exercises.forEach((ex) => {
    const last = lastFor(ex.id, dk);
    const rows = [];
    let w = '';
    if (ex.type === 'lift') {
      const lw = last ? last.sets.find((s) => s.done && s.w !== '')?.w : undefined;
      const hitTop = last && last.sets.length >= ex.sets && last.sets.every((s) => s.done && +s.r >= ex.reps[1]);
      if (lw !== undefined && lw !== null && lw !== '') {
        w = hitTop ? +lw + ex.inc : +lw;
        if (hitTop) draft.sugg[ex.id] = `+${ex.inc} kg — you hit the top of the range last time`;
      } else if (ex.start != null) w = ex.start;
    }
    for (let i = 0; i < ex.sets; i++) {
      const lr = last?.sets[i]?.r;
      // Reps start at the bottom of the range (or last time's reps) so the
      // weight only goes up once you've actually typed in the top of the range.
      rows.push({ w, r: ex.type === 'hold' ? '' : (ex.type === 'lift' ? (lr != null && lr !== '' && !draft.sugg[ex.id] ? lr : ex.reps[0]) : (lr ?? ex.reps[1])), secs: ex.type === 'hold' ? (st.holdSecs[ex.id] ?? ex.secs) : null, done: false });
    }
    draft.sets[ex.id] = rows;
  });
  st.active[key] = draft; save();
  return draft;
}

function viewSession(id) {
  const sess = SESSIONS[id]; if (!sess) return notFound();
  const dk = ymd(today()); const draft = initDraft(id, dk);
  view.session = { id, dk };
  const doneSets = Object.values(draft.sets).flat().filter((s) => s.done).length;
  const allSets = Object.values(draft.sets).flat().length;
  let html = `<header class="top sub"><a class="back" href="#/today">‹</a><div><div class="eyebrow">${esc(sess.sub)} · ~${sess.minutes} min</div><h1>${esc(sess.name)}</h1></div></header>
  <div class="progress"><div style="width:${(doneSets / allSets) * 100}%"></div></div>
  ${sess.note ? `<p class="notes"><span>${esc(sess.note)}</span></p>` : ''}
  <a class="card linkcard" href="#/routine/${sess.warmup}"><div><b>Warm-up</b><div class="hint">${esc(ROUTINES[sess.warmup].name)} · guided</div></div><span class="arrow">▶</span></a>`;
  sess.exercises.forEach((ex) => { html += exCard(ex, draft, dk); });
  html += `<a class="card linkcard" href="#/routine/${sess.cooldown}"><div><b>Cool-down</b><div class="hint">${esc(ROUTINES[sess.cooldown].name)} · guided</div></div><span class="arrow">▶</span></a>
  <button class="btn primary block big" data-act="finish">Finish session</button>
  <button class="btn ghost block" data-act="discard">Discard</button>`;
  return html;
}

function exCard(ex, draft, dk) {
  const rows = draft.sets[ex.id]; const last = lastFor(ex.id, dk);
  const lvl = S().levels[ex.id] ?? 0;
  const target = ex.type === 'hold' ? `${ex.sets} × ${ex.secs}s` : `${ex.sets} × ${ex.reps[0] === ex.reps[1] ? ex.reps[0] : `${ex.reps[0]}–${ex.reps[1]}`}${ex.each ? ' each' : ''}${ex.unit ? ` ${ex.unit}` : ''}`;
  const lastTxt = last ? `Last (${shortDate(last.date)}): ${last.sets.filter((s) => s.done).map((s) => (ex.type === 'hold' ? `${s.secs}s` : ex.type === 'lift' && s.w !== '' ? `${+s.w}×${s.r}` : s.r)).join(', ') || '—'}` : '';
  const done = rows.every((r) => r.done);
  return `<article class="ex ${done ? 'done' : ''}" id="ex-${ex.id}">
    <div class="ex-head"><div class="ex-name">${esc(ex.name)}</div><div class="ex-target">${target} · rest ${restTxt(ex.rest)}</div></div>
    ${ex.levels ? `<label class="lvl">Level <select data-act="level" data-ex="${ex.id}">${ex.levels.map((l, i) => `<option value="${i}" ${i === lvl ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></label>` : ''}
    ${draft.sugg[ex.id] ? `<div class="sugg">${esc(draft.sugg[ex.id])}</div>` : ''}
    ${ex.notes ? `<details class="ex-notes"><summary>Notes</summary>${esc(ex.notes)}</details>` : ''}
    <div class="sets">${rows.map((r, i) => setRow(ex, r, i)).join('')}</div>
    ${ex.type === 'lift' ? '<div class="last">Change the reps to what you actually did, then tick.</div>' : ''}
    ${lastTxt ? `<div class="last">${esc(lastTxt)}</div>` : ''}
  </article>`;
}

function setRow(ex, r, i) {
  const base = `data-ex="${ex.id}" data-i="${i}"`;
  let mid = '';
  if (ex.type === 'lift') {
    mid = `<input class="num" type="number" inputmode="decimal" step="0.5" placeholder="kg" value="${esc(r.w)}" data-act="w" ${base}><span class="x">kg ×</span>
      <input class="num sm" type="number" inputmode="numeric" placeholder="reps" value="${esc(r.r)}" data-act="r" ${base}>`;
  } else if (ex.type === 'reps') {
    mid = `<input class="num sm" type="number" inputmode="numeric" value="${esc(r.r)}" data-act="r" ${base}><span class="x">${ex.unit ? ex.unit : 'reps'}${ex.each ? ' each' : ''}</span>`;
  } else {
    mid = `<input class="num sm" type="number" inputmode="numeric" value="${esc(r.secs)}" data-act="secs" ${base}><span class="x">sec</span>
      <button class="btn small" data-act="hold" ${base}>▶ Hold</button>`;
  }
  return `<div class="set ${r.done ? 'on' : ''}"><span class="set-n">${i + 1}</span>${mid}<button class="check ${r.done ? 'on' : ''}" data-act="set" ${base} aria-label="Set done">✓</button></div>`;
}

function sessionAction(act, el) {
  const { id, dk } = view.session; const draft = S().active[`${id}|${dk}`]; const sess = SESSIONS[id];
  const exId = el.dataset.ex; const i = +el.dataset.i; const ex = sess.exercises.find((e) => e.id === exId);
  if (act === 'set') {
    const row = draft.sets[exId][i]; row.done = !row.done; save();
    if (row.done) {
      const lastSetOfSession = exId === sess.exercises[sess.exercises.length - 1].id && i === ex.sets - 1;
      if (!lastSetOfSession) startRest(ex.rest, i === ex.sets - 1 ? 'Rest · next exercise' : `Rest · ${ex.name}`);
    }
    rerenderEx(ex, draft);
  }
  if (act === 'hold') {
    const row = draft.sets[exId][i];
    runSequence([{ label: ex.name, sub: 'Get set', secs: 5, kind: 'prep' }, { label: ex.name, sub: `Set ${i + 1} of ${ex.sets}`, secs: +row.secs || ex.secs, kind: 'hold' }], {
      title: ex.name,
      onDone: () => { row.done = true; save(); rerenderEx(ex, draft); },
      onEnd: () => { if (row.done && i < ex.sets - 1) startRest(ex.rest, `Rest · ${ex.name}`); },
    });
  }
}

function rerenderEx(ex, draft) {
  const node = document.getElementById(`ex-${ex.id}`);
  if (node) node.outerHTML = exCard(ex, draft, view.session.dk);
  const all = Object.values(draft.sets).flat();
  const bar = document.querySelector('.progress > div');
  if (bar) bar.style.width = `${(all.filter((s) => s.done).length / all.length) * 100}%`;
}

function finishSession() {
  const { id, dk } = view.session; const key = `${id}|${dk}`; const draft = S().active[key];
  const any = Object.values(draft.sets).flat().some((s) => s.done);
  if (!any && !confirm('No sets ticked. Finish anyway?')) return;
  S().sessions = S().sessions.filter((s) => !(s.session === id && s.date === dk));
  S().sessions.push({ session: id, date: dk, sets: draft.sets, levels: { ...S().levels } });
  delete S().active[key];
  const t = today(); const mon = ymd(mondayOf(t)); const W = buildWeek(mon);
  const td = dayIdx(t);
  if (W.days[td].some((x) => x.key === id)) setDone(mon, td, id, true);
  else {
    const d = W.days.findIndex((list, i) => list.some((x) => x.key === id) && !isDone(mon, i, id));
    if (d >= 0) setDone(mon, d, id, true);
  }
  save(); stopRest();
  toast(`${SESSIONS[id].name} saved`);
  location.hash = '#/today';
}

// ---------- ROUTINE & CIRCUIT ----------
function viewRoutine(id) {
  const r = ROUTINES[id]; if (!r) return notFound();
  const total = routinePhases(r).reduce((a, p) => a + p.secs, 0);
  let lastPart = null;
  const rows = r.steps.map((s) => {
    const head = s.part && s.part !== lastPart ? `<li class="part">${esc(s.part)}</li>` : '';
    lastPart = s.part;
    return `${head}<li><span>${esc(s.name)}${s.cue ? `<small>${esc(s.cue)}</small>` : ''}</span><b>${restTxt(s.secs)}${s.sides ? ' each side' : ''}</b></li>`;
  }).join('');
  return `<header class="top sub"><a class="back" href="javascript:history.back()">‹</a><div><div class="eyebrow">Guided · about ${Math.round(total / 60)} min</div><h1>${esc(r.name)}</h1></div></header>
    ${r.note ? `<p class="notes"><span>${esc(r.note)}</span></p>` : ''}
    <button class="btn primary block big" data-act="play" data-id="${id}">▶ Start</button>
    <ul class="steps">${rows}</ul>
    <p class="hint center">The screen stays on while it runs. Beeps at 3-2-1, double beep to switch sides.</p>`;
}

function viewCircuit(id) {
  const c = CIRCUITS[id]; if (!c) return notFound();
  const total = circuitPhases(c).reduce((a, p) => a + p.secs, 0);
  return `<header class="top sub"><a class="back" href="javascript:history.back()">‹</a><div><div class="eyebrow">${c.work}s work / ${c.rest}s rest · ${c.rounds} rounds · ${Math.round(total / 60)} min</div><h1>${esc(c.name)}</h1></div></header>
    ${c.note ? `<p class="notes"><span>${esc(c.note)}</span></p>` : ''}
    <button class="btn primary block big" data-act="playc" data-id="${id}">▶ Start</button>
    <ol class="steps num">${c.exercises.map((e) => `<li><span>${esc(e)}</span></li>`).join('')}</ol>`;
}

// ---------- TRAIN ----------
function viewTrain() {
  const sess = Object.entries(SESSIONS).map(([id, s]) => `<a class="card linkcard ${catClass(id)}" href="#/session/${id}"><div><b>${esc(s.name)}</b><div class="hint">${esc(s.sub)} · ${s.minutes} min · ${s.exercises.length} exercises</div></div><span class="arrow">›</span></a>`).join('');
  const r = (ids) => ids.map((id) => `<a class="card linkcard" href="#/routine/${id}"><div><b>${esc(ROUTINES[id].name)}</b><div class="hint">${ROUTINES[id].steps.length} steps · ${Math.round(routinePhases(ROUTINES[id]).reduce((a, p) => a + p.secs, 0) / 60)} min</div></div><span class="arrow">›</span></a>`).join('');
  const hist = [...S().sessions].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 8);
  return `<header class="top"><div><div class="eyebrow">Sessions & routines</div><h1>Train</h1></div></header>
    <section><h2>Gym sessions</h2>${sess}</section>
    <section><h2>Flexibility</h2>${r(['flexFull', 'flex15'])}</section>
    <section><h2>Cool-downs</h2>${r(['cooldownGlute', 'cooldownClimb', 'cooldownRun'])}</section>
    <section><h2>Surf</h2>${r(['surfPre', 'surfPost'])}</section>
    <section><h2>Travel</h2><a class="card linkcard" href="#/circuit/travel"><div><b>Travel circuit</b><div class="hint">40/20 × 9 × 3 rounds · no equipment</div></div><span class="arrow">›</span></a>${r(['dailyMobility'])}</section>
    <section><h2>Recent</h2>${hist.length ? `<ul class="list">${hist.map((h) => `<li><span>${esc(SESSIONS[h.session]?.name || h.session)}</span><span class="hint">${shortDate(h.date)}</span></li>`).join('')}</ul>` : '<p class="hint">Finished sessions show up here.</p>'}</section>`;
}

// ---------- TIMER ----------
const LIM = { prep: [0, 60, 5], work: [5, 600, 5], rest: [0, 300, 5], rounds: [1, 30, 1], sets: [1, 10, 1], setrest: [0, 300, 15] };
function timerConf() { if (!S().timer) S().timer = { ...TIMER_PRESETS[0].c, sel: 0 }; return S().timer; }
function viewTimer() {
  const C = timerConf();
  const total = intervalPhases(C).reduce((a, p) => a + p.secs, 0);
  const row = (k, l) => `<div class="stepper"><span>${l}</span><div><button data-act="adj" data-k="${k}" data-v="-1">−</button><b>${k === 'rounds' || k === 'sets' ? C[k] : fmt(C[k])}</b><button data-act="adj" data-k="${k}" data-v="1">+</button></div></div>`;
  return `<header class="top"><div><div class="eyebrow">Intervals</div><h1>Timer</h1></div></header>
    <section><h2>Presets</h2><div class="presets">${TIMER_PRESETS.map((p, i) => `<button class="preset ${C.sel === i ? 'sel' : ''}" data-act="preset" data-i="${i}"><b>${esc(p.n)}</b><span>${esc(p.d)}</span></button>`).join('')}</div></section>
    <section><h2>Custom</h2><div class="card">${row('prep', 'Prep')}${row('work', 'Work')}${row('rest', 'Rest')}${row('rounds', 'Rounds')}${row('sets', 'Sets')}${row('setrest', 'Rest between sets')}</div>
    <p class="hint center">Total ${fmt(total)}</p>
    <button class="btn primary block big" data-act="tstart">▶ Start</button></section>`;
}

// ---------- LOG ----------
function viewLog(tab) {
  if (tab) logTab = tab;
  const tabs = [['food', 'Food'], ['body', 'Body'], ['lifts', 'Lifts']];
  let html = `<header class="top"><div><div class="eyebrow">Tracking</div><h1>Log</h1></div></header>
    <div class="seg">${tabs.map(([k, l]) => `<a class="${logTab === k ? 'on' : ''}" href="#/log/${k}">${l}</a>`).join('')}</div>`;
  if (logTab === 'food') html += foodTab();
  if (logTab === 'body') html += bodyTab();
  if (logTab === 'lifts') html += liftsTab();
  return html;
}

function foodTab() {
  const d = parse(foodDate); const list = foodFor(foodDate); const tot = foodTotals(foodDate);
  const mon = mondayOf(d); let wk = 0; for (let i = 0; i < 7; i++) wk += foodTotals(ymd(addDays(mon, i))).kcal;
  const start = parse(S().settings.start); const n = daysBetween(start, d);
  const pct = (v, t) => Math.min(100, (v / t) * 100);
  return `
    <div class="datenav"><button data-act="fday" data-v="-1">‹</button><b>${foodDate === ymd(today()) ? 'Today' : niceDate(d)}</b><button data-act="fday" data-v="1">›</button></div>
    ${n >= 0 && n < 14 ? `<div class="banner">Food log audit · day ${n + 1} of 14</div>` : ''}
    <div class="card totals">
      <div class="tot"><div class="row-between"><span>Calories</span><b>${tot.kcal} / ${TARGETS.kcalDay}</b></div><div class="bar"><div style="width:${pct(tot.kcal, TARGETS.kcalDay)}%" class="${tot.kcal > TARGETS.kcalDay ? 'over' : ''}"></div></div></div>
      <div class="tot"><div class="row-between"><span>Protein</span><b>${tot.p} / ${TARGETS.protein[0]}–${TARGETS.protein[1]} g</b></div><div class="bar"><div style="width:${pct(tot.p, TARGETS.protein[0])}%" class="good"></div></div></div>
      <div class="tot"><div class="row-between"><span>This week</span><b>${wk.toLocaleString()} / ${TARGETS.kcalWeek.toLocaleString()}</b></div><div class="bar"><div style="width:${pct(wk, TARGETS.kcalWeek)}%" class="${wk > TARGETS.kcalWeek ? 'over' : ''}"></div></div><div class="hint">Includes the 1,200 kcal weekly social allowance.</div></div>
    </div>
    <section><h2>Logged</h2>${list.length ? `<ul class="list">${list.map((f, i) => `<li><span>${esc(f.name)}<small>${f.kcal} kcal · ${f.p} g</small></span><button class="x-btn" data-act="fdel" data-i="${i}" aria-label="Remove">×</button></li>`).join('')}</ul>` : '<p class="hint">Tap a preset below to log it.</p>'}</section>
    <section><h2>Add</h2>
    ${FOOD_PRESETS.map((g, gi) => `<details class="fgroup" ${gi < 2 ? '' : ''}><summary>${esc(g.group)}</summary><div class="fbtns">${g.items.map((f, i) => `<button class="fbtn" data-act="fadd" data-g="${gi}" data-i="${i}"><span>${esc(f.name)}</span><small>${f.kcal} · ${f.p} g</small></button>`).join('')}</div></details>`).join('')}
    <div class="card custom"><b>Something else</b>
      <input id="cf-name" placeholder="What was it?">
      <div class="two"><input id="cf-kcal" type="number" inputmode="numeric" placeholder="kcal (estimate)"><input id="cf-p" type="number" inputmode="numeric" placeholder="protein g"></div>
      <button class="btn primary block" data-act="fcustom">Add</button></div>
    </section>`;
}

function weeklyAverages() {
  const by = {};
  S().weights.forEach((w) => { const m = ymd(mondayOf(parse(w.date))); (by[m] = by[m] || []).push(+w.kg); });
  return Object.entries(by).sort((a, b) => (a[0] < b[0] ? 1 : -1)).map(([m, a]) => ({ mon: m, avg: a.reduce((x, y) => x + y, 0) / a.length, n: a.length }));
}

function weightChart() {
  const pts = [...S().weights].sort((a, b) => (a.date < b.date ? -1 : 1)).slice(-60);
  if (pts.length < 2) return '<p class="hint">The trend line appears after two weigh-ins.</p>';
  const W = 320; const H = 120; const P = 8;
  const t0 = parse(pts[0].date); const t1 = parse(pts[pts.length - 1].date);
  const span = Math.max(1, daysBetween(t0, t1));
  const vals = pts.map((p) => +p.kg); const lo = Math.min(...vals) - 0.5; const hi = Math.max(...vals) + 0.5;
  const x = (p) => P + (daysBetween(t0, parse(p.date)) / span) * (W - 2 * P);
  const y = (v) => H - P - ((v - lo) / (hi - lo)) * (H - 2 * P);
  // 7-day rolling average
  const avg = pts.map((p) => { const d = parse(p.date); const win = pts.filter((q) => { const k = daysBetween(parse(q.date), d); return k >= 0 && k < 7; }); return { p, v: win.reduce((a, q) => a + +q.kg, 0) / win.length }; });
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Weight trend">
    ${pts.map((p) => `<circle cx="${x(p).toFixed(1)}" cy="${y(+p.kg).toFixed(1)}" r="2.5" class="pt"/>`).join('')}
    <polyline class="line" points="${avg.map((a) => `${x(a.p).toFixed(1)},${y(a.v).toFixed(1)}`).join(' ')}"/>
    <text x="${W - P}" y="12" text-anchor="end" class="lbl">${hi.toFixed(1)}</text><text x="${W - P}" y="${H - 2}" text-anchor="end" class="lbl">${lo.toFixed(1)}</text>
  </svg><p class="hint">Dots are daily weigh-ins; the line is the 7-day average.</p>`;
}

function bodyTab() {
  const wa = weeklyAverages();
  const ms = [...S().measures].sort((a, b) => (a.date < b.date ? 1 : -1));
  const fl = [...S().flex].sort((a, b) => (a.date < b.date ? 1 : -1));
  const lastM = ms[0]; const nextDue = lastM ? addDays(parse(lastM.date), 14) : null;
  const todayW = S().weights.find((w) => w.date === ymd(today()));
  const bridgeLv = ['Tabletop', 'Glute bridge, arms overhead', 'Full bridge from floor', 'Straight arms', 'Wall walk-downs'];
  return `
  <section class="card"><h2>Weight</h2>
    <div class="inline"><input id="w-kg" type="number" inputmode="decimal" step="0.1" placeholder="kg" value="${todayW ? todayW.kg : ''}"><button class="btn primary" data-act="wadd">${todayW ? 'Update' : 'Save'} today</button></div>
    <p class="hint">Morning, after the toilet, before eating. We watch the weekly average.</p>
    ${weightChart()}
    ${wa.length ? `<table class="tbl"><tr><th>Week of</th><th>Average</th><th>Change</th></tr>${wa.slice(0, 8).map((w, i) => `<tr><td>${shortDate(w.mon)}</td><td>${w.avg.toFixed(1)} kg</td><td>${wa[i + 1] ? `${(w.avg - wa[i + 1].avg >= 0 ? '+' : '')}${(w.avg - wa[i + 1].avg).toFixed(1)}` : ''}</td></tr>`).join('')}</table>` : ''}
  </section>
  <section class="card"><h2>Measurements</h2>
    <p class="hint">${nextDue ? (nextDue <= today() ? 'Due now — every 2 weeks.' : `Next due ${shortDate(ymd(nextDue))}.`) : 'Waist and hips every 2 weeks; chest and thigh monthly. Starting point: waist 92, hips 92, chest 102, thigh 55.'}</p>
    <div class="grid4">${['waist', 'hips', 'chest', 'thigh'].map((k) => `<label>${k[0].toUpperCase() + k.slice(1)}<input id="m-${k}" type="number" inputmode="decimal" step="0.5" placeholder="cm"></label>`).join('')}</div>
    <button class="btn primary block" data-act="madd">Save measurements</button>
    ${ms.length ? `<table class="tbl"><tr><th>Date</th><th>Waist</th><th>Hips</th><th>W:H</th><th>Chest</th><th>Thigh</th></tr>${ms.map((m) => `<tr><td>${shortDate(m.date)}</td><td>${m.waist || ''}</td><td>${m.hips || ''}</td><td>${m.waist && m.hips ? (m.waist / m.hips).toFixed(2) : ''}</td><td>${m.chest || ''}</td><td>${m.thigh || ''}</td></tr>`).join('')}</table>` : ''}
  </section>
  <section class="card"><h2>Flexibility test</h2>
    <p class="hint">First Saturday of each month. Pancake: chest-to-floor distance. Bridge: your current level (plus a side photo if you like).</p>
    <div class="two"><label>Pancake (cm)<input id="f-pan" type="number" inputmode="decimal" placeholder="cm"></label>
    <label>Bridge level<select id="f-bridge">${bridgeLv.map((l, i) => `<option value="${i}">${i + 1}. ${l}</option>`).join('')}</select></label></div>
    <button class="btn primary block" data-act="flexadd">Save test</button>
    ${fl.length ? `<table class="tbl"><tr><th>Date</th><th>Pancake</th><th>Bridge</th></tr>${fl.map((f) => `<tr><td>${shortDate(f.date)}</td><td>${f.pancake ?? ''} cm</td><td>${bridgeLv[f.bridge] || ''}</td></tr>`).join('')}</table>` : ''}
  </section>`;
}

function liftsTab() {
  let html = '';
  Object.entries(SESSIONS).forEach(([sid, sess]) => {
    const rows = sess.exercises.map((ex) => {
      const hist = S().sessions.filter((s) => s.sets[ex.id]).sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 3);
      if (!hist.length) return '';
      return `<li><span>${esc(ex.name)}</span><small>${hist.map((h) => `${shortDate(h.date)}: ${h.sets[ex.id].filter((s) => s.done).map((s) => (ex.type === 'hold' ? `${s.secs}s` : ex.type === 'lift' && s.w !== '' ? `${+s.w}×${s.r}` : s.r)).join(', ')}`).join('<br>')}</small></li>`;
    }).join('');
    if (rows) html += `<section><h2>${esc(sess.name)}</h2><ul class="list lifts">${rows}</ul></section>`;
  });
  return html || '<p class="hint center">Your lift history appears here after your first session.</p>';
}

// ---------- MORE ----------
function viewMore(tab) {
  moreTab = tab || null;
  if (!moreTab) {
    const items = [['plan', 'The plan', 'Weekly structure, surf swaps, tiers'], ['food', 'Food guide', 'Meal options, shopping list, social nights'], ['skin', 'Skin, body & nails', 'Routine, retinol ramp, body care, nails'], ['data', 'Settings & backup', 'Start date, export, import']];
    return `<header class="top"><div><div class="eyebrow">Reference</div><h1>More</h1></div></header>${items.map(([k, n, d]) => `<a class="card linkcard" href="#/more/${k}"><div><b>${n}</b><div class="hint">${d}</div></div><span class="arrow">›</span></a>`).join('')}`;
  }
  const back = `<header class="top sub"><a class="back" href="#/more">‹</a><div><h1>${{ plan: 'The plan', food: 'Food guide', skin: 'Skin, body & nails', data: 'Settings & backup' }[moreTab]}</h1></div></header>`;
  if (moreTab === 'plan') return back + planRef();
  if (moreTab === 'food') return back + foodRef();
  if (moreTab === 'skin') return back + skinRef();
  if (moreTab === 'data') return back + dataRef();
  return notFound();
}

function planRef() {
  const wkRows = [['Mon', 'Soccer, or 30–40 min easy run'], ['Tue', 'Glute A (daytime)'], ['Wed', 'Bouldering, Portside O\'Connor (evening)'], ['Thu', 'Upper body · calisthenics (daytime)'], ['Fri', 'Glute B (daytime)'], ['Sat', 'Yin & Yang yoga + 15 min flexibility · run, walk or swim'], ['Sun', 'Rest']];
  const swaps = [['Mon', 'Surf replaces the run or soccer.'], ['Tue', 'Glute A moves to Wednesday daytime.'], ['Wed', 'Surf morning; boulder evening if fresh, otherwise Sunday.'], ['Thu', 'Upper body moves to Saturday.'], ['Fri', 'Glute B moves to Saturday.'], ['Sat', 'Surf replaces yoga and cardio; full flexibility session Sunday (or Thu 6am Vin yoga).'], ['Sun', 'Surf replaces rest; take Monday easy.']];
  return `<section class="card"><h2>Weekly structure</h2><table class="tbl">${wkRows.map(([d, s]) => `<tr><td><b>${d}</b></td><td>${esc(s)}</td></tr>`).join('')}</table></section>
  <section class="card"><h2>When surf is on</h2><table class="tbl">${swaps.map(([d, s]) => `<tr><td><b>${d}</b></td><td>${esc(s)}</td></tr>`).join('')}</table>
  <ul class="bul"><li>At least one day between Glute A and Glute B.</li><li>Move one session per week at most.</li><li>Two surfs → upper session cut to 30 min.</li><li>Skip retinol the night before a planned surf.</li></ul></section>
  <section class="card"><h2>When something has to drop</h2><ol class="bul">${DROP_ORDER.map((x) => `<li>${esc(x)}</li>`).join('')}</ol><p class="hint">Glute A never drops. Always keep one fun session.</p></section>
  <section class="card"><h2>Tiers & coming back</h2><ul class="bul"><li><b>Full:</b> 6 sessions + rest day.</li><li><b>Busy:</b> Glute A, Glute B, Upper + bouldering or surf.</li><li><b>Travel:</b> 3 × 30 min circuits + daily mobility + steps.</li><li><b>After a trip:</b> week 1 travel, week 2 busy, week 3 full. Book your first gym session before you fly home.</li></ul></section>
  <section class="card"><h2>Progression</h2><ul class="bul"><li>Finish each set with about 2 reps in the tank.</li><li>Top of the rep range on every set → add weight next time (the app suggests it).</li><li>Skills progress by level, not weight.</li><li>No barbell back squats. Copenhagen reps: build to 15 each side. Stop at sharp groin or ankle pain.</li></ul></section>
  <section class="card"><h2>Yoga options</h2><table class="tbl"><tr><td><b>Main</b></td><td>Yin & Yang · Sat 8:30 or 10am · Portside O'Connor</td></tr><tr><td><b>Backup</b></td><td>Vin yoga · Thu 6am · Snap Mount Lawley</td></tr><tr><td><b>Bonus</b></td><td>Hatha Vinyasa · Mon 6:45pm · Snap Mount Lawley</td></tr><tr><td><b>Bonus</b></td><td>Power Yoga · Wed 6:30pm · Portside O'Connor</td></tr></table></section>`;
}

function foodRef() {
  const sh = S().shopping;
  return `<section class="card"><h2>Targets</h2><ul class="bul"><li>About 2,200 kcal a day + 1,200 kcal weekly social allowance.</li><li>Protein 140–150 g every day.</li><li>+250 kcal on surf and soccer days.</li><li>Water 2.5–3 L, more on surf and soccer days.</li><li>25 g dark chocolate, every day.</li></ul></section>
  <section class="card"><h2>Meal options</h2>${MEAL_OPTIONS.map(([slot, ...opts]) => `<h3>${slot}</h3><ul class="bul">${opts.map((o) => `<li>${esc(o)}</li>`).join('')}</ul>`).join('')}<p class="hint">Default snack is a protein shake. Swap for anything with about 25 g protein.</p></section>
  <section class="card"><div class="row-between"><h2>Shopping list</h2><button class="btn small ghost" data-act="shopreset">Clear ticks</button></div>${SHOPPING.map(([g, items]) => `<h3>${g}</h3><ul class="ticks">${items.map((it) => `<li><label class="tick ${sh[it] ? 'on' : ''}"><input type="checkbox" data-act="shop" data-id="${esc(it)}" ${sh[it] ? 'checked' : ''}><span>${esc(it)}</span></label></li>`).join('')}</ul>`).join('')}<p class="hint">About $140–155 a week. Creatine, multivitamin and omega-3 monthly.</p></section>
  <section class="card"><h2>Sunday meal prep</h2><ul class="bul"><li>Press, marinate and bake 2–3 blocks of tofu</li><li>Lentil bolognese batch, freeze half</li><li>Cook and portion rice</li><li>Boil 8–10 eggs</li><li>Portion oats</li><li>Freeze meat or fish bought on special</li></ul></section>
  <section class="card"><h2>Social nights</h2><ol class="bul">${SOCIAL_RULES.map((r) => `<li>${esc(r)}</li>`).join('')}</ol><p class="hint">Default takeaway: burrito bowl, poke or sushi, falafel plate, grilled chicken with salad.</p></section>`;
}

function skinRef() {
  return `<section class="card"><h2>Retinol ramp</h2><table class="tbl"><tr><td><b>Wk 1–4</b></td><td>Mon, Wed · moisturiser sandwich</td></tr><tr><td><b>Wk 5–8</b></td><td>Mon, Wed, Sat</td></tr><tr><td><b>Wk 9+</b></td><td>Every other night · glycolic returns Sundays (or a mask)</td></tr><tr><td><b>Month 4+</b></td><td>Consider 0.5% if 0.2% is easy</td></tr></table>
  <ul class="bul"><li>Skip retinol the night before a planned surf (the app does this).</li><li>Stinging, peeling or red → fewer nights, then rebuild.</li><li>Never retinol and glycolic on the same night.</li></ul></section>
  <section class="card"><h2>Products</h2><ul class="bul"><li>CeraVe Foaming Cleanser</li><li>Hyaluronic acid serum</li><li>The Ordinary Niacinamide 10% + Zinc (mornings)</li><li>CeraVe Moisturising Cream</li><li>Badger Sport SPF 40 · Surfmud or SunButter SPF 50 for surf</li><li>The Ordinary Retinol 0.2% in Squalane</li><li>The Ordinary Glycolic Acid 7% (paused until week 9)</li><li>Micellar water after surf or heavy SPF</li></ul></section>
  <section class="card"><h2>Body care</h2><ul class="bul"><li>Daily body moisturiser after showering, especially after surf.</li><li>CeraVe SA Smoothing Cleanser 2–3× a week, or an exfoliating glove weekly.</li><li>Hand cream after climbing.</li><li>Mineral SPF on shoulders, neck and legs for surf.</li></ul></section>
  <section class="card"><h2>Nails · every second Sunday</h2><ol class="bul"><li>Soak 5 min</li><li>Push back cuticles gently (don't cut)</li><li>Clip and file in one direction</li><li>Buff, or a clear or sheer coat</li><li>Cuticle oil, then hand or foot cream</li></ol><p class="hint">Kit: clipper, glass file, cuticle pusher, cuticle oil, 4-way buffer.</p></section>
  <section class="card"><h2>Waxing (summer, optional)</h2><ul class="bul"><li>Exfoliate 1–2 days before, not on the day.</li><li>No ocean, pool or strong sun for 24–48 h after — plan around surf.</li><li>Moisturise daily; SA cleanser again from day 3.</li></ul></section>`;
}

function dataRef() {
  const s = S();
  return `<section class="card"><h2>Plan start date</h2><input id="startdate" type="date" value="${s.settings.start}"><button class="btn primary block" data-act="setstart">Save start date</button><p class="hint">Week numbers, the food audit and the retinol ramp count from this Monday.</p></section>
  <section class="card"><h2>Backup</h2><p class="hint">Everything is stored on this phone only. Export now and then, and save the file to Google Drive.</p>
    <button class="btn primary block" data-act="export">Export backup</button>
    <label class="btn block filebtn">Import backup<input type="file" accept="application/json,.json" data-act="import" hidden></label></section>
  <section class="card"><h2>Reset</h2><button class="btn danger block" data-act="reset">Delete all my data</button></section>
  <p class="hint center">Fitness Plan 2.0 · data stays on your device</p>`;
}

function notFound() { return '<p class="hint center">Not found. <a href="#/today">Back to today</a></p>'; }

// ---------- render & routing ----------
function render() {
  const parts = (location.hash || '#/today').slice(2).split('/');
  const [route, arg] = parts;
  view = {};
  let html;
  switch (route) {
    case 'session': html = viewSession(arg); break;
    case 'routine': html = viewRoutine(arg); break;
    case 'circuit': html = viewCircuit(arg); break;
    case 'train': html = viewTrain(); break;
    case 'timer': html = viewTimer(); break;
    case 'log': html = viewLog(arg); break;
    case 'more': html = viewMore(arg); break;
    default: html = viewToday();
  }
  $app.innerHTML = html;
  const tabRoute = ['session', 'routine', 'circuit'].includes(route) ? 'train' : (route || 'today');
  document.querySelectorAll('.nav a').forEach((a) => a.classList.toggle('on', a.dataset.r === tabRoute));
}

window.addEventListener('hashchange', () => { closeSheet(); render(); window.scrollTo(0, 0); });

$app.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]'); if (!el) return;
  const act = el.dataset.act;
  const st = S();
  switch (act) {
    case 'tier': return tierSheet();
    case 'day': return daySheet(el.dataset.mon, +el.dataset.d);
    case 'done': { const v = !isDone(el.dataset.mon, +el.dataset.d, el.dataset.k); setDone(el.dataset.mon, +el.dataset.d, el.dataset.k, v); return render(); }
    case 'skin': { const dd = day(ymd(today())); dd[`skin${el.dataset.w}`] = !dd[`skin${el.dataset.w}`]; save(); return render(); }
    case 'set': case 'hold': return sessionAction(act, el);
    case 'finish': return finishSession();
    case 'discard': if (confirm('Discard this session?')) { delete st.active[`${view.session.id}|${view.session.dk}`]; save(); stopRest(); location.hash = '#/today'; } return;
    case 'play': { const id = el.dataset.id; return runSequence(routinePhases(ROUTINES[id]), { title: ROUTINES[id].name, onDone: () => { markTodayDone((k, a) => a && a.routine === id); } }); }
    case 'playc': { const id = el.dataset.id; return runSequence(circuitPhases(CIRCUITS[id]), { title: CIRCUITS[id].name, onDone: () => { markTodayDone((k, a) => a && a.circuit === id); } }); }
    case 'preset': { const p = TIMER_PRESETS[+el.dataset.i]; st.timer = { ...p.c, sel: +el.dataset.i }; save(); return render(); }
    case 'adj': { const C = timerConf(); const [lo, hi, step] = LIM[el.dataset.k]; const v = C[el.dataset.k] + step * +el.dataset.v; if (v >= lo && v <= hi) { C[el.dataset.k] = v; C.sel = -1; save(); render(); } return; }
    case 'tstart': return runSequence(intervalPhases(timerConf()), { title: TIMER_PRESETS[timerConf().sel]?.n || 'Custom timer' });
    case 'fday': { foodDate = ymd(addDays(parse(foodDate), +el.dataset.v)); return render(); }
    case 'fadd': { const f = FOOD_PRESETS[+el.dataset.g].items[+el.dataset.i]; foodFor(foodDate).push({ name: f.name, kcal: f.kcal, p: f.p }); save(); toast(`Added ${f.name}`); return render(); }
    case 'fdel': { foodFor(foodDate).splice(+el.dataset.i, 1); save(); return render(); }
    case 'fcustom': {
      const name = document.getElementById('cf-name').value.trim(); const kcal = +document.getElementById('cf-kcal').value || 0; const p = +document.getElementById('cf-p').value || 0;
      if (!name && !kcal) return toast('Add a name or calories');
      foodFor(foodDate).push({ name: name || 'Something', kcal, p }); save(); return render();
    }
    case 'wadd': {
      const v = parseFloat(document.getElementById('w-kg').value); if (!v) return toast('Enter your weight');
      const k = ymd(today()); st.weights = st.weights.filter((w) => w.date !== k); st.weights.push({ date: k, kg: v }); save(); toast('Weight saved'); return render();
    }
    case 'madd': {
      const m = { date: ymd(today()) }; let any = false;
      ['waist', 'hips', 'chest', 'thigh'].forEach((k) => { const v = parseFloat(document.getElementById(`m-${k}`).value); if (v) { m[k] = v; any = true; } });
      if (!any) return toast('Enter at least one measurement');
      st.measures = st.measures.filter((x) => x.date !== m.date); st.measures.push(m); save(); toast('Measurements saved'); return render();
    }
    case 'flexadd': {
      const pan = parseFloat(document.getElementById('f-pan').value); const br = +document.getElementById('f-bridge').value;
      st.flex = st.flex.filter((x) => x.date !== ymd(today())); st.flex.push({ date: ymd(today()), pancake: isNaN(pan) ? null : pan, bridge: br }); save(); toast('Test saved'); return render();
    }
    case 'shopreset': st.shopping = {}; save(); return render();
    case 'setstart': {
      const v = document.getElementById('startdate').value; if (!v) return;
      const d = parse(v); if (dayIdx(d) !== 0 && !confirm('That isn\'t a Monday. Use it anyway?')) return;
      st.settings.start = v; save(); toast('Start date saved'); return render();
    }
    case 'export': {
      const blob = new Blob([exportJSON()], { type: 'application/json' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `fitness-backup-${ymd(today())}.json`;
      document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); return;
    }
    case 'reset': if (confirm('Delete everything you have logged? This cannot be undone.') && confirm('Really delete all data?')) { replaceAll({}); render(); toast('All data deleted'); } return;
  }
});

$app.addEventListener('change', (e) => {
  const el = e.target; const act = el.dataset.act; if (!act) return;
  const st = S();
  if (act === 'tick') { const dd = day(ymd(today())); dd.ticks[el.dataset.id] = el.checked; save(); el.closest('.tick').classList.toggle('on', el.checked); }
  if (act === 'prep') { st.prep[el.dataset.id] = el.checked; save(); el.closest('.tick').classList.toggle('on', el.checked); }
  if (act === 'shop') { st.shopping[el.dataset.id] = el.checked; save(); el.closest('.tick').classList.toggle('on', el.checked); }
  if (act === 'level') { st.levels[el.dataset.ex] = +el.value; save(); }
  if (['w', 'r', 'secs'].includes(act)) {
    const { id, dk } = view.session; const row = st.active[`${id}|${dk}`].sets[el.dataset.ex][+el.dataset.i];
    row[act] = el.value === '' ? '' : +el.value;
    if (act === 'secs') st.holdSecs[el.dataset.ex] = +el.value;
    if (act === 'w') {
      // carry a changed weight down to the following unticked sets
      const rows = st.active[`${id}|${dk}`].sets[el.dataset.ex];
      for (let j = +el.dataset.i + 1; j < rows.length; j++) if (!rows[j].done) { rows[j].w = row.w; const inp = document.querySelector(`input[data-act="w"][data-ex="${el.dataset.ex}"][data-i="${j}"]`); if (inp) inp.value = row.w; }
    }
    save();
  }
  if (act === 'import') {
    const f = el.files[0]; if (!f) return;
    f.text().then((txt) => {
      try { const obj = JSON.parse(txt); if (!obj || typeof obj !== 'object' || !obj.settings) throw new Error('bad'); if (!confirm('Replace everything on this phone with this backup?')) return; replaceAll(obj); toast('Backup restored'); render(); } catch (err) { toast('That file isn\'t a valid backup'); }
    });
  }
});

// ---------- boot ----------
render();
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}
