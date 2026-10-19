# TeleCare backend (Spring Boot + Hibernate ORM)

The **system of record**: patients, doctors, appointments, prescriptions —
persisted via Spring Data JPA (Hibernate) instead of hand-written SQL.
Runs on **http://localhost:8080**.

## Run

```bash
# needs Java 17+ and Maven
mvn spring-boot:run
```

H2 console (inspect tables live): http://localhost:8080/h2-console
— JDBC URL `jdbc:h2:mem:telecare`, user `sa`, empty password.

## REST API

| Method | Path                                  | What it does                              |
|--------|---------------------------------------|-------------------------------------------|
| GET/POST | `/api/patients`                     | List / register patients                  |
| GET/PUT/DELETE | `/api/patients/{id}`           | Read / update / delete                    |
| GET    | `/api/doctors` `/api/doctors/available` | List / only available doctors           |
| POST   | `/api/doctors`                        | Register a doctor                         |
| GET    | `/api/appointments`                   | All appointments                          |
| GET    | `/api/appointments/waiting`           | Waiting list, sickest first (persisted triage queue) |
| POST   | `/api/appointments/from-triage`       | **Bridge**: Node.js persists a scored intake here |
| PATCH  | `/api/appointments/{id}/status`       | `{"status":"IN_CONSULTATION"}` / `"COMPLETED"` |
| POST   | `/api/prescriptions/for/{apptId}`     | Issue a prescription for an appointment   |
| GET    | `/api/prescriptions/for/{apptId}`     | Fetch it back                             |

## Try it

```bash
# register a patient
curl -X POST localhost:8080/api/patients -H 'Content-Type: application/json' \
  -d '{"name":"Ananya Rao","age":28,"comorbidities":["asthma"]}'

# simulate what the Node service sends after triage scoring
curl -X POST localhost:8080/api/appointments/from-triage -H 'Content-Type: application/json' \
  -d '{"patientName":"Ananya Rao","age":28,"symptoms":["high-fever"],"triageScore":9.1,"triageTier":"high"}'

# persisted queue, sickest first
curl localhost:8080/api/appointments/waiting
```

## How the two backends connect

```
patient.html --POST /api/intake--> Node.js :4000 --POST /api/appointments/from-triage--> Spring :8080
     (scores + live queue)                      (persists patient + appointment)
```

The Node call is best-effort (try/catch): the live queue keeps working even
if Spring is down; Spring catches up on the next booking.
