# syntax=docker/dockerfile:1

# =========================
# Build stage
# =========================
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /workspace

# Copy Maven config first for better caching
COPY pom.xml .
COPY mvnw .
COPY mvnw.cmd .
COPY .mvn .mvn
RUN chmod +x mvnw

# Download dependencies (cache layer)
RUN ./mvnw -q -DskipTests dependency:go-offline

# Copy source
COPY src src

# Build
RUN ./mvnw clean package -DskipTests


# =========================
# Runtime stage
# =========================
FROM eclipse-temurin:21-jre
WORKDIR /app

# Railway injects PORT automatically; don't hardcode it here
ENV JAVA_OPTS=""
ENV SPRING_PROFILES_ACTIVE=prod

# Optional: keep uploads path configurable
ENV UPLOAD_DIR=/app/uploads

COPY --from=build /workspace/target/backend-0.0.1-SNAPSHOT.jar app.jar

# Create non-root user + uploads dir
RUN addgroup --system spring && adduser --system --ingroup spring spring \
    && mkdir -p /app/uploads \
    && chown -R spring:spring /app

USER spring

# EXPOSE is optional on Railway; keep 8080 as conventional fallback
EXPOSE 8080

# Run
ENTRYPOINT ["sh","-c","java $JAVA_OPTS -jar app.jar"]
