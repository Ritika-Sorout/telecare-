package com.telecare.controller;

import com.telecare.model.Patient;
import com.telecare.repository.PatientRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/patients")
public class PatientController {

    private final PatientRepository repo;

    public PatientController(PatientRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    public List<Patient> all() {
        return repo.findAll();
    }

    @GetMapping("/{id}")
    public Patient one(@PathVariable Long id) {
        return repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Patient not found"));
    }

    // @RequestBody: Jackson turns the incoming JSON into a Patient automatically.
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Patient create(@RequestBody Patient patient) {
        return repo.save(patient);
    }

    @PutMapping("/{id}")
    public Patient update(@PathVariable Long id, @RequestBody Patient updated) {
        Patient patient = one(id);
        patient.setName(updated.getName());
        patient.setAge(updated.getAge());
        patient.setPhone(updated.getPhone());
        patient.setEmail(updated.getEmail());
        patient.setComorbidities(updated.getComorbidities());
        return repo.save(patient);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        repo.deleteById(id);
    }
}
