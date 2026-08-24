# Render não tem runtime nativo para Java (só JS/TS, Python, Ruby, Go, Rust,
# Elixir) — Spring Boot precisa ir via Docker.

FROM eclipse-temurin:21-jdk AS build
WORKDIR /app

COPY .mvn .mvn
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw -q dependency:go-offline

COPY src src
RUN ./mvnw -q clean package -DskipTests

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080
# -Xmx pra caber com folga na instância free do Render (512MB de RAM).
ENTRYPOINT ["java", "-Xmx400m", "-jar", "app.jar"]
