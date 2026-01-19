# syntax=docker/dockerfile:1

# Build stage: compile the Spring Boot application
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /workspace
COPY pom.xml .
COPY mvnw .
COPY mvnw.cmd .
COPY .mvn .mvn
RUN chmod +x mvnw
COPY src src
COPY data data
RUN ./mvnw clean package -DskipTests

# Runtime stage: run the packaged JAR
FROM eclipse-temurin:21-jre
WORKDIR /app
ENV PORT=8080
ENV JAVA_OPTS=""
COPY --from=build /workspace/target/backend-0.0.1-SNAPSHOT.jar app.jar
RUN addgroup --system spring && adduser --system --ingroup spring spring \
    && mkdir -p /app/uploads \
    && chown -R spring:spring /app/uploads
USER spring
EXPOSE 8080
ENTRYPOINT ["sh","-c","java $JAVA_OPTS -jar app.jar"]
