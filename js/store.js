// Local storage for everything you log. Data never leaves the phone
// unless you export a backup.
import { PLAN_START } from './data.js';

const KEY = 'fitnessPlan2';
const blank = () => ({
  version: 1,
  settings: { start: PLAN_START },
  weeks: {},      // mondayYmd -> { surf:[dayIdx], dateNight:null|dayIdx, tier:'full'|'busy'|'survival', done:{}, soccer:null }
  days: {},       // ymd -> { ticks:{}, skinAM:false, skinPM:false }
  sessions: [],   // finished sessions
  active: {},     // in-progress session drafts, key = sessionId|ymd
  levels: {},     // exerciseId -> level index
  holdSecs: {},   // exerciseId -> chosen seconds
  weights: [],    // {date, kg}
  measures: [],   // {date, waist, hips, chest, thigh}
  flex: [],       // {date, pancake, bridge}
  food: {},       // ymd -> [{name,kcal,p}]
  shop: {},       // mondayYmd -> { item: true } ticked shopping items
  menus: {},      // mondayYmd -> { b, l, d1, d2 } overrides to the rotation
  recentFoods: [],// last foods added from search, Claude or custom
  prep: {},       // before-week-1 checklist
  timer: null,    // last free-timer config
});

let state;
try {
  state = Object.assign(blank(), JSON.parse(localStorage.getItem(KEY) || 'null') || {});
} catch (e) {
  state = blank();
}

export function S() { return state; }

export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* storage full or blocked */ }
}

export function replaceAll(obj) {
  state = Object.assign(blank(), obj);
  save();
}

export function exportJSON() { return JSON.stringify(state, null, 2); }

// ---------- dates ----------
export const pad = (n) => String(n).padStart(2, '0');
export const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parse = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
export const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
export const dayIdx = (d) => (d.getDay() + 6) % 7; // Mon=0
export const mondayOf = (d) => addDays(new Date(d.getFullYear(), d.getMonth(), d.getDate()), -dayIdx(d));
export const today = () => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); };
export const daysBetween = (a, b) => Math.round((b - a) / 86400000);

export function planWeek(d) {
  // 1-based week number of the plan; <=0 means before the start
  const start = parse(state.settings.start);
  const diff = daysBetween(start, d);
  return diff < 0 ? 0 : Math.floor(diff / 7) + 1;
}

export function week(mon) {
  const k = typeof mon === 'string' ? mon : ymd(mon);
  if (!state.weeks[k]) state.weeks[k] = { surf: [], dateNight: null, tier: 'full', done: {} };
  return state.weeks[k];
}

export function day(d) {
  const k = typeof d === 'string' ? d : ymd(d);
  if (!state.days[k]) state.days[k] = { ticks: {}, skinAM: false, skinPM: false };
  return state.days[k];
}

export function foodFor(d) {
  const k = typeof d === 'string' ? d : ymd(d);
  if (!state.food[k]) state.food[k] = [];
  return state.food[k];
}
