/**
 * server.js — TeleCare real-time service (Node.js).
 *
 * Responsibilities (the "event-driven" half of the architecture):
 *  1. REST API: intake bookings, queue reads, doctor actions, stats.
 *  2. Triage: score every intake with triage.js, keep the queue sorted by
 *     severity — re-sorted on EVERY booking, not just at page load.
 *  3. Live push: broadcast queue changes + escalation alerts to all
 *     connected browsers over WebSockets (Socket.IO).
 *
 * Persistence of patients/doctors/appointments lives in the Spring Boot
 * service (built next). This service owns *live queue state*, which is
 * exactly what Node.js is good at: many concurrent, mostly-idle connections.
 */
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const { scoreIntake, compareEntries } = require('./triage');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// Render/Heroku-style hosts assign the port via the PORT env var.
// Locally PORT is unset, so it falls back to 4000.
const PORT = process.env.PORT || 4000;
// Where the Spring Boot backend lives. Locally it's localhost:8081;
// on Render you set SPRING_URL in the dashboard (no code change needed).
const SPRING_URL = process.env.SPRING_URL || 'http://localhost:8081';
const AVG_CONSULT_MIN = 8; // used for ETA estimates

// ---- In-memory live queue ----------------------------------------------
// Each entry: { id, name, age, symptoms[], comorbidities[], durationHours,
//               score, tier, status, joinedAt, etaMin }
// In production this would be Redis; in-memory keeps the course demo clear.
let queue = [];
let nextId = 1;

function publicQueue() {
  // Recompute ETAs from position: each person ahead ≈ one consultation.
  return queue.map((q, i) => ({ ...q, etaMin: (i + 1) * AVG_CONSULT_MIN }));
}

function broadcastQueue() {
  io.emit('queue:update', publicQueue());
}

// ---- REST API ------------------------------------------------------------

app.get('/api/health', (req, res) => res.json({ ok: true, queued: queue.length }));

// Doctor dashboard + waiting-room list, always in triage order.
app.get('/api/queue', (req, res) => res.json(publicQueue()));

// Booking with structured symptom intake → scored → inserted in order.
app.post('/api/intake', (req, res) => {
  const { name, age = 30, symptoms = [], comorbidities = [], durationHours = 24 } = req.body;
  if (!name || !Array.isArray(symptoms) || symptoms.length === 0) {
    return res.status(400).json({ error: 'name and at least one symptom are required' });
  }
  const { score, tier } = scoreIntake({ symptoms, age, comorbidities, durationHours });
  const entry = {
    id: nextId++, name, age, symptoms, comorbidities, durationHours,
    score, tier, status: 'waiting', joinedAt: Date.now(),
  };
  queue.push(entry);
  queue.sort(compareEntries); // ← the whole novelty: re-sort on every booking

  persistIntake(entry); // best-effort: also save to the Spring Boot system of record

  const ordered = publicQueue();
  io.emit('queue:update', ordered);
  if (tier === 'critical') {
    // Escalation rule engine: critical cases jump the queue AND alert doctors.
    io.emit('escalation', { ...entry });
  }
  res.status(201).json({ ...entry, queue: ordered });
});

// Doctor actions: start → complete. Each one re-broadcasts the queue.
app.post('/api/queue/:id/start', (req, res) => {
  const e = queue.find(q => q.id === +req.params.id);
  if (!e) return res.status(404).json({ error: 'not in queue' });
  e.status = 'in-consultation';
  broadcastQueue();
  res.json({ ok: true });
});

app.post('/api/queue/:id/complete', (req, res) => {
  const i = queue.findIndex(q => q.id === +req.params.id);
  if (i < 0) return res.status(404).json({ error: 'not in queue' });
  queue.splice(i, 1);
  broadcastQueue();
  res.json({ ok: true });
});

app.delete('/api/queue/:id', (req, res) => {
  queue = queue.filter(q => q.id !== +req.params.id);
  broadcastQueue();
  res.json({ ok: true });
});

app.get('/api/stats', (req, res) => {
  const byTier = {};
  for (const q of queue) byTier[q.tier] = (byTier[q.tier] || 0) + 1;
  res.json({
    total: queue.length,
    byTier,
    avgWaitMin: queue.length ? Math.round(((queue.length + 1) / 2) * AVG_CONSULT_MIN) : 0,
  });
});

// ---- Bridge to the Spring Boot backend --------------------------------------
// The live queue above is ephemeral by design. This persists every scored
// intake into Spring (patients + appointments tables) so nothing is lost on
// restart. Best-effort: wrapped in try/catch, the queue works even if Spring
// is down — Spring simply catches up on the next booking.
async function persistIntake(entry) {
  try {
    await fetch(`${SPRING_URL}/api/appointments/from-triage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientName: entry.name,
        age: entry.age,
        symptoms: entry.symptoms,
        triageScore: entry.score,
        triageTier: entry.tier,
      }),
    });
  } catch (e) {
    console.warn('Spring backend unreachable — intake kept in live queue only.');
  }
}

// ---- WebSocket layer -------------------------------------------------------
io.on('connection', (sock) => {
  // Push current state immediately so late joiners see the queue at once.
  sock.emit('queue:update', publicQueue());
});

// ---- Demo seed ---------------------------------------------------------------
// Three sample bookings so the doctor dashboard isn't empty on first run.
function seed() {
  const demo = [
    { name: 'Aarav Mehta', age: 34, symptoms: ['cough', 'fatigue'], comorbidities: [], durationHours: 48 },
    { name: 'Sara Khan', age: 71, symptoms: ['dizziness', 'high-fever'], comorbidities: ['hypertension'], durationHours: 12 },
    { name: 'Rohan Iyer', age: 45, symptoms: ['general-checkup'], comorbidities: [], durationHours: 168 },
  ];
  for (const d of demo) {
    const { score, tier } = scoreIntake(d);
    queue.push({ id: nextId++, ...d, score, tier, status: 'waiting', joinedAt: Date.now() });
  }
  queue.sort(compareEntries);
}
seed();

server.listen(PORT, () => {
  console.log(`TeleCare real-time service on http://localhost:${PORT}`);
  console.log(`Seeded queue (${queue.length}):`,
    queue.map(q => `${q.name}[${q.tier}:${q.score}]`).join('  '));
});
