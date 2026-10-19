package com.telecare.controller;

import com.telecare.model.Appointment;
import com.telecare.model.Prescription;
import com.telecare.repository.AppointmentRepository;
import com.telecare.repository.PrescriptionRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/prescriptions")
public class PrescriptionController {

    private final PrescriptionRepository prescriptionRepo;
    private final AppointmentRepository appointmentRepo;

    public PrescriptionController(PrescriptionRepository prescriptionRepo,
                                  AppointmentRepository appointmentRepo) {
        this.prescriptionRepo = prescriptionRepo;
        this.appointmentRepo = appointmentRepo;
    }

    @GetMapping
    public List<Prescription> all() {
        return prescriptionRepo.findAll();
    }

    // Issue a prescription against an appointment: POST /api/prescriptions/for/5
    @PostMapping("/for/{appointmentId}")
    @ResponseStatus(HttpStatus.CREATED)
    public Prescription issue(@PathVariable Long appointmentId,
                              @RequestBody Prescription prescription) {
        Appointment appointment = appointmentRepo.findById(appointmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Appointment not found"));
        prescription.setAppointment(appointment);
        return prescriptionRepo.save(prescription);
    }

    @GetMapping("/for/{appointmentId}")
    public Prescription forAppointment(@PathVariable Long appointmentId) {
        return prescriptionRepo.findByAppointmentId(appointmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No prescription yet"));
    }
}
