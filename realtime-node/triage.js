/**
 * triage.js — the "smart" in smart triage.
 *
 * Every booking carries structured symptom data. This module turns it into a
 * severity score and a priority tier, which the server uses to ORDER the queue.
 * Novelty of the project: the queue is sorted by medical urgency, not arrival.
 *
 * Scoring model (demo scale, clinician-inspired):
 *   score = (sum of symptom weights) × (risk multipliers)
 *
 * Risk multipliers: age extremes, comorbidity count, sudden onset of a
 * severe symptom. Each is deliberately small so no single factor dominates.
 */

// Clinical severity weight per symptom key (0–10).
const SYMPTOM_WEIGHTS = {
  'severe-bleeding': 10,
  'chest-pain': 9,
  'difficulty-breathing': 9,
  'high-fever': 7,
  'persistent-vomiting': 6,
  'severe-headache': 6,
  'dizziness': 5,
  'abdominal-pain': 5,
  'rash': 3,
  'cough': 3,
  'body-ache': 2,
  'fatigue': 2,
  'follow-up': 1,
  'general-checkup': 1,
};

// Score bands → priority tiers shown as badges in the UI.
function tierFor(score) {
  if (score >= 12) return 'critical';
  if (score >= 7) return 'high';
  if (score >= 4) return 'medium';
  return 'low';
}

function scoreIntake({ symptoms = [], age = 30, comorbidities = [], durationHours = 24 }) {
  const base = symptoms.reduce((sum, key) => sum + (SYMPTOM_WEIGHTS[key] ?? 1), 0);

  let multiplier = 1.0;
  if (age >= 65 || age <= 5) multiplier += 0.3;                    // age extremes
  multiplier += Math.min(comorbidities.length * 0.15, 0.45);       // capped comorbidity load
  if (durationHours <= 6 && base >= 8) multiplier += 0.2;          // sudden + severe onset

  const score = Math.round(base * multiplier * 10) / 10;
  return { score, tier: tierFor(score) };
}

// Comparator: tier first, then score, then arrival time (FIFO within a tier).
const TIER_RANK = { critical: 0, high: 1, medium: 2, low: 3 };
function compareEntries(a, b) {
  return TIER_RANK[a.tier] - TIER_RANK[b.tier] || b.score - a.score || a.joinedAt - b.joinedAt;
}

module.exports = { scoreIntake, tierFor, compareEntries, SYMPTOM_WEIGHTS };
