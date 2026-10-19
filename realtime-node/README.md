# TeleCare real-time service (Node.js)

Event-driven half of the architecture: live triage queue, WebSocket pushes,
reminders. Runs on **http://localhost:4000**.

## Run

```bash
npm install
npm start
```

## REST API

| Method | Path                  | What it does                                      |
|--------|-----------------------|---------------------------------------------------|
| GET    | `/api/health`         | Liveness check                                    |
| GET    | `/api/queue`          | Queue in triage order, with ETA per entry         |
| POST   | `/api/intake`         | Book: scores intake, inserts in sorted position   |
| POST   | `/api/queue/:id/start`| Doctor starts consultation                        |
| POST   | `/api/queue/:id/complete` | Doctor completes, entry leaves queue          |
| DELETE | `/api/queue/:id`      | Patient leaves the queue                          |
| GET    | `/api/stats`          | Counts per tier + average wait                    |

## WebSocket events (Socket.IO)

| Event            | Direction       | Payload                        |
|------------------|-----------------|--------------------------------|
| `queue:update`   | server → all    | Full queue in triage order      |
| `escalation`     | server → all    | The critical entry, on booking |

## Files

- `server.js` — Express + Socket.IO, queue state, all endpoints above.
- `triage.js` — severity scoring: `score = Σ symptom weights × risk multipliers`
  (age extremes, comorbidity load, sudden severe onset); tier bands
  critical ≥ 12, high ≥ 7, medium ≥ 4, else low. Queue comparator sorts by
  tier → score → arrival time.

## Try it

```bash
# book a critical case and watch the doctor dashboard re-sort live
curl -X POST localhost:4000/api/intake -H 'Content-Type: application/json' \
  -d '{"name":"Test Patient","age":70,"symptoms":["chest-pain"],"comorbidities":["heart-disease"],"durationHours":2}'
```
