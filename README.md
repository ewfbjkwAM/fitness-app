# Fitness Plan

A small installable web app for the Fitness Plan 2.0 training, flexibility, food and skincare plan.

- **Today:** today's sessions, the week (with surf and date-night swaps), skincare for tonight, daily ticks.
- **Train:** guided sessions with lift logging, rest timers and progression suggestions; guided stretching, surf mobility and the travel circuit.
- **Timer:** free interval timer with presets.
- **Log:** food (presets for every plan meal and drink), weight trend, measurements, flexibility tests, lift history.
- **More:** the plan, food guide, skincare guide, backup.

All logged data stays on the phone (localStorage). Export a backup from More → Settings & backup.

## Editing the plan

Plan content lives in `js/data.js`. Swap rules live in `js/schedule.js`.
After changing files, bump `VERSION` in `sw.js` so installed copies update.

## Install on Android

Open the site in Chrome → menu → **Add to Home screen**.
