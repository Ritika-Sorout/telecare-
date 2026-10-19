package com.telecare;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Entry point. @SpringBootApplication bundles three things:
 *  - @Configuration      → this class can declare beans
 *  - @EnableAutoConfiguration → Spring Boot guesses your setup
 *      (sees H2 + Hibernate on the classpath → configures a DataSource,
 *       an EntityManager, transaction management… all automatically)
 *  - @ComponentScan      → finds @Entity, @Repository, @RestController,
 *      @Component classes under com.telecare and wires them together
 */
@SpringBootApplication
public class TeleCareApplication {
    public static void main(String[] args) {
        SpringApplication.run(TeleCareApplication.class, args);
    }
}
