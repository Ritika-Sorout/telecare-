package com.telecare.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * The central entity: links a Patient to (optionally) a Doctor and carries
 * the triage score computed by the Node.js service.
 */
@Entity
@Table(name = "appointments")
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Many appointments → one patient. Hibernate creates the patient_id FK column.
    // LAZY = the Patient row is only fetched if you actually call getPatient().
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doctor_id")
    private Doctor doctor;

    @ElementCollection
    @CollectionTable(name = "appointment_symptoms", joinColumns = @JoinColumn(name = "appointment_id"))
    @Column(name = "symptom")
    private List<String> symptoms = new ArrayList<>();

    // Written by the Node.js triage engine via POST /api/appointments/from-triage
    private Double triageScore;
    private String triageTier; // critical | high | medium | low

    // WAITING → IN_CONSULTATION → COMPLETED (or CANCELLED)
    private String status = "WAITING";

    private LocalDateTime bookedAt = LocalDateTime.now();
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private String notes;

    public Appointment() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Patient getPatient() { return patient; }
    public void setPatient(Patient patient) { this.patient = patient; }
    public Doctor getDoctor() { return doctor; }
    public void setDoctor(Doctor doctor) { this.doctor = doctor; }
    public List<String> getSymptoms() { return symptoms; }
    public void setSymptoms(List<String> symptoms) { this.symptoms = symptoms; }
    public Double getTriageScore() { return triageScore; }
    public void setTriageScore(Double triageScore) { this.triageScore = triageScore; }
    public String getTriageTier() { return triageTier; }
    public void setTriageTier(String triageTier) { this.triageTier = triageTier; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getBookedAt() { return bookedAt; }
    public LocalDateTime getStartedAt() { return startedAt; }
    public void setStartedAt(LocalDateTime startedAt) { this.startedAt = startedAt; }
    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
