// All plan content lives here. Change the plan by editing this file.
// Source: "Fitness Plan 2.0" document (15 Oct 2026).

export const PLAN_START = '2026-10-19'; // Monday of week 1

export const TARGETS = {
  kcalDay: 2200,
  socialWeek: 1200,
  kcalWeek: 16600,
  protein: [140, 150],
  waterL: [2.5, 3],
};

// ---------- Exercise types ----------
// lift:  sets x reps with a weight. Progress by adding `inc` when every set hits the top of the range.
// reps:  sets x reps, no weight (or bodyweight). Tick each set.
// hold:  sets x seconds, timed.
// Each exercise: rest = seconds between sets. each = per side/leg.

export const SESSIONS = {
  gluteA: {
    name: 'Glute A',
    sub: 'Heavy',
    minutes: 60,
    warmup: 'warmupGlute',
    cooldown: 'cooldownGlute',
    exercises: [
      { id: 'hipThrust', name: 'Barbell hip thrust', type: 'lift', sets: 4, reps: [8, 12], start: 50, inc: 5, rest: 120, notes: 'Pause 1 s at the top, chin tucked.' },
      { id: 'rdl', name: 'Romanian deadlift', type: 'lift', sets: 3, reps: [8, 10], start: 45, inc: 5, rest: 120, notes: 'Hips back, stop where your hamstrings stop you.' },
      { id: 'slSitStand', name: 'Single-leg sit to stand', type: 'lift', sets: 3, reps: [10, 10], each: true, start: 10, inc: 2.5, rest: 90, notes: 'Slow, thighs slightly apart, no knee wobble. Progress by lowering the seat. Stop short of any ankle pinch.' },
      { id: 'legPress', name: 'Leg press, feet high', type: 'lift', sets: 3, reps: [10, 15], start: null, inc: 10, rest: 90, notes: 'Feet slightly wider than hips, not a wide stance.' },
      { id: 'cableAbd', name: 'Cable hip abduction', type: 'lift', sets: 3, reps: [12, 15], each: true, start: null, inc: 2.5, rest: 60, notes: 'Slow, lean slightly forward.' },
      { id: 'copenhagen', name: 'Copenhagen reps', type: 'reps', sets: 3, reps: [5, 5], each: true, rest: 45, notes: 'Aim for 15 each side in total. If the left side is sore at the bottom, only hover; don\'t push through the floor.' },
      { id: 'pallof', name: 'Pallof press', type: 'lift', sets: 3, reps: [10, 10], each: true, start: null, inc: 1, rest: 45, notes: 'Core for a slimmer waist without bulk.' },
    ],
  },
  gluteB: {
    name: 'Glute B',
    sub: 'Single-leg & shaping',
    minutes: 55,
    warmup: 'warmupGlute',
    cooldown: 'cooldownGlute',
    exercises: [
      { id: 'bulgarian', name: 'DB Bulgarian split squat', type: 'lift', sets: 3, reps: [8, 12], each: true, start: 12.5, inc: 2.5, rest: 120, notes: 'Lean the torso slightly forward for more glute. Always after the warm-up.' },
      { id: 'backExt', name: '45° back extension (or cable pull-through)', type: 'lift', sets: 3, reps: [12, 15], start: 0, inc: 5, rest: 90, notes: 'Round the upper back, feet turned out. No bench → cable pull-through.' },
      { id: 'stepUp', name: 'DB step-ups', type: 'lift', sets: 2, reps: [10, 10], each: true, start: 8, inc: 2, rest: 90, notes: 'Knee-height box, drive through the heel. Weight is per hand.' },
      { id: 'sliderLunge', name: 'Slider reverse lunge into side lunge', type: 'reps', sets: 2, reps: [10, 10], each: true, rest: 90, notes: 'Short side-lunge range, not to fatigue.' },
      { id: 'kickback', name: 'Cable glute kickback', type: 'lift', sets: 3, reps: [12, 15], each: true, start: null, inc: 2.5, rest: 60, notes: 'No lower back arch.' },
      { id: 'adductor', name: 'Adductor machine', type: 'lift', sets: 3, reps: [12, 15], start: null, inc: 5, rest: 60, notes: 'Light, slow and controlled.' },
      { id: 'abductorBurn', name: 'Abduction machine burnout', type: 'lift', sets: 2, reps: [20, 25], start: null, inc: 5, rest: 60, notes: 'Lean forward over the machine.' },
      { id: 'deadBug', name: 'Dead bug', type: 'reps', sets: 3, reps: [8, 8], each: true, rest: 45, notes: 'Lower back pressed into the floor.' },
    ],
  },
  upper: {
    name: 'Upper body',
    sub: 'Calisthenics',
    minutes: 60,
    warmup: 'warmupUpper',
    cooldown: 'cooldownClimb',
    note: 'Climbed yesterday? If grip or elbows are cooked, swap archer pulls for an extra handstand and dip block.',
    exercises: [
      { id: 'handstand', name: 'Handstand', type: 'hold', sets: 7, secs: 30, rest: 75, levels: ['Chest to wall', 'Back to wall', 'Kick-up attempts', 'Freestanding'], notes: '6–8 holds of 20–40 s.' },
      { id: 'flag', name: 'Human flag', type: 'hold', sets: 4, secs: 8, rest: 90, levels: ['Vertical flag hold', 'Tuck flag', 'One-leg tuck', 'Straddle'], notes: '4–5 holds of 5–10 s. Alternate weeks with skin the cat if shoulders are tired.' },
      { id: 'archer', name: 'Archer pulls', type: 'reps', sets: 3, reps: [4, 6], each: true, rest: 90, levels: ['Archer rows', 'Assisted archer pulls', 'Full archer pulls'] },
      { id: 'skinCat', name: 'Skin the cat', type: 'reps', sets: 3, reps: [3, 5], rest: 90, levels: ['Feet on floor', 'Tucked', 'Full'], notes: 'Slow reps.' },
      { id: 'pike', name: 'Pike push-ups', type: 'reps', sets: 3, reps: [8, 12], rest: 90, levels: ['Floor', 'Feet elevated', 'Wall HSPU negatives'] },
      { id: 'dips', name: 'Dips', type: 'lift', sets: 3, reps: [8, 12], start: 0, inc: 2.5, rest: 90, notes: '0 kg = bodyweight. Add weight after 3 × 12.' },
      { id: 'facePop', name: 'Face pulls × 15 + pop-up drills × 8', type: 'reps', sets: 3, reps: [1, 1], rest: 60, unit: 'round', notes: 'Posture and surf strength. One round per set.' },
      { id: 'kneeRaise', name: 'Hanging knee raises', type: 'reps', sets: 3, reps: [10, 10], rest: 60, levels: ['Knee raises', 'Leg raises'] },
      { id: 'lsit', name: 'L-sit hold', type: 'hold', sets: 3, secs: 15, rest: 60, levels: ['Tuck L-sit', 'One leg out', 'Full L-sit'], notes: 'Max hold. Set the time to your current max.' },
    ],
  },
};

// ---------- Timed routines ----------
// Each step: name, secs (per side when sides:true), optional cue.
// Untimed rep moves get a sensible time so the routine flows.
export const ROUTINES = {
  warmupGlute: {
    name: 'Glute day warm-up', transition: 5,
    steps: [
      { name: 'Bike', secs: 180, cue: 'Easy pace' },
      { name: 'Ball-squeeze glute bridges', secs: 75, cue: '20–25 reps, football between the knees' },
      { name: 'Ball-squeeze glute bridges (set 2)', secs: 75, cue: '20–25 reps' },
      { name: 'Bodyweight split squats', secs: 35, sides: true, cue: '10 reps' },
      { name: 'Leg swings', secs: 20, sides: true, cue: '10 each direction' },
    ],
  },
  warmupUpper: {
    name: 'Upper warm-up', transition: 5,
    steps: [
      { name: 'Wrist prep', secs: 90, cue: 'Circles, flexor and extensor stretches, palm rocks' },
      { name: 'Scapular pull-ups', secs: 40, cue: '10 reps' },
      { name: 'Scapular push-ups', secs: 40, cue: '10 reps' },
      { name: 'Dead hang', secs: 30 },
    ],
  },
  cooldownGlute: {
    name: 'Cool-down: glute day', transition: 10,
    steps: [
      { name: 'Hip flexor stretch', secs: 60, sides: true },
      { name: 'Pigeon pose', secs: 60, sides: true },
      { name: 'Hamstring stretch', secs: 45, sides: true },
      { name: 'Quad stretch', secs: 45, sides: true },
      { name: 'Cat-cow', secs: 45, cue: '10 slow reps' },
      { name: "Child's pose", secs: 60 },
    ],
  },
  cooldownClimb: {
    name: 'Cool-down: climbing & calisthenics', transition: 10,
    steps: [
      { name: 'Wrist circles & flexor stretch', secs: 30, sides: true, cue: 'Each direction' },
      { name: 'Forearm extensor stretch', secs: 30, sides: true },
      { name: 'Doorway chest stretch', secs: 45 },
      { name: 'Lat stretch hanging from bar', secs: 30 },
      { name: 'Thoracic rotation', secs: 30, sides: true, cue: '10 reps' },
      { name: "Child's pose", secs: 60 },
    ],
  },
  cooldownRun: {
    name: 'Cool-down: run or soccer', transition: 10,
    steps: [
      { name: 'Calf stretch', secs: 45, sides: true },
      { name: 'Quad stretch', secs: 45, sides: true },
      { name: 'Hip flexor stretch', secs: 60, sides: true },
      { name: 'Hamstring stretch', secs: 45, sides: true },
      { name: 'Gentle butterfly', secs: 60 },
      { name: 'Figure-four glute stretch', secs: 60, sides: true },
    ],
  },
  flexFull: {
    name: 'Flexibility: full session', transition: 10,
    note: 'About 6/10 intensity. Never into groin pain.',
    steps: [
      { name: 'Cat-cow', secs: 40, cue: '10 reps', part: 'Warm-up' },
      { name: 'Hip circles', secs: 20, sides: true, cue: '10 each direction', part: 'Warm-up' },
      { name: '90/90 hip switches', secs: 40, cue: '10 reps', part: 'Warm-up' },
      { name: 'Wall handstand practice', secs: 300, cue: 'Short holds, rest as needed', part: 'Handstand' },
      { name: 'Straddle sit on a yoga block', secs: 90, cue: 'Long hold', part: 'Pancake' },
      { name: 'Straddle sit on a yoga block (2)', secs: 90, part: 'Pancake' },
      { name: 'Standing wide good mornings', secs: 45, cue: '10 reps', part: 'Pancake' },
      { name: 'Standing wide good mornings (2)', secs: 45, cue: '10 reps', part: 'Pancake' },
      { name: 'Standing wide good mornings (3)', secs: 45, cue: '10 reps', part: 'Pancake' },
      { name: 'Seated straddle walk-forward pulses', secs: 40, cue: '10 reps', part: 'Pancake' },
      { name: 'Seated straddle walk-forward pulses (2)', secs: 40, cue: '10 reps', part: 'Pancake' },
      { name: 'Frog rocks', secs: 40, cue: '10 gentle reps, no long hold', part: 'Pancake' },
      { name: 'Frog rocks (2)', secs: 40, cue: '10 gentle reps', part: 'Pancake' },
      { name: 'Straddle leg lifts', secs: 30, sides: true, cue: '8 reps, hold 2 s', part: 'Pancake' },
      { name: 'Straddle leg lifts (2)', secs: 30, sides: true, cue: '8 reps', part: 'Pancake' },
      { name: 'Couch stretch', secs: 60, sides: true, part: 'Bridge' },
      { name: 'Couch stretch (2)', secs: 60, sides: true, part: 'Bridge' },
      { name: 'Thoracic extension over foam roller', secs: 120, part: 'Bridge' },
      { name: 'Puppy pose, elbows on bench', secs: 45, part: 'Bridge' },
      { name: 'Puppy pose (2)', secs: 45, part: 'Bridge' },
      { name: 'Bridge progression', secs: 60, cue: '5 holds of 5 s at your level', part: 'Bridge' },
      { name: 'Bridge progression (2)', secs: 60, cue: '5 holds of 5 s', part: 'Bridge' },
      { name: 'Bridge progression (3)', secs: 60, cue: '5 holds of 5 s', part: 'Bridge' },
      { name: 'Wall angels', secs: 45, cue: '10 reps', part: 'Posture' },
    ],
  },
  flex15: {
    name: 'Flexibility: 15 min after yoga', transition: 10,
    note: 'The starred moves from the full session.',
    steps: [
      { name: 'Wall handstand practice', secs: 300, cue: 'Short holds, rest as needed' },
      { name: 'Standing wide good mornings', secs: 45, cue: '10 reps' },
      { name: 'Standing wide good mornings (2)', secs: 45, cue: '10 reps' },
      { name: 'Standing wide good mornings (3)', secs: 45, cue: '10 reps' },
      { name: 'Straddle leg lifts', secs: 30, sides: true, cue: '8 reps, hold 2 s' },
      { name: 'Straddle leg lifts (2)', secs: 30, sides: true, cue: '8 reps' },
      { name: 'Bridge progression', secs: 60, cue: '5 holds of 5 s at your level' },
      { name: 'Bridge progression (2)', secs: 60, cue: '5 holds of 5 s' },
      { name: 'Bridge progression (3)', secs: 60, cue: '5 holds of 5 s' },
    ],
  },
  surfPre: {
    name: 'Pre-surf mobility', transition: 5,
    steps: [
      { name: 'Thoracic rotations', secs: 30, sides: true, cue: '10 slow reps' },
      { name: 'Thread the needle', secs: 30, sides: true },
      { name: 'Hip circles', secs: 20, sides: true, cue: '10 each direction' },
      { name: 'Prone cobra hold', secs: 20 },
      { name: 'Prone cobra hold (2)', secs: 20 },
      { name: 'Prone cobra hold (3)', secs: 20 },
      { name: 'Ankle circles & calf raises', secs: 40, cue: '20 reps' },
      { name: 'Wrist circles & prayer stretch', secs: 30 },
      { name: 'Arm swings across body & overhead', secs: 30, cue: '15 reps' },
    ],
  },
  surfPost: {
    name: 'Post-surf mobility', transition: 10,
    steps: [
      { name: 'Doorway chest stretch', secs: 60, cue: 'Most important one' },
      { name: 'Lat stretch, overhead reach', secs: 45, sides: true },
      { name: 'Low lunge with rotation', secs: 45, sides: true },
      { name: 'Seated spinal twist', secs: 45, sides: true },
      { name: 'Figure-four glute stretch', secs: 60, sides: true },
      { name: 'Neck side stretch', secs: 30, sides: true },
      { name: "Child's pose, arms to one side", secs: 30, sides: true },
    ],
  },
  dailyMobility: {
    name: 'Daily 10-min mobility (travel)', transition: 10,
    steps: [
      { name: 'Cat-cow', secs: 40, cue: '10 reps' },
      { name: 'Hip flexor stretch', secs: 45, sides: true },
      { name: 'Straddle sit', secs: 90 },
      { name: 'Standing wide good mornings', secs: 45, cue: '10 reps' },
      { name: 'Puppy pose', secs: 45 },
      { name: 'Glute bridge, arms overhead', secs: 45 },
      { name: "Child's pose", secs: 60 },
      { name: 'Left ankle balance', secs: 45, cue: 'Shoes off, weight to the outer foot, arch lifted' },
    ],
  },
};

// Interval circuits: work/rest x exercises x rounds.
export const CIRCUITS = {
  travel: {
    name: 'Travel circuit',
    work: 40, rest: 20, rounds: 3, roundRest: 60, prep: 10,
    note: 'Alternate legs or sides each round where marked.',
    exercises: [
      'Single-leg glute bridge, left',
      'Single-leg glute bridge, right',
      'Bulgarian split squat on a bed or chair (alternate legs)',
      'Push-ups',
      'Side-lying leg raise (alternate sides)',
      'Reverse lunge',
      'Prone Y-T-W',
      'Plank',
      'Copenhagen reps on a bed (alternate sides)',
    ],
  },
};

// ---------- Activities (things that aren't a gym session) ----------
export const ACTIVITIES = {
  cardioMon: { name: 'Soccer or easy run', icon: 'run', time: 'Evening', detail: 'Soccer if it\'s on, otherwise a 30–40 min easy run you can talk through.', cooldown: 'cooldownRun', cardio: true },
  gluteA: { name: 'Glute A', icon: 'glute', time: 'Daytime', session: 'gluteA' },
  gluteB: { name: 'Glute B', icon: 'glute', time: 'Daytime', session: 'gluteB' },
  upper: { name: 'Upper body · calisthenics', icon: 'upper', time: 'Daytime', session: 'upper' },
  boulder: { name: 'Bouldering', icon: 'climb', time: 'Evening', detail: 'Portside O\'Connor with friends. Climb down rather than jumping off.', cooldown: 'cooldownClimb' },
  yoga: { name: 'Yin & Yang yoga + 15 min flexibility', icon: 'yoga', time: '8:30 or 10am', detail: 'Portside O\'Connor. Then the 15-min pancake, bridge and handstand block.', routine: 'flex15' },
  cardioSat: { name: 'Run, coastal walk or swim', icon: 'run', time: 'Any time', detail: '40–50 min, easy pace.', cooldown: 'cooldownRun', cardio: true },
  flexFull: { name: 'Flexibility session (full)', icon: 'yoga', time: 'Any time', detail: 'The 35–40 min solo session, since yoga was missed.', routine: 'flexFull' },
  surf: { name: 'Surf', icon: 'surf', time: 'When it\'s good', detail: 'Mineral SPF 50 before and after. Rinse face with fresh water after.', pre: 'surfPre', cooldown: 'surfPost', cardio: true },
  rest: { name: 'Rest day', icon: 'rest', time: '', detail: 'Easy steps. Real rest.' },
  circuit: { name: 'Travel circuit', icon: 'upper', time: 'Any time', detail: '30 min, no equipment.', circuit: 'travel' },
  mobility: { name: 'Daily 10-min mobility', icon: 'yoga', time: 'Any time', routine: 'dailyMobility' },
};

export const DEFAULT_WEEK = [
  ['cardioMon'],            // Mon
  ['gluteA'],               // Tue
  ['boulder'],              // Wed
  ['upper'],                // Thu
  ['gluteB'],               // Fri
  ['yoga', 'cardioSat'],    // Sat
  ['rest'],                 // Sun
];

export const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const DAY_LONG = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const DROP_ORDER = ['Saturday flexibility block', 'Yoga class', 'Upper body', 'Glute B'];

// ---------- Skincare ----------
export const SKIN_AM = [
  'Cleanser',
  'Hyaluronic acid on damp skin',
  'Niacinamide',
  'Moisturiser',
  'SPF (Badger daily · mineral SPF 50 on surf/beach days)',
];

export const SKIN_PM = {
  normal: { label: 'Normal night', steps: ['Cleanse (micellar first after surf or heavy SPF)', 'Hyaluronic acid', 'Moisturiser'] },
  retinol: { label: 'Retinol night', steps: ['Cleanse', 'Wait until skin is fully dry', 'Thin layer of moisturiser first (weeks 1–4)', 'Pea-sized retinol 0.2%', 'Moisturiser'] },
  retinolNoBuffer: { label: 'Retinol night', steps: ['Cleanse', 'Wait until skin is fully dry', 'Pea-sized retinol 0.2%', 'Moisturiser'] },
  mask: { label: 'Mask night', steps: ['Cleanse', 'Face mask (clay 10 min or sheet 15–20 min)', 'Hyaluronic acid', 'Moisturiser'] },
  maskOrGlycolic: { label: 'Mask or glycolic', steps: ['Cleanse', 'EITHER face mask OR glycolic acid 7% — not both', 'Hyaluronic acid (skip if glycolic)', 'Moisturiser'] },
};

// ---------- Daily ticks ----------
export const DAILY_TICKS = [
  { id: 'choc', label: '25 g dark chocolate', always: true },
  { id: 'ankle', label: 'Left ankle balance 30–60 s' },
  { id: 'water', label: '2.5–3 L water' },
  { id: 'supps', label: 'Creatine, omega-3, multivitamin' },
  { id: 'protein', label: 'Protein 140–150 g' },
  { id: 'sleep', label: '7–9 h sleep' },
];
export const WEEKLY_TICKS = {
  2: [{ id: 'massage', label: 'Massage stick, outer left calf' }],
  6: [
    { id: 'massage', label: 'Massage stick, outer left calf' },
    { id: 'pillow', label: 'Change pillowcase' },
    { id: 'prep', label: 'Meal prep' },
    { id: 'planweek', label: 'Plan the week (surf forecast, date night)' },
  ],
};

// ---------- Food ----------
export const FOOD_PRESETS = [
  { group: 'Breakfast', items: [
    { name: 'Oats + protein + banana + PB', kcal: 500, p: 35 },
    { name: 'Eggs + whites on toast + fruit', kcal: 480, p: 30 },
    { name: 'Greek yogurt bowl', kcal: 480, p: 35 },
  ]},
  { group: 'Shake & snacks', items: [
    { name: 'Protein shake', kcal: 200, p: 25 },
    { name: 'Half shake', kcal: 100, p: 12 },
    { name: 'Greek yogurt + berries', kcal: 180, p: 18 },
    { name: 'Cottage cheese on rice cakes', kcal: 200, p: 18 },
    { name: 'Cup of edamame', kcal: 190, p: 17 },
    { name: '2 boiled eggs', kcal: 150, p: 12 },
    { name: 'Banana + toast (pre-surf)', kcal: 250, p: 6 },
  ]},
  { group: 'Lunch', items: [
    { name: 'Tofu wrap (200 g tofu, cheese)', kcal: 600, p: 40 },
    { name: 'Tuna wrap or rice bowl', kcal: 580, p: 45 },
    { name: 'Burrito bowl', kcal: 620, p: 38 },
  ]},
  { group: 'Dinner', items: [
    { name: 'Tofu/tempeh stir-fry', kcal: 600, p: 35 },
    { name: 'Lentil bolognese + pasta', kcal: 600, p: 35 },
    { name: 'Egg fried rice + edamame', kcal: 580, p: 30 },
    { name: 'Chickpea/lentil curry + rice', kcal: 620, p: 30 },
    { name: 'Chicken or fish + potato + veg', kcal: 600, p: 40 },
  ]},
  { group: 'Treat', items: [
    { name: 'Dark chocolate 25 g', kcal: 160, p: 2 },
  ]},
  { group: 'Drinks', items: [
    { name: 'Non-alcoholic beer', kcal: 65, p: 0 },
    { name: 'Wine spritzer', kcal: 75, p: 0 },
    { name: 'Mid-strength beer (schooner)', kcal: 115, p: 1 },
    { name: 'Glass of wine', kcal: 125, p: 0 },
    { name: 'Regular beer (schooner)', kcal: 170, p: 1 },
    { name: 'Regular beer (pint)', kcal: 230, p: 2 },
    { name: 'Cocktail', kcal: 275, p: 0 },
  ]},
  { group: 'Out & takeaway', items: [
    { name: 'Burrito bowl (takeaway)', kcal: 750, p: 38 },
    { name: 'Poke bowl', kcal: 650, p: 32 },
    { name: 'Sushi (8 pieces)', kcal: 450, p: 18 },
    { name: 'Falafel plate + hummus', kcal: 800, p: 25 },
    { name: 'Grilled chicken + salad/corn', kcal: 600, p: 45 },
    { name: 'Restaurant main', kcal: 850, p: 35 },
    { name: 'Pizza (half large)', kcal: 1100, p: 45 },
    { name: 'HSP', kcal: 1500, p: 60 },
    { name: 'Burger + chips', kcal: 1300, p: 40 },
  ]},
];

export const SOCIAL_RULES = [
  'Eat protein first. Going out hungry is how late-night takeaway happens.',
  'Water between every drink — that\'s your speed limit.',
  'First drink is the treat, then mid-strength or spritzers.',
  'Decide a number before you go. About 4–5 drinks fits the allowance.',
  'One big social night per weekend. The other day stays on plan.',
  'Next day: normal plan. No starving to make up for it.',
];

export const MEAL_OPTIONS = [
  ['Breakfast', 'A: Oats + protein powder + banana + peanut butter + cinnamon (35 g)', 'B: 2 eggs + 3 whites on wholemeal toast + fruit (30 g)', 'C: 200 g Greek yogurt + ½ scoop protein + ½ cup oats + berries (35 g)'],
  ['Lunch', 'A: Tofu wrap — 1 large wrap, 200 g firm tofu, 25 g cheese, salad, yogurt sauce (40 g)', 'B: 2 cans tuna in a wrap or rice bowl (45 g)', 'C: Burrito bowl — chicken or tofu + black beans + rice + salsa + yogurt (35–40 g)'],
  ['Dinner', 'A: Tofu or tempeh stir-fry with rice/noodles + edamame (35 g)', 'B: Lentil bolognese + wholemeal pasta + parmesan (35 g)', 'C: Egg fried rice — 3 eggs + edamame + veg (30 g)', 'D: Chickpea or lentil curry + rice + yogurt (30 g)', 'E: Chicken or fish + sweet potato + veg (40 g)'],
];

export const SHOPPING = [
  ['Protein', ['3 blocks firm tofu', '1 tempeh', '30 eggs', '4 cans tuna in water', '1 kg plain Greek yogurt', '500 g cottage cheese', 'Protein powder', 'Chicken or fish on special']],
  ['Legumes', ['3–4 cans lentils', '2 cans black beans', '1–2 cans chickpeas', '1 kg frozen edamame']],
  ['Carbs', ['1 kg rolled oats', '2 kg rice', 'Wholemeal wraps × 2 packs', '500 g wholemeal pasta', '1 loaf wholemeal bread', '1–2 kg sweet potato or potatoes']],
  ['Fruit', ['10–12 bananas', '1 kg frozen mixed berries']],
  ['Veg', ['2 kg frozen broccoli', '1 kg frozen mixed veg', '1 kg frozen stir-fry veg', 'Salad leaves', 'Tomatoes', '2 jars passata']],
  ['Dairy', ['500 g cheese block', 'Small parmesan']],
  ['Pantry', ['Peanut butter', 'Olive oil', 'Low-sodium soy sauce', 'Sriracha', 'Salsa', 'Curry paste', 'Garlic powder', 'Paprika', 'Cinnamon', 'Rice cakes']],
  ['Treat', ['175 g dark chocolate (70%+)']],
];

// ---------- Free timer presets ----------
export const TIMER_PRESETS = [
  { n: 'Tabata', d: '20s / 10s × 8', c: { prep: 10, work: 20, rest: 10, rounds: 8, sets: 1, setrest: 60 } },
  { n: 'Full body circuit', d: '45s / 15s × 12, 3 sets', c: { prep: 15, work: 45, rest: 15, rounds: 12, sets: 3, setrest: 60 } },
  { n: 'Core finisher', d: '40s / 20s × 6', c: { prep: 10, work: 40, rest: 20, rounds: 6, sets: 1, setrest: 60 } },
  { n: 'Glute burnout', d: '50s / 10s × 10', c: { prep: 15, work: 50, rest: 10, rounds: 10, sets: 1, setrest: 60 } },
  { n: 'Long holds', d: '2 min × 8', c: { prep: 10, work: 120, rest: 10, rounds: 8, sets: 1, setrest: 0 } },
  { n: 'Climbing hangs', d: '10s / 50s × 6, 3 sets', c: { prep: 15, work: 10, rest: 50, rounds: 6, sets: 3, setrest: 120 } },
];
