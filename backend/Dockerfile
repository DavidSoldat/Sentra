# build
FROM eclipse-temurin:21-jdk AS build
WORKDIR /app

COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .
RUN ./mvnw dependency:go-offline -B

COPY src src
RUN ./mvnw clean package -DskipTests -B

# runtime
FROM eclipse-temurin:21-jre AS runtime
WORKDIR /app

RUN groupadd -r sentra && useradd -r -g sentra -s /usr/sbin/nologin sentra

COPY --from=build /app/target/*.jar app.jar
RUN chown sentra:sentra app.jar

USER sentra

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]