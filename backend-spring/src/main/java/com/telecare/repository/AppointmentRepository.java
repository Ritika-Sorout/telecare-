package com.telecare.repository;

import com.telecare.model.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    // The persisted mirror of the live triage queue: waiting list, sickest first.
    List<Appointment> findByStatusOrderByTriageScoreDesc(String status);
    List<Appointment> findByDoctorIdAndStatus(Long doctorId, String status);
    List<Appointment> findByPatientId(Long patientId);
}
