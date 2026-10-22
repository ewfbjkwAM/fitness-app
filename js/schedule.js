// Builds the week from the default structure plus this week's surf days,
// date night and tier, using the swap rules from the plan.
import { DEFAULT_WEEK, DAY_NAMES } from './data.js';
import { week, ymd, addDays, planWeek, parse } from './store.js';

const it = (key, extra = {}) => ({ key, ...extra });

export function buildWeek(monday) {
  const w = week(monday);
  const notes = [];
  let days;

  if (w.tier === 'survival') {
    days = [0, 1, 2, 3, 4, 5, 6].map(() => [it('mobility')]);
    [0, 2, 4].forEach((d) => days[d].unshift(it('circuit')));
    notes.push('Survival or travel week: 3 circuits, daily 10-min mobility, 8–10k steps. Surf or swim can replace a circuit.');
    (w.surf || []).forEach((d) => days[d].unshift(it('surf')));
    return { days, notes, tier: w.tier };
  }

  days = DEFAULT_WEEK.map((list) => list.map((k) => it(k)));
  const busy = w.tier === 'busy';
  if (busy) {
    days[0] = [it('cardioMon', { optional: true })];
    days[5] = [it('cardioSat', { optional: true })];
    days[6] = [it('flexFull', { optional: true })];
    notes.push('Busy week: Glute A, Glute B and Upper, plus bouldering or surf. Cardio is a bonus; cool-downs stay.');
  }

  const remove = (d, key) => { days[d] = days[d].filter((x) => x.key !== key); };
  const has = (d, key) => days[d].some((x) => x.key === key);
  let moves = 0;
  const surf = [...(w.surf || [])].sort((a, b) => a - b);

  for (const d of surf) {
    switch (d) {
      case 0:
        remove(0, 'cardioMon');
        days[0].unshift(it('surf'));
        break;
      case 1:
        if (has(1, 'gluteA')) {
          remove(1, 'gluteA');
          days[2].unshift(it('gluteA', { moved: 1, note: 'Daytime, before bouldering' }));
          moves++;
        }
        days[1].unshift(it('surf'));
        break;
      case 2:
        days[2].unshift(it('surf', { note: 'Morning' }));
        days[2] = days[2].map((x) => (x.key === 'boulder' ? { ...x, note: 'Only if you feel fresh, otherwise move it to Sunday' } : x));
        break;
      case 3:
        if (has(3, 'upper')) {
          remove(3, 'upper');
          days[5].push(it('upper', { moved: 3 }));
          moves++;
        }
        days[3].unshift(it('surf'));
        break;
      case 4:
        if (has(4, 'gluteB')) {
          remove(4, 'gluteB');
          days[5].push(it('gluteB', { moved: 4 }));
          moves++;
        }
        days[4].unshift(it('surf'));
        break;
      case 5:
        if (has(5, 'yoga')) {
          remove(5, 'yoga');
          notes.push('Saturday surf: no yoga class this week. Backup: Thursday 6am Vin yoga at Snap Mount Lawley, and Sunday\'s full flexibility session still counts.');
        }
        remove(5, 'cardioSat');
        days[5].unshift(it('surf'));
        break;
      case 6:
        days[6].unshift(it('surf'));
        notes.push('Sunday surf: take next Monday easy — a walk, no run.');
        break;
    }
  }

  if (w.dateNight === 2) {
    const b = days[2].find((x) => x.key === 'boulder');
    if (b) {
      remove(2, 'boulder');
      days[6].push(it('boulder', { moved: 2, note: 'Moved for date night' }));
    }
  }

  // Guardrail: a day between Glute A and Glute B.
  const where = (key) => days.findIndex((list) => list.some((x) => x.key === key));
  const a = where('gluteA');
  const b = where('gluteB');
  if (a >= 0 && b >= 0 && Math.abs(a - b) <= 1) {
    const later = a > b ? 'gluteA' : 'gluteB';
    const from = Math.max(a, b);
    const target = Math.min(a, b) + 2;
    const moving = days[from].find((x) => x.key === later);
    remove(from, later);
    if (target <= 6) {
      days[target].push({ ...moving, moved: moving.moved ?? from, note: 'Pushed to keep a day between glute sessions' });
    } else {
      notes.push(`${later === 'gluteA' ? 'Glute A' : 'Glute B'} drops this week — no room for a day's gap.`);
    }
  }

  // Anything on Sunday replaces the rest day.
  if (days[6].some((x) => x.key !== 'rest')) remove(6, 'rest');

  if (moves > 1) {
    notes.push('More than one session moved. Only one move per week — drop in this order if it\'s too much: Saturday flexibility, yoga, upper body, Glute B. Glute A never drops.');
  }
  if (surf.length >= 2) notes.push('Two or more surfs: cut the upper session to 30 min (skill block and core).');

  return { days, notes, tier: w.tier || 'full' };
}

export function surfTomorrow(date) {
  const t = addDays(date, 1);
  const mon = addDays(t, -((t.getDay() + 6) % 7));
  const w = week(ymd(mon));
  return (w.surf || []).includes((t.getDay() + 6) % 7);
}

// Which evening skincare routine applies tonight.
export function nightType(date, startYmd) {
  const wk = planWeek(date);
  const d = (date.getDay() + 6) % 7;
  if (wk <= 0) return { type: 'normal', reason: 'Plan starts Monday — retinol begins then.' };
  const start = parse(startYmd);
  const daysIn = Math.round((date - start) / 86400000);

  let retinol = false;
  if (wk <= 4) retinol = d === 0 || d === 2;
  else if (wk <= 8) retinol = d === 0 || d === 2 || d === 5;
  else retinol = d !== 6 && daysIn % 2 === 0;

  if (retinol && surfTomorrow(date)) {
    return { type: 'normal', reason: 'Retinol skipped — surf planned tomorrow.' };
  }
  if (retinol) {
    return { type: wk <= 4 ? 'retinol' : 'retinolNoBuffer', reason: `Retinol night (week ${wk}).` };
  }
  if (d === 6) {
    return wk >= 9
      ? { type: 'maskOrGlycolic', reason: 'Sunday: mask or glycolic, never both.' }
      : { type: 'mask', reason: 'Sunday mask (glycolic returns in week 9).' };
  }
  return { type: 'normal', reason: '' };
}

export const dayLabel = (i) => DAY_NAMES[i];
