package com.telecare.controller;

import com.telecare.dto.IntakeRecordRequest;
import com.telecare.model.Appointment;
import com.telecare.model.Patient;
import com.telecare.repository.AppointmentRepository;
import com.telecare.repository.PatientRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * The persistence API for appointments. Note the constructor injection:
 * Spring sees the AppointmentRepository bean (auto-created from the interface)
 * and passes it in — no `new` anywhere.
 */
@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {

    private final AppointmentRepository appointmentRepo;
    private final PatientRepository patientRepo;

    public AppointmentController(AppointmentRepository appointmentRepo, PatientRepository patientRepo) {
        this.appointmentRepo = appointmentRepo;
        this.patientRepo = patientRepo;
    }

    @GetMapping
    public List<Appointment> all() {
        return appointmentRepo.findAll();
    }

    // Persisted triage queue: all WAITING appointments, sickest first.
    @GetMapping("/waiting")
    public List<Appointment> waiting() {
        return appointmentRepo.findByStatusOrderByTriageScoreDesc("WAITING");
    }

    @GetMapping("/{id}")
    public Appointment one(@PathVariable Long id) {
        return appointmentRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Appointment not found"));
    }

    @PostMapping
    public Appointment create(@RequestBody Appointment appointment) {
        return appointmentRepo.save(appointment);
    }

    /**
     * BRIDGE: called by the Node.js service right after it scores an intake.
     * Finds the patient by name (or creates them), then persists the appointment
     * with its triage score. This is how the two backends stay in sync:
     * Node.js = live queue, Spring Boot = system of record.
     */
    @PostMapping("/from-triage")
    public Appointment fromTriage(@RequestBody IntakeRecordRequest req) {
        Patient patient = patientRepo.findByNameIgnoreCase(req.getPatientName())
                .orElseGet(() -> patientRepo.save(new Patient(req.getPatientName(), req.getAge())));

        Appointment appointment = new Appointment();
        appointment.setPatient(patient);
        appointment.setSymptoms(req.getSymptoms());
        appointment.setTriageScore(req.getTriageScore());
        appointment.setTriageTier(req.getTriageTier());
        appointment.setStatus("WAITING");
        return appointmentRepo.save(appointment);
    }

    // Doctor actions from the dashboard: {"status": "IN_CONSULTATION"} etc.
    @PatchMapping("/{id}/status")
    public Appointment setStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        Appointment appointment = one(id);
        String status = body.get("status");
        appointment.setStatus(status);
        if ("IN_CONSULTATION".equals(status)) appointment.setStartedAt(LocalDateTime.now());
        if ("COMPLETED".equals(status)) appointment.setCompletedAt(LocalDateTime.now());
        return appointmentRepo.save(appointment);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        appointmentRepo.deleteById(id);
    }
}
