# API Controllers — Chi tiết các endpoint

Tài liệu này mô tả chi tiết các endpoint trong các controller liên quan tới Youtube learning module: `YoutubeChannelController`, `VideoLessonController`, `VideoSegmentController`.

Mọi response thành công đều được bọc trong `ApiResponse<T>` có cấu trúc (các trường không null sẽ hiển thị):
- success: Boolean
- code: String (ví dụ "SUCCESS")
- message: String
- data: T (nội dung trả về)
- errors: Object (nếu có lỗi)
- timestamp: LocalDateTime

Các response dạng trang dùng `PageResponse<T>` có các trường:
- pageNo, pageSize, totalElements, totalPages, data

Lưu ý: các trường request/response trong ví dụ được lấy trực tiếp từ DTOs trong dự án.

---

## 1) YoutubeChannelController
Base path: `${spring.api.prefix}/youtube-channels`

Các DTO liên quan:
- `YoutubeChannelRequest`:
  - name: String
  - youtubeChannelId: String
  - avatarUrl: String
  - description: String

- `YoutubeChannelResponse`:
  - id: Long
  - name: String
  - youtubeChannelId: String
  - avatarUrl: String
  - description: String

Endpoints:

### POST /youtube-channels
- Quyền: ADMIN (`@PreAuthorize("hasRole('ADMIN')")`)
- Mô tả: Tạo một youtube channel mới.

Request (JSON):

```json
{
  "name": "English With Anna",
  "youtubeChannelId": "UC1234567890",
  "avatarUrl": "https://example.com/avatar.jpg",
  "description": "Kênh dạy tiếng Anh cho người mới bắt đầu"
}
```

Success response (200):

```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "create channel success",
  "data": {
    "id": 123,
    "name": "English With Anna",
    "youtubeChannelId": "UC1234567890",
    "avatarUrl": "https://example.com/avatar.jpg",
    "description": "Kênh dạy tiếng Anh cho người mới bắt đầu"
  },
  "timestamp": "2026-04-01T09:00:00"
}
```

Validation error example (400):

```json
{
  "success": false,
  "code": "ERROR",
  "message": "Validation failed",
  "errors": {
    "youtubeChannelId": "must not be blank"
  }
}
```

---

### PUT /youtube-channels/{id}
- Quyền: ADMIN
- Mô tả: Cập nhật thông tin channel theo `id`.

Request (JSON):

```json
{
  "name": "English With Anna - Updated",
  "youtubeChannelId": "UC1234567890",
  "avatarUrl": "https://example.com/avatar-updated.jpg",
  "description": "Cập nhật mô tả"
}
```

Success response (200):

```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "update channel success",
  "data": {
    "id": 123,
    "name": "English With Anna - Updated",
    "youtubeChannelId": "UC1234567890",
    "avatarUrl": "https://example.com/avatar-updated.jpg",
    "description": "Cập nhật mô tả"
  }
}
```

---

### GET /youtube-channels/{id}
- Quyền: ADMIN (the controller áp `@PreAuthorize` cho endpoint này)
- Mô tả: Lấy chi tiết một channel theo `id`.

Success response (200):

```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "get channel success",
  "data": {
    "id": 123,
    "name": "English With Anna",
    "youtubeChannelId": "UC1234567890",
    "avatarUrl": "https://example.com/avatar.jpg",
    "description": "Kênh dạy tiếng Anh cho người mới bắt đầu"
  }
}
```

---

### GET /youtube-channels/find-all
- Quyền: public
- Query params:
  - pageNo (int, default 1)
  - pageSize (int, default 20)
  - sort (String, default "id,asc")
  - keyword (String, default "")
- Mô tả: Trả về trang các channels.

Example request:

GET /youtube-channels/find-all?pageNo=1&pageSize=10&sort=name,asc&keyword=english

Success response (200):

```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "get all channel success",
  "data": {
    "pageNo": 1,
    "pageSize": 10,
    "totalElements": 42,
    "totalPages": 5,
    "data": [
      {
        "id": 123,
        "name": "English With Anna",
        "youtubeChannelId": "UC12345",
        "avatarUrl": "https://...",
        "description": "..."
      },
      {
        "id": 130,
        "name": "Learn English",
        "youtubeChannelId": "UC67890",
        "avatarUrl": "https://...",
        "description": "..."
      }
    ]
  }
}
```

---

### DELETE /youtube-channels/{id}
- Quyền: ADMIN
- Mô tả: Xóa channel theo `id`.

Success response (200):

```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "deleted channel success"
}
```

---

## 2) VideoLessonController
Base path: `${spring.api.prefix}/video-lessons`

Các DTO liên quan:
- `VideoLessonRequest`:
  - youtubeChannelId: Long (bắt buộc)
  - youtubeVideoId: String (bắt buộc)
  - title: String (bắt buộc)
  - thumbnailUrl: String
  - duration: String
  - views: String
  - difficultyLevel: String
  - isPublished: Boolean

- `VideoLessonResponse`:
  - id: Long
  - youtubeVideoId: String
  - youtubeChannelId: Long
  - title: String
  - thumbnailUrl: String
  - duration: String
  - views: String
  - difficultyLevel: String
  - isPublished: Boolean
  - createdAt: LocalDateTime
  - updatedAt: LocalDateTime

Endpoints:

### POST /video-lessons
- Quyền: ADMIN
- Mô tả: Tạo một video lesson.

Request (JSON):

```json
{
  "youtubeChannelId": 123,
  "youtubeVideoId": "dQw4w9WgXcQ",
  "title": "Lesson 1 - Greetings",
  "thumbnailUrl": "https://example.com/thumb.jpg",
  "duration": "00:05:00",
  "views": "0",
  "difficultyLevel": "BEGINNER",
  "isPublished": true
}
```

Success response (200):

```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "create video lesson success",
  "data": {
    "id": 555,
    "youtubeVideoId": "dQw4w9WgXcQ",
    "youtubeChannelId": 123,
    "title": "Lesson 1 - Greetings",
    "thumbnailUrl": "https://example.com/thumb.jpg",
    "duration": "00:05:00",
    "views": "0",
    "difficultyLevel": "BEGINNER",
    "isPublished": true,
    "createdAt": "2026-04-01T09:10:00",
    "updatedAt": "2026-04-01T09:10:00"
  }
}
```

Validation error example (400) — từ annotation trong `VideoLessonRequest`:

```json
{
  "success": false,
  "code": "ERROR",
  "message": "Validation failed",
  "errors": {
    "youtubeChannelId": "channel id is require",
    "youtubeVideoId": "youtube video id là bắt buộc",
    "title": "tiêu đề video không được để trống"
  }
}
```

---

### PUT /video-lessons/{id}
- Quyền: ADMIN
- Mô tả: Cập nhật video lesson theo `id`.

Request (JSON):

```json
{
  "youtubeChannelId": 123,
  "youtubeVideoId": "dQw4w9WgXcQ",
  "title": "Lesson 1 - Greetings (Updated)",
  "thumbnailUrl": "https://example.com/thumb-new.jpg",
  "duration": "00:05:20",
  "views": "100",
  "difficultyLevel": "BEGINNER",
  "isPublished": false
}
```

Success response (200):

```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "update video lesson success",
  "data": {
    "id": 555,
    "youtubeVideoId": "dQw4w9WgXcQ",
    "youtubeChannelId": 123,
    "title": "Lesson 1 - Greetings (Updated)",
    "thumbnailUrl": "https://example.com/thumb-new.jpg",
    "duration": "00:05:20",
    "views": "100",
    "difficultyLevel": "BEGINNER",
    "isPublished": false,
    "createdAt": "2026-03-20T12:00:00",
    "updatedAt": "2026-04-01T09:20:00"
  }
}
```

---

### GET /video-lessons/{id}
- Quyền: ADMIN (endpoint có `@PreAuthorize`)
- Mô tả: Lấy chi tiết video lesson theo `id`.

Success response (200):

```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "get video lesson success",
  "data": {
    "id": 555,
    "youtubeVideoId": "dQw4w9WgXcQ",
    "youtubeChannelId": 123,
    "title": "Lesson 1 - Greetings",
    "thumbnailUrl": "https://example.com/thumb.jpg",
    "duration": "00:05:00",
    "views": "12345",
    "difficultyLevel": "BEGINNER",
    "isPublished": true,
    "createdAt": "2026-03-20T12:00:00",
    "updatedAt": "2026-03-20T12:00:00"
  }
}
```

---

### GET /video-lessons/find-all/{channelId}
- Quyền: public
- Query params: pageNo, pageSize, sort, keyword
- Mô tả: Trả về trang các video lesson theo channel.

Success response (200) (PageResponse):

```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "get all video lesson success",
  "data": {
    "pageNo": 1,
    "pageSize": 5,
    "totalElements": 12,
    "totalPages": 3,
    "data": [
      {
        "id": 555,
        "youtubeVideoId": "dQw4w9WgXcQ",
        "youtubeChannelId": 123,
        "title": "Lesson 1 - Greetings",
        "thumbnailUrl": "https://example.com/thumb1.jpg",
        "duration": "00:05:00",
        "views": "1000",
        "difficultyLevel": "BEGINNER",
        "isPublished": true
      }
    ]
  }
}
```

---

### DELETE /video-lessons/{id}
- Quyền: ADMIN
- Mô tả: Xóa video lesson theo `id`.

Success response (200):

```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "deleted video lesson success"
}
```

---

## 3) VideoSegmentController
Base path: `${spring.api.prefix}/video-segments`

Các DTO liên quan:
- `VideoSegmentToolRequest`:
  - id: Integer
  - start: BigDecimal
  - end: BigDecimal
  - text: String

- `VideoSegmentResponse`:
  - id: Long
  - segmentOrder: Integer
  - startTime: BigDecimal
  - endTime: BigDecimal
  - englishText: String
  - userAttempt: `UserAttemptResponse` (nullable)

- `VideoDetailResponse`:
  - videoDetail: `VideoLessonSegmentResponse` (id, youtubeVideoId, title, channelName)
  - segments: List<VideoSegmentResponse>

- `UserAttemptResponse`:
  - dictationUserText: String
  - dictationScore: Integer
  - shadowingScore: Integer
  - isMastered: Boolean

Endpoints:

### POST /video-segments/{videoId}/import
- Quyền: ADMIN
- Mô tả: Import danh sách segment (thường từ công cụ) cho video có `videoId`.
- Body: JSON array của `VideoSegmentToolRequest`.

Example request body:

```json
[
  { "id": 1, "start": 0.0, "end": 5.0, "text": "Hello everyone" },
  { "id": 2, "start": 5.0, "end": 10.0, "text": "Welcome to the lesson" }
]
```

Success response (200):

```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "import thành công các segment của video 555 !"
}
```

Error example (video not found):

```json
{
  "success": false,
  "code": "ERROR",
  "message": "Video not found with id 555"
}
```

---

### GET /video-segments/{videoId}/study-detail
- Quyền: public
- Mô tả: Lấy chi tiết bài học (thông tin video và danh sách segments kèm trạng thái attempt của user nếu có).

Success response (200):

```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "Tải bài học video thành công!",
  "data": {
    "videoDetail": {
      "id": 555,
      "youtubeVideoId": "dQw4w9WgXcQ",
      "title": "Lesson 1 - Greetings",
      "channelName": "English With Anna"
    },
    "segments": [
      {
        "id": 1001,
        "segmentOrder": 1,
        "startTime": 0.0,
        "endTime": 5.0,
        "englishText": "Hello everyone",
        "userAttempt": {
          "dictationUserText": "Hello evryone",
          "dictationScore": 85,
          "shadowingScore": 90,
          "isMastered": false
        }
      },
      {
        "id": 1002,
        "segmentOrder": 2,
        "startTime": 5.0,
        "endTime": 10.0,
        "englishText": "Welcome to the lesson",
        "userAttempt": null
      }
    ]
  }
}
```

---

## Lỗi chung & Authorization
- Nếu gọi endpoint có `@PreAuthorize` mà thiếu quyền, server thường trả 401/403 với `ApiResponse` lỗi, ví dụ:

```json
{
  "success": false,
  "code": "ERROR",
  "message": "Access is denied"
}
```

- Validation errors (Jakarta Validation) sẽ trả `ApiResponse` với `errors` mô tả trường vi phạm.

---

Tài liệu kết thúc.

