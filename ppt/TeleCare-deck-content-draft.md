# TeleCare — Final Review PPT: slide content draft (working file, not the deliverable)

Follows the official format doc exactly: 14 slides. Slide text is submission-clean;
render to PPTX on her go-ahead. Placeholders marked [FILL]. All facts verified 2026-10-19.

---

## Slide 1 — Title
- **TeleCare — Telemedicine Appointment & Smart Triage Platform**
- Advanced Server Side Programming — Final Project Review
- Team: ritika Priyadarshni — 22MIC0018 [FILL: add teammates if any]
- Department: [FILL — e.g. School of Computer Science and Engineering, VIT]
- Guide: [FILL — name & designation]
- Date: [FILL]

*Speaker note: one line — "a telemedicine booking platform whose queue reorders itself by clinical urgency."*

## Slide 2 — Introduction
- Telemedicine visits grew sharply post-2020, but most booking systems are still
  flat first-come-first-served queues.
- TeleCare is a polyglot web platform: Spring Boot owns the clinical domain
  (patients, appointments, prescriptions) with Hibernate ORM; Node.js owns the
  live virtual waiting room and real-time updates; one AJAX frontend serves both.
- Significance: the queue is ordered by a server-side triage score computed from
  structured symptom intake — urgent cases surface first, automatically.

## Slide 3 — Problem Statement
- Clinic and telemedicine booking systems use flat chronological queues: a routine
  follow-up waits exactly the same as a patient with chest pain or high fever.
- Consequences: dangerous delays for urgent cases; doctors get no pre-visit
  severity signal; no-shows waste limited slots; patients have no live view of
  their queue position.
- Real-world relevance: teleconsultations lack the in-person triage desk, so
  severity must be assessed at booking time, by software.

## Slide 4 — Existing System
- Practo, Zocdoc, Doctolib, OpenMRS: all schedule appointments, all treat the
  queue as chronological — none reorder by clinical urgency.
- Clinical triage standards (e.g. Manchester Triage System) target in-person
  emergency departments with trained staff, not automated intake for teleconsultations.
- Research gap: no open telemedicine platform combines automated symptom-based
  queue reordering with a real-time waiting room.

## Slide 5 — Proposed System
- A patient books through a minimal intake form (symptoms as chips, risk factors
  as checkboxes); the Node.js triage engine scores the intake and inserts the
  patient into a live queue already sorted by severity.
- The doctor dashboard shows the severity-sorted queue with Start/Complete
  actions; critical bookings fire an instant escalation banner via WebSocket.
- Every scored intake is also persisted by the Spring Boot backend (Hibernate ORM)
  as Patient + Appointment rows — the live queue is ephemeral, the record is permanent.

## Slide 6 — Objectives (specific, measurable)
1. Build a Spring Boot backend exposing RESTful APIs for patient/doctor
   registration, appointment booking, and prescription management, persisted via Hibernate ORM.
2. Build a Node.js real-time service for the live virtual waiting room
   (WebSocket/AJAX updates) and appointment notifications.
3. Implement a server-side triage scoring algorithm assigning every appointment a
   severity score from symptom intake and dynamically reordering the queue.
4. Create responsive AJAX-driven UIs for patients (booking, intake, live queue
   position) and doctors (prioritized list, pre-visit severity summary).
5. Evaluate the triage queue against baseline FIFO on simulated clinic load:
   measure urgent-case wait time and slot utilization.

## Slide 7 — Literature Review
- Appointment-scheduling research studies tiered (routine vs urgent) scheduling
  under stochastic service times — the precedent our FIFO-vs-triage evaluation
  is measured against (Li et al., IEEE TASE 2025).
- Online/offline scheduling uncertainty models match the telemedicine setting
  (Shen et al., IEEE TASE 2024).
- Automated triage scoring has clinical precedent; interpretable scoring designs
  are preferred over black-box models (Leung et al., IEEE SMC 2021) — which is
  why our scorer is a weighted, explainable formula, not a learned model.
- Standards baseline: Manchester Triage (Mackway-Jones et al.), HL7 FHIR for the
  data model, Fowler's enterprise patterns for the Spring/ORM layer.

## Slide 8 — Novelty and Contributions
- The novelty is algorithmic, not a stack swap:
  1. Dynamic, score-driven queue reordering computed server-side from structured
     symptom intake — existing platforms don't do this.
  2. A rule engine converting critical scores into real-time escalation actions
     (immediate-slot offer + doctor alert).
  3. A deliberate polyglot split: Spring Boot for transactional domain logic,
     Node.js for event-driven real-time load — each used for what it's best at.
- Contribution: an open, interpretable triage formula (weights + risk
  multipliers) whose every score can be explained to a clinician.

## Slide 9 — System Architecture / Methodology
- Architecture: `patient.html / doctor.html` (AJAX + Socket.IO) → Node.js :4000
  (scores intake → re-sorts queue → broadcasts `queue:update`) → Spring Boot :8080
  (`POST /api/appointments/from-triage` persists Patient + Appointment via Hibernate) → H2.
- Triage algorithm: `score = Σ symptom weights × risk multipliers`;
  age ≤5 or ≥65 → +0.3; each comorbidity +0.15 (capped +0.45); sudden severe onset +0.2.
  Tiers: ≥12 critical, ≥7 high, ≥4 medium, else low.
- Queue ordering: tier first, then score, then arrival time (fair FIFO within a tier).
- Methodology for evaluation: discrete-event simulation of an 8-hour clinic day,
  one doctor, fixed 8-minute consults, comparing FIFO vs triage ordering.

## Slide 10 — Implementation
- Frontend: vanilla HTML/CSS/JS, Fetch-based AJAX (Module 1), single teal design
  system, symptom chips + live waiting-room card (Module 6 UI management).
- Node.js service: Express REST (`POST /api/intake`, `GET /api/queue`,
  start/complete/delete, `/api/stats`) + Socket.IO broadcasts; in-memory queue
  (Redis noted as production swap) (Modules 2, 3).
- Spring Boot 3: 4 JPA entities (Patient, Doctor, Appointment, Prescription), 4
  Spring Data repositories (query methods generated from names), 4 REST
  controllers, `ddl-auto=update` schema generation, H2 console, startup doctor
  seeder (Modules 2, 4, 5).
- Module coverage: M1 AJAX dashboards · M2 REST APIs on both services ·
  M3 HTML/CSS/Node.js real-time service · M4 Spring + Hibernate ORM ·
  M5 Spring Boot web app · M6 unified UI across both backends.

## Slide 11 — Results and Discussion
*Seeded, reproducible simulation — `realtime-node/eval/simulate-clinic-day.js`,
runs the project's actual triage.js (seed 20261019). One 8-hour day, 1 doctor,
8-min consults.*

| Metric | Normal day (48 pts) | | Busy day (60 pts) | |
|---|---|---|---|---|
| | FIFO | Triage | FIFO | Triage |
| Avg wait, urgent (min) | 7.6 | **3.6** | 37.0 | **6.5** |
| Max wait, urgent (min) | 28.5 | **16.1** | 89.7 | **24.9** |
| Urgent waits > 30 min | 0 | 0 | 10 | **0** |
| Avg wait, all (min) | 10.2 | 10.2 | 40.4 | 40.4 |

- Overall average wait is identical under both orderings — triage redistributes
  waits, it doesn't change workload (built-in correctness check).
- Honest tradeoff: routine patients wait ~5 min longer under triage on a normal
  day (10.3 → 15.4).
- Caveats: synthetic intakes (not clinical data), one doctor, fixed consult
  length, single simulated day.

*Screenshots to capture from the live demo: doctor dashboard with severity-sorted
queue; escalation banner on a critical booking; H2 console showing the persisted
APPOINTMENTS row; patient waiting-room card with position + ETA.*

## Slide 12 — Conclusion
- All five objectives met: Spring Boot domain backend with Hibernate ORM, Node.js
  real-time waiting room, server-side triage scorer, AJAX patient/doctor UIs, and
  a seeded FIFO-vs-triage evaluation.
- The evaluation shows urgent-case waits roughly halved on a normal day and cut
  ~5x on a busy day, with zero urgent waits over 30 minutes — at the cost of
  longer routine waits, stated openly.
- Every course module (1–6) is demonstrated in the running system.

## Slide 13 — Future Scope
- Replace the in-memory queue with Redis for multi-instance real-time service.
- Notification fan-out: SMS/email reminders via the Node service.
- Calibrate symptom weights against real triage datasets; clinician review of
  tier thresholds.
- Multi-doctor scheduling and slot management; role-based auth for doctors.

## Slide 14 — References (IEEE)
1. N. Li, H. Chen, Z. Pei, and T. Wang, "Jointly Appointment Scheduling in a
   Two-Phase Service System With Two Types of Patients Considering Multiple
   Servers and Stochastic Service Time," *IEEE Trans. Autom. Sci. Eng.*, vol. 22,
   pp. 1339–1352, 2025, doi: 10.1109/TASE.2024.3363691.
2. X. Shen, S.-C. Du, Y.-N. Sun, P. Z. H. Sun, R. Law, and E. Q. Wu, "Advance
   Scheduling for Chronic Care Under Online or Offline Revisit Uncertainty,"
   *IEEE Trans. Autom. Sci. Eng.*, vol. 21, pp. 5297–5310, 2024,
   doi: 10.1109/TASE.2023.3310116.
3. K.-C. Leung, Y.-T. Lin, D.-Y. Hong, C.-L. Tsai, C.-H. Huang, and L.-C. Fu,
   "A Novel Interpretable Deep-Learning-Based System for Triage Prediction in
   the Emergency Department: A Prospective Study," in *Proc. IEEE Int. Conf.
   Syst., Man, and Cybern. (SMC)*, 2021, pp. 2979–2985,
   doi: 10.1109/SMC52423.2021.9658729.
4. K. Mackway-Jones, J. Marsden, and J. Windle, *Emergency Triage: Manchester
   Triage Group*, 3rd ed. Chichester, U.K.: BMJ Books, 2014.
5. HL7 International, "FHIR Release 5," http://hl7.org/fhir
6. OpenMRS community, "OpenMRS: open-source medical record system,"
   https://openmrs.org
7. M. Fowler, *Patterns of Enterprise Application Architecture*. Boston, MA,
   USA: Addison-Wesley, 2002.
