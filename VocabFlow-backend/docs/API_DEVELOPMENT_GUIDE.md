# VocabFlow Backend - API Development Guide

This guide outlines the standard conventions, design patterns, and workflows for building and maintaining RESTful APIs in the VocabFlow backend project.

---

## 1. API Routing & Naming Conventions
The project relies on standard Spring Web MVC annotations.

- **Base URL Prefix:** All APIs are prefixed with a standard path (e.g., `/api/v1`) using the `${spring.api.prefix}` configuration property.
- **Resource Naming:** Use nouns in kebab-case for paths.
  - Good: `/api/v1/user`, `/api/v1/user/upload-avatar`
  - Bad: `/api/v1/user/uploadAvatar`, `/api/v1/User`
- **Controller Annotations:** Controllers should be annotated with `@RestController` and `@RequestMapping("${spring.api.prefix}/resource-name")`.
- **HTTP Methods:** Use semantic methods (`@GetMapping`, `@PostMapping`, `@PutMapping`, `@DeleteMapping`).
- **Path and Query Params:** Use `@PathVariable` for identifying specific resources (e.g., `/{id}`) and `@RequestParam` for filtering, sorting, and pagination.

**Example Routing:**
```java
@RestController
@RequestMapping("${spring.api.prefix}/user")
public class UserController {
    @GetMapping("/me")
    public ResponseEntity<?> me() { ... }

    @GetMapping("/toggle-active-account/{id}")
    public ResponseEntity<?> toggleActiveAccount(@PathVariable(name = "id") String id) { ... }
}
```

---

## 2. Request & Response Flow
The standard data flow in the application is:  
**Client Request** $\rightarrow$ **Controller** $\rightarrow$ **Service** $\rightarrow$ **Repository** $\rightarrow$ **Database** (and back out).

### Data Transfer Objects (DTOs)
Entities (Database Models) must **never** be exposed directly to the client. Instead, use DTOs for incoming requests (e.g., `UserUpdateRequest`) and outgoing responses (e.g., `UserResponse`). MapStruct is used to handle conversions between Entities and DTOs.

### The `ApiResponse<T>` Wrapper
Every successful API response should be wrapped in the standardized `com.khangmoihocit.VocabFlow.core.dtos.ApiResponse<T>` object to maintain a consistent JSON structure for the frontend.

**JSON Structure:**
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "Tải thông tin của bạn thành công!",
  "data": { ... },
  "errors": null,
  "timestamp": "2026-05-01T10:30:00"
}
```

**Controller Usage:**
```java
UserResponse userResponse = userService.getMyInfo();
return ResponseEntity.ok(ApiResponse.success(userResponse, "Tải thông tin của bạn thành công!"));
```

---

## 3. Validation & Error Handling

### Input Validation
Validation is handled via `jakarta.validation` annotations (e.g., `@NotBlank`, `@NotNull`, `@Size`) placed directly on Request DTO fields. Controllers enforce this using the `@Valid` annotation.

```java
@PutMapping
ResponseEntity<?> updateInfo(@Valid @RequestBody UserUpdateRequest request) { ... }
```

### Global Exception Handling
Errors are caught centrally using `@ControllerAdvice` in `GlobalExceptionHandler.java`. This guarantees that even unexpected errors return a standardized JSON format.

- **Validation Errors (`MethodArgumentNotValidException`):** Automatically intercepted to return a `400 Bad Request` with an `errors` object mapping fields to their validation messages.
- **Business Exceptions (`AppException`, `OurException`):** Thrown from the Service layer (e.g., `throw new AppException(ErrorCode.USER_NOT_FOUND)`). The handler translates the `ErrorCode` into the proper HTTP status (like `404 Not Found` or `400 Bad Request`) and an `ApiResponse.error()` format.
- **Security Exceptions (`AccessDeniedException`):** Translated to a `403 Forbidden` response.

---

## 4. Authentication & Authorization

### Securing Endpoints
Most endpoints are secured globally. To enforce specific roles, use the `@PreAuthorize` annotation on the Controller method.

```java
@GetMapping
@PreAuthorize("hasRole('ADMIN')")
ResponseEntity<?> getAllUsers() { ... }
```

### Extracting User Context
To get the currently authenticated user's details inside a Controller or Service, use the `UserDetailUtil` utility class from the core module. This avoids passing user IDs from the client.

```java
import com.khangmoihocit.VocabFlow.core.utils.UserDetailUtil;
import com.khangmoihocit.VocabFlow.core.security.UserDetailsCustom;

UserDetailsCustom currentUser = UserDetailUtil.get();
String userId = currentUser.getId();
```

---

## 5. Pagination & Filtering
For APIs returning collections of data, pagination and filtering are standardized using `@RequestParam` and the `PageResponse<T>` DTO.

**Standard Query Parameters:**
- `pageNo` (default: 1)
- `pageSize` (default: 20)
- `sort` (default: "id,asc")
- `keyword` (default: "")

**Controller Implementation:**
```java
@GetMapping
ResponseEntity<ApiResponse<PageResponse<UserResponse>>> getAll(
    @RequestParam(name = "pageNo", defaultValue = "1") int pageNo,
    @RequestParam(name = "pageSize", defaultValue = "20") int pageSize,
    @RequestParam(name = "sort", defaultValue = "id,asc") String sort,
    @RequestParam(name = "keyword", defaultValue = "") String keyword) {
    
    PageResponse<UserResponse> pageResponse = userService.getUsers(pageNo, pageSize, sort, keyword);
    return ResponseEntity.ok(ApiResponse.success(pageResponse, "Lấy danh sách thành công"));
}
```

**JSON Structure:**
```json
{
  "success": true,
  "code": "SUCCESS",
  "data": {
    "pageNo": 1,
    "pageSize": 20,
    "totalElements": 150,
    "totalPages": 8,
    "data": [ ... array of objects ... ]
  }
}
```

---

## 6. Advanced JPA & Business Logic Best Practices

### One-to-One Relationships (`@MapsId`)
When an entity has a strict 1-to-1 relationship with the `User` (e.g., `UserStreak`), use `@MapsId` instead of a separate surrogate key. This ensures the primary key of the child entity perfectly matches the primary key of the parent, improving database efficiency and query performance.
```java
@Id
@Column(name = "user_id")
private UUID userId;

@OneToOne(fetch = FetchType.LAZY)
@MapsId
@JoinColumn(name = "user_id")
private User user;
```

### Trust the Backend for Critical Calculations
Never trust the frontend to provide calculated scores, timestamps, or validation-sensitive flags.
- **Scores:** When a user submits a quiz attempt, the frontend only sends the list of selected `option_id`s. The backend `Service` explicitly queries the database for `isCorrect` and calculates the final percentage.
- **Timestamps:** For study sessions and streaks, always use backend-generated `LocalDate.now()` to prevent client-side time spoofing. The streak calculation algorithm explicitly tracks `lastActivityDate` against the server's current date to determine extensions or resets.

---

## 7. How to Build a New API (Step-by-Step Template)

When adding a new API (e.g., creating a Vocabulary Unit), follow this sequence within the appropriate module folder (e.g., `modules/vocabulary`):

### Step 1: Create DTOs (`dtos/request` & `dtos/response`)
Define what the client sends and what the client receives. Add validation annotations.
```java
// CreateUnitRequest.java
public class CreateUnitRequest {
    @NotBlank(message = "Tên bài học không được để trống")
    private String name;
}
```

### Step 2: Define MapStruct Mapper (`mappers`)
Map the incoming Request to the Entity, and the Entity to the Response DTO.
```java
@Mapper(componentModel = "spring")
public interface VocabularyUnitMapper {
    VocabularyUnit toEntity(CreateUnitRequest request);
    VocabularyUnitResponse toResponse(VocabularyUnit entity);
}
```

### Step 3: Implement Business Logic in Service (`services`)
Inject the Repository and Mapper. Handle business rules, throw `AppException` if needed, and interact with the Database.
```java
@Service
@RequiredArgsConstructor
public class VocabularyUnitServiceImpl implements VocabularyUnitService {
    private final VocabularyUnitRepository repository;
    private final VocabularyUnitMapper mapper;

    @Override
    public VocabularyUnitResponse createUnit(CreateUnitRequest request) {
        // 1. Check permissions / validation
        UserDetailsCustom user = UserDetailUtil.get();
        
        // 2. Map & Save
        VocabularyUnit unit = mapper.toEntity(request);
        unit.setOwnerId(user.getId());
        VocabularyUnit saved = repository.save(unit);
        
        // 3. Return mapped response
        return mapper.toResponse(saved);
    }
}
```

### Step 4: Expose the Route in the Controller (`controllers`)
Wire the Service to a REST route and wrap the output in `ApiResponse.success()`.
```java
@RestController
@RequestMapping("${spring.api.prefix}/vocabulary-units")
@RequiredArgsConstructor
public class VocabularyUnitController {
    private final VocabularyUnitService service;

    @PostMapping
    public ResponseEntity<ApiResponse<VocabularyUnitResponse>> create(
            @Valid @RequestBody CreateUnitRequest request) {
            
        VocabularyUnitResponse responseData = service.createUnit(request);
        return ResponseEntity.ok(ApiResponse.success(responseData, "Tạo bài học thành công!"));
    }
}
```
