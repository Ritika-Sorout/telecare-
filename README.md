# TeleCare — Telemedicine Appointment & Smart Triage Platform

A polyglot microservices project for the **Advanced Server Side Programming** course.

## Architecture

```
                    ┌─────────────────────────────────┐
                    │   Frontend (HTML/CSS/JS, AJAX)  │
                    │  patient.html · doctor.html     │
                    └────────┬────────────┬──────────┘
                             │ REST/AJAX  │ WebSocket
                ┌────────────▼───┐   ┌─────▼──────────────┐
                │  Spring Boot   │   │  Node.js service   │
                │  :8080         │   │  :4000             │
                │  patients,     │   │  live queue,       │
                │  doctors,      │   │  triage scoring,   │
                │  appointments, │   │  waiting room,     │
                │  prescriptions │   │  reminders         │
                │  (Hibernate    │   │  (in-memory +      │
                │   ORM → MySQL) │   │   Socket.IO)       │
                └────────────────┘   └────────────────────┘
```

* **Spring Boot** owns transactional domain data (Module 4, 5).
* **Node.js** owns real-time state: the live triage queue, WebSocket pushes,
  reminders (Module 3).
* **Frontend** is one minimal UI talking to both via AJAX + WebSockets
  (Module 1, 6).
* Both backends expose **RESTful APIs** (Module 2).

## The triage idea

Booking is not first-come-first-served. On intake, `triage.js` computes a
severity score from symptom weights × risk multipliers (age, comorbidities,
sudden onset). The queue is re-sorted on every booking; critical scores
trigger instant escalation. This is the project's novelty.

## Run it

```bash
# Terminal 1 — real-time service
cd realtime-node && npm install && npm start      # → http://localhost:4000

# Terminal 2 — frontend (any static server)
cd frontend && npx serve .                        # → http://localhost:3000
# open patient.html to book, doctor.html to run the clinic

# Terminal 3 — Spring Boot (persistence layer, built next)
cd backend-spring && ./mvnw spring-boot:run       # → http://localhost:8080
```

## Layout

| Path             | What lives here                                      |
|------------------|------------------------------------------------------|
| `frontend/`      | Minimal interactive UI (landing, patient, doctor)    |
| `realtime-node/` | Express + Socket.IO service, triage engine          |
| `backend-spring/`| Spring Boot REST API + Hibernate ORM (+ Dockerfile) |

## Deploying to Render (free tier)

All service-to-service URLs are env-configurable, so nothing is hardcoded
to localhost anymore:

| Piece | Render type | Key setting |
|-------|-------------|-------------|
| `realtime-node/` | Web Service (Node) | Root dir `realtime-node`; env `SPRING_URL` = Spring's public URL |
| `backend-spring/` | Web Service (Docker) | Root dir `backend-spring`; uses `Dockerfile` |
| `frontend/` | Static Site | Publish dir `frontend`; then set `API` in `js/app.js` to the Node URL and redeploy |

Push the repo to GitHub first; Render deploys from there. Free-tier services
sleep after ~15 min idle (first request takes ~30–60s to wake), and H2 is
in-memory so data resets on restart — fine for a demo, not for production.
