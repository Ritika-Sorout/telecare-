package com.telecare.repository;

import com.telecare.model.Patient;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

/**
 * No implementation needed. Spring Data reads the method NAMES and generates
 * the queries at startup:
 *  - findByNameIgnoreCase → SELECT … WHERE LOWER(name) = LOWER(?)
 *  - findByAgeGreaterThanEqual → SELECT … WHERE age >= ?
 * JpaRepository itself gives you save, findById, findAll, deleteById, …
 */
public interface PatientRepository extends JpaRepository<Patient, Long> {
    Optional<Patient> findByNameIgnoreCase(String name);
    List<Patient> findByAgeGreaterThanEqual(int age);
}
