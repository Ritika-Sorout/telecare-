# ---- Stage 1: build the jar with Maven ----
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn -B package -DskipTests

# ---- Stage 2: run it on a slim JRE ----
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/target/telecare-backend-1.0.0.jar app.jar
# Free-tier containers get ~512MB RAM; cap the heap so the JVM stays inside it.
ENV JAVA_OPTS="-Xmx384m"
# Render injects PORT at runtime; Spring reads it via server.port=${PORT:8081}
CMD ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
