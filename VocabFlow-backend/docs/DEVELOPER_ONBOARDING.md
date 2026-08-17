# VocabFlow Backend - Developer Onboarding Guide

## 1. Project Overview
VocabFlow is a comprehensive language learning platform that allows users to look up dictionary words, organize vocabulary units, perform translation exercises, and learn via YouTube video segments. The backend is a robust RESTful API built with Java and Spring Boot, designed to support both web and extension clients. Notably, it integrates with Google's Gemini AI to provide advanced language assistance, featuring a custom API key pooling mechanism for high availability and rate-limit handling.

## 2. Technology Stack
- **Language:** Java 21
- **Framework:** Spring Boot (WebMVC, Data JPA, Security, Validation)
- **Build Tool:** Maven
- **Database:** PostgreSQL
- **Database Migration:** Flyway
- **Security:** Spring Security with JWT (JSON Web Tokens) and Google OAuth2 Client
- **AI Integration:** Spring AI (Google GenAI model: `gemini-2.5-flash-lite`)
- **Cloud Storage:** Cloudinary (for media/image storage)
- **Mapping & Boilerplate:** MapStruct, Lombok
- **API Documentation:** Springdoc OpenAPI (Swagger UI)

## 3. Directory Structure
The project follows a well-organized, domain-driven modular structure:

```text
VocabFlow-backend/
├── src/main/java/com/khangmoihocit/VocabFlow/
│   ├── core/           # Shared, generic components used across the entire application
│   │   ├── config/     # Global configurations (CORS, App properties)
│   │   ├── dtos/       # Common Data Transfer Objects
│   │   ├── exception/  # Global exception handling (OurException)
│   │   ├── mapper/     # Base/shared MapStruct configurations
│   │   ├── security/   # JWT filters, EntryPoints, UserDetails, and OAuth2 handlers
│   │   ├── utils/      # Helper classes and utilities
│   │   └── ...
│   ├── integration/    # Third-party service integrations (e.g., GeminiChatClientPool)
│   ├── modules/        # Core business domains (Modular Monolith approach)
│   │   ├── translation/      # Translation exercises and user attempts
│   │   ├── user/             # User management, OTP, and Refresh Tokens
│   │   ├── vocabulary/       # Dictionary words, topics, and saved user vocabulary
│   │   └── youtube_learning/ # YouTube video lessons, segments, and shadowing/dictation
│   └── VocabFlowApplication.java # Spring Boot main application class
├── src/main/resources/
│   ├── db/migration/         # Flyway SQL migration scripts
│   ├── application.yml       # Production/Default configuration file
│   └── application-dev.yml   # Development-specific configuration overrides
└── pom.xml                   # Maven dependencies and build configuration
```

## 4. Architecture & Design Patterns
- **Modular Monolith & Layered Architecture:** The codebase is partitioned by business domains (`translation`, `user`, `vocabulary`, `youtube_learning`). Within each module, a standard N-Tier (Layered) architecture is enforced:
  - **Controllers:** Handle incoming HTTP requests and route them to services.
  - **Services:** Contain the core business logic.
  - **Repositories:** Interfaces extending Spring Data JPA repositories for database access.
  - **Entities:** JPA domain models mapping directly to database tables.
  - **Mappers:** MapStruct interfaces converting Entities to DTOs (and vice-versa) before returning responses.
- **Failover & Pooling Pattern:** A custom `GeminiChatClientPool` is implemented in the `integration` package. It manages multiple Gemini API keys using round-robin distribution. If a key hits a rate limit or quota (`429`, `503`), it automatically fails over to the next key and places the exhausted key on a "cooldown", ensuring uninterrupted AI service.
- **Security Pattern:** Stateless authentication is used. A `JwtAuthenticationFilter` intercepts requests to validate JWT access tokens. Google OAuth2 is supported via `OAuth2SuccessHandler`, which provisions a local user and generates JWT tokens upon successful social login.

## 5. Key Entities & Business Modules

### User Module (`modules/user`)
- **`User`**: Represents system users, containing authentication details and roles.
- **`RefreshToken` & `OtpToken`**: Manages secure session lifecycle and email verification/password reset flows.

### Vocabulary Module (`modules/vocabulary`)
- **`DictionaryWord`**: Core dictionary data.
- **`Topic`**, **`VocabularyGroup`**, **`VocabularyUnit`**: Logical grouping of words for structured learning.
- **`UserSavedWord`**: Tracks individual words saved by users for their personal vocabulary lists.

### YouTube Learning Module (`modules/youtube_learning`)
- **`YoutubeChannel`**, **`VideoLesson`**, **`VideoSegment`**: Metadata for YouTube content broken down into digestible segments for learning.
- **`UserSegmentAttempt`**: Tracks a user's progress and scores when practicing shadowing or dictation on specific video segments.

### Translation Module (`modules/translation`)
- **`TranslationTopic`** & **`TranslationExercise`**: Structured translation challenges.
- **`UserTranslationAttempt`**: Records user submissions and evaluations for translation exercises.

### Category Module (`modules/category`)
- **`Category`**: System for organizing and categorizing Video Lessons.

### Quiz Module (`modules/quiz`)
- **`VideoQuiz`** & **`QuizOption`**: Comprehension questions tied to specific Video Lessons.
- **`UserQuizAttempt`**: Tracks user submissions and scores for video quizzes.

### Progress Module (`modules/progress`)
- **`UserVideoProgress`**: Aggregates a user's overall progress (shadowing, dictation, watch time) for a specific video.
- **`StudySession`**: Logs daily learning activities and duration.
- **`UserStreak`**: Tracks the user's daily study streak (current and longest) utilizing `@MapsId` for optimal 1-to-1 mapping with `User`.

## 6. Configuration & Environment
The application is configured primarily through `src/main/resources/application.yml` and `application-dev.yml`. These files rely heavily on environment variables for security and portability.
Key environment variables you must configure:
- **Database:** `${DATABASE_URL}`, `${DATABASE_USERNAME}`, `${DATABASE_PASSWORD}`
- **JWT:** `${JWT_KEY}`, `${JWT_VALID_DURATION}`, `${JWT_REFRESHABLE_DURATION}`, `${JWT_ISSUER}`
- **Gemini API:** `${GEMINI_API_KEY_1}` through `${GEMINI_API_KEY_6}`
- **Google OAuth2:** `${CLIENT_ID}`, `${CLIENT_SECRET}`, `${EXTENSION_CLIENT_ID}`
- **SMTP Mail:** `${EMAIL_USERNAME}`, `${EMAIL_PASSWORD}`
- **Cloudinary:** `${CLOUD_NAME}`, `${CLOUD_API_KEY}`, `${CLOUD_API_SECRET}`

The database schema is managed automatically by **Flyway**, which executes migration scripts located in `classpath:db/migration` on application startup.

## 7. Build & Run Instructions
Ensure you have **Java 21** installed and that your target PostgreSQL database is running.

1. **Clone the repository and navigate to the root directory.**
2. **Set up the required environment variables** (or substitute them directly in `application-dev.yml` for local testing).
3. **Clean and Build the project (skipping tests if needed):**
   ```bash
   ./mvnw clean install -DskipTests
   ```
   *(On Windows Command Prompt, use `mvnw.cmd clean install -DskipTests`)*
4. **Run the application locally:**
   ```bash
   ./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
   ```
   Alternatively, you can run the `VocabFlowApplication` main class directly from your IDE (IntelliJ IDEA, Eclipse, VS Code) with the active profile set to `dev`.

IMPLEMENTATION REQUIREMENTS:

JPA Entities: Map these tables perfectly. Use correct annotations (@Entity, @Table, @Id, @GeneratedValue, @Column, @ManyToOne, @OneToMany). Handle bidirectional relationships carefully to avoid Infinite Recursion (e.g., use @JsonIgnore or proper DTO mapping). Use LocalDate for DATE columns and LocalDateTime for TIMESTAMP.

Repositories: Create standard JpaRepository interfaces. Add custom JPQL/native queries where necessary (e.g., finding streaks by user, getting study sessions by date for heatmaps).

DTOs: Create separate Request and Response DTOs. Never expose raw Entities in Controllers. Apply Jakarta Validation (@NotNull, @NotBlank, etc.) to Request DTOs.

Services: Write interface and implementation (@Service). Use @Transactional where data is modified. Throw the project's standard custom exceptions (e.g., when a Quiz or Category is not found).

Controllers: - Expose RESTful endpoints adhering to our URL naming conventions.

Wrap all responses in the project's standard Base/Generic Response object.

For endpoints involving user actions (like saving progress, submitting a quiz, tracking study sessions), do not accept user_id from the request body. Extract the user_id securely from the Spring Security Context / JWT token.