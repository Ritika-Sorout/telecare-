package com.telecare.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * @Entity → Hibernate maps this class to a "patients" table, one row per
 * object. You never write CREATE TABLE or INSERT — the ORM does it.
 */
@Entity
@Table(name = "patients")
public class Patient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) // auto-increment PK
    private Long id;

    @Column(nullable = false)
    private String name;

    private int age;
    private String phone;
    private String email;

    // A List<String> can't be a column, so Hibernate stores it in a second
    // table (patient_comorbidities) and joins automatically. No extra entity needed.
    @ElementCollection
    @CollectionTable(name = "patient_comorbidities", joinColumns = @JoinColumn(name = "patient_id"))
    @Column(name = "comorbidity")
    private List<String> comorbidities = new ArrayList<>();

    private LocalDateTime createdAt = LocalDateTime.now();

    // One patient → many appointments. mappedBy = "the Appointment.patient
    // field owns the foreign key". @JsonIgnore breaks the infinite loop
    // (patient → appointments → patient → …) when Jackson serializes to JSON.
    @OneToMany(mappedBy = "patient", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<Appointment> appointments = new ArrayList<>();

    public Patient() {}
    public Patient(String name, int age) { this.name = name; this.age = age; }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public int getAge() { return age; }
    public void setAge(int age) { this.age = age; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public List<String> getComorbidities() { return comorbidities; }
    public void setComorbidities(List<String> comorbidities) { this.comorbidities = comorbidities; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public List<Appointment> getAppointments() { return appointments; }
}
