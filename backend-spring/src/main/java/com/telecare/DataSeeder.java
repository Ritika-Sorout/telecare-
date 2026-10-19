package com.telecare;

import com.telecare.model.Doctor;
import com.telecare.repository.DoctorRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

/**
 * Runs once at startup. Seeds two doctors so the API has data immediately.
 * @Component → Spring instantiates it; CommandLineRunner → its run() executes
 * after the whole context (including Hibernate) is ready.
 */
@Component
public class DataSeeder implements CommandLineRunner {

    private final DoctorRepository doctorRepo;

    public DataSeeder(DoctorRepository doctorRepo) {
        this.doctorRepo = doctorRepo;
    }

    @Override
    public void run(String... args) {
        if (doctorRepo.count() == 0) {
            doctorRepo.save(new Doctor("Dr. Meera Nair", "General Medicine"));
            doctorRepo.save(new Doctor("Dr. Arjun Rao", "Cardiology"));
            System.out.println("Seeded 2 doctors.");
        }
    }
}
