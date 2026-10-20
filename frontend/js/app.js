/* TeleCare shared helpers — API base, socket, small render utils. */
// ★ AFTER DEPLOYING: replace the line below with your public API URL,
//    e.g. const API = 'https://telecare-api.onrender.com';
//    then redeploy the frontend. Local development keeps working untouched.
const API = 'http://localhost:4000';
const socket = io(API);

// Symptom catalogue shown as tappable chips on the intake form.
// Keys must match the weights table in realtime-node/triage.js.
const SYMPTOMS = [
  ['chest-pain', 'Chest pain'], ['difficulty-breathing', 'Difficulty breathing'],
  ['severe-bleeding', 'Severe bleeding'], ['high-fever', 'High fever'],
  ['persistent-vomiting', 'Persistent vomiting'], ['severe-headache', 'Severe headache'],
  ['dizziness', 'Dizziness'], ['abdominal-pain', 'Abdominal pain'],
  ['rash', 'Rash'], ['cough', 'Cough & cold'], ['body-ache', 'Body ache'],
  ['fatigue', 'Fatigue'], ['follow-up', 'Follow-up visit'], ['general-checkup', 'General checkup'],
];

const TIER_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };

function tierBadge(tier) {
  return `<span class="badge ${tier}">${tier}</span>`;
}

// Minimal HTML escaping for user-supplied names.
function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

async function api(path, opts = {}) {
  const res = await fetch(API + path, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  if (!res.ok) throw new Error('Request failed: ' + res.status);
  return res.json();
}

function symptomLabel(key) {
  const hit = SYMPTOMS.find(([k]) => k === key);
  return hit ? hit[1] : key;
}
