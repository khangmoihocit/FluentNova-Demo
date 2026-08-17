FROM maven:3.9.6-eclipse-temurin-21-alpine AS builder
WORKDIR /app

# Copy file cấu hình thư viện và source code vào
COPY pom.xml .
COPY src ./src

RUN mvn clean package -DskipTests
FROM eclipse-temurin:21-jdk-alpine
WORKDIR /app
COPY --from=builder /app/target/VocabFlow-0.0.2-SNAPSHOT.jar app.jar

EXPOSE 8085
ENTRYPOINT ["java", "-jar", "app.jar"]