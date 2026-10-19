package com.telecare.dto;

import java.util.List;

/**
 * Payload the Node.js service POSTs to /api/appointments/from-triage
 * after scoring an intake. Plain data carrier — no JPA annotations.
 */
public class IntakeRecordRequest {
    private String patientName;
    private int age;
    private List<String> symptoms;
    private Double triageScore;
    private String triageTier;

    public String getPatientName() { return patientName; }
    public void setPatientName(String patientName) { this.patientName = patientName; }
    public int getAge() { return age; }
    public void setAge(int age) { this.age = age; }
    public List<String> getSymptoms() { return symptoms; }
    public void setSymptoms(List<String> symptoms) { this.symptoms = symptoms; }
    public Double getTriageScore() { return triageScore; }
    public void setTriageScore(Double triageScore) { this.triageScore = triageScore; }
    public String getTriageTier() { return triageTier; }
    public void setTriageTier(String triageTier) { this.triageTier = triageTier; }
}
