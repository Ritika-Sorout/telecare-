/**
 * simulate-clinic-day.js — FIFO vs triage evaluation for the TeleCare PPT.
 *
 * Discrete-event simulation of one 8-hour clinic day with a single doctor and
 * fixed 8-minute consultations (matches AVG_CONSULT_MIN in server.js).
 * Imports scoreIntake / compareEntries from the REAL triage.js so the
 * evaluation runs the project's actual scoring code, not a copy.
 *
 * Run: node simulate-clinic-day.js
 */

const { scoreIntake, compareEntries } = require('../triage.js');

// ---------- parameters (all tunable, reported in the table footer) ----------
const CONSULT_MIN = 8;    // matches server.js AVG_CONSULT_MIN
const CLINIC_MIN = 480;   // 8-hour clinic day
const N_PATIENTS = parseInt(process.env.N || "48", 10);    // ~6 bookings/hour
const SEED = parseInt(process.env.SEED || "20261019", 10);

// ---------- deterministic RNG (reproducible day) ----------
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(SEED);
const pick = (arr) => arr[Math.floor(rand() * arr.length)];

// ---------- synthetic intakes: routine / moderate / urgent mix ----------
function genIntake(i) {
  const r = rand();
  let symptoms, age, comorbidities, durationHours;
  if (r < 0.15) {                                   // ~15%: urgent red flags
    symptoms = [pick(['chest-pain', 'difficulty-breathing', 'severe-bleeding', 'high-fever'])];
    if (rand() < 0.3) symptoms.push(pick(['dizziness', 'body-ache', 'fatigue']));
    age = 20 + Math.floor(rand() * 70);
    comorbidities = rand() < 0.4 ? [pick(['diabetes', 'hypertension', 'asthma'])] : [];
    durationHours = rand() < 0.6 ? 1 + Math.floor(rand() * 5) : 12 + Math.floor(rand() * 36);
  } else if (r < 0.32) {                            // ~17%: moderately urgent
    symptoms = [pick(['persistent-vomiting', 'severe-headache', 'dizziness', 'abdominal-pain', 'high-fever'])];
    if (rand() < 0.25) symptoms.push(pick(['cough', 'fatigue']));
    age = 20 + Math.floor(rand() * 60);
    comorbidities = rand() < 0.25 ? [pick(['diabetes', 'hypertension'])] : [];
    durationHours = 6 + Math.floor(rand() * 48);
  } else {                                          // ~68%: routine
    symptoms = [pick(['follow-up', 'general-checkup', 'fatigue', 'body-ache', 'cough', 'rash'])];
    if (rand() < 0.2) symptoms.push(pick(['fatigue', 'body-ache', 'cough']));
    age = 20 + Math.floor(rand() * 60);
    comorbidities = rand() < 0.15 ? [pick(['diabetes', 'hypertension'])] : [];
    durationHours = 24 + Math.floor(rand() * 96);
  }
  return { symptoms, age, comorbidities, durationHours };
}

const patients = [];
for (let i = 0; i < N_PATIENTS; i++) {
  const intake = genIntake(i);
  const { score, tier } = scoreIntake(intake);      // <-- the real triage.js
  patients.push({
    id: 'P' + String(i + 1).padStart(3, '0'),
    arrivedAt: Math.round(rand() * CLINIC_MIN * 100) / 100,
    score, tier,
    joinedAt: 0,                                     // set per-run below
  });
}

// ---------- discrete-event run ----------
// strategy: 'fifo' keeps waiting list in arrival order;
// 'triage' re-sorts the waiting list with compareEntries before every pick,
// exactly what server.js does (re-sort on every booking).
function run(strategy) {
  const arrivals = [...patients].sort((a, b) => a.arrivedAt - b.arrivedAt)
    .map(p => ({ ...p, joinedAt: p.arrivedAt }));    // joinedAt = arrival for fairness tiebreak
  const waiting = [];
  const seen = [];
  let doctorFreeAt = 0, ai = 0;

  while (seen.length < arrivals.length) {
    // admit everyone who arrived while the doctor was busy
    while (ai < arrivals.length && arrivals[ai].arrivedAt <= doctorFreeAt) waiting.push(arrivals[ai++]);
    if (waiting.length === 0) {
      // nobody waiting: doctor idles until the next arrival
      const nxt = arrivals[ai++];
      waiting.push(nxt);
      doctorFreeAt = nxt.arrivedAt;
    }

    if (strategy === 'triage') waiting.sort(compareEntries);
    const next = waiting.shift();

    const start = Math.max(next.arrivedAt, doctorFreeAt);
    seen.push({ ...next, wait: start - next.arrivedAt });
    doctorFreeAt = start + CONSULT_MIN;
  }
  return seen;
}

// ---------- metrics ----------
function summarize(seen) {
  const byTier = {};
  for (const p of seen) {
    (byTier[p.tier] ||= []).push(p.wait);
  }
  const avg = (a) => a.reduce((s, x) => s + x, 0) / a.length;
  const urgent = [...(byTier.critical || []), ...(byTier.high || [])];
  return {
    tiers: Object.fromEntries(Object.entries(byTier).map(([k, v]) => [k, { n: v.length, avg: avg(v), max: Math.max(...v) }])),
    overallAvg: avg(seen.map(p => p.wait)),
    urgentAvg: urgent.length ? avg(urgent) : 0,
    urgentMax: urgent.length ? Math.max(...urgent) : 0,
    urgentOver30: urgent.filter(w => w > 30).length,
    urgentN: urgent.length,
  };
}

const fifo = summarize(run('fifo'));
const triage = summarize(run('triage'));

const fmt = (x) => x.toFixed(1);
console.log('TeleCare — clinic-day evaluation (seeded, reproducible)');
console.log(`Day: ${N_PATIENTS} patients / ${CLINIC_MIN / 60}h, 1 doctor, ${CONSULT_MIN}-min consults, seed ${SEED}\n`);
console.log('metric                      | FIFO   | triage | delta');
console.log('----------------------------+--------+--------+-------');
const rows = [
  ['avg wait, all (min)', fifo.overallAvg, triage.overallAvg],
  ['avg wait, URGENT (min)', fifo.urgentAvg, triage.urgentAvg],
  ['max wait, URGENT (min)', fifo.urgentMax, triage.urgentMax],
  [`urgent waits > 30 min`, fifo.urgentOver30, triage.urgentOver30],
];
for (const [label, a, b] of rows) {
  console.log(`${label.padEnd(27)} | ${fmt(a).padStart(6)} | ${fmt(b).padStart(6)} | ${fmt(a - b).padStart(6)}`);
}
console.log('\nper-tier avg wait (min):');
for (const t of ['critical', 'high', 'medium', 'low']) {
  const f = fifo.tiers[t], tr = triage.tiers[t];
  if (!f) continue;
  console.log(`  ${t.padEnd(8)} n=${String(f.n).padStart(2)}   FIFO ${fmt(f.avg).padStart(6)}   triage ${fmt(tr.avg).padStart(6)}`);
}
console.log(`\nutilization: identical under both orderings (${N_PATIENTS * CONSULT_MIN}/${CLINIC_MIN} min busy = ${(100 * N_PATIENTS * CONSULT_MIN / CLINIC_MIN).toFixed(1)}%) — ordering redistributes waits, it does not change workload.`);
