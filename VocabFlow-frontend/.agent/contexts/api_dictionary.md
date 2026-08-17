ất cả các API đều có chung định dạng Response:
```json
success:
{
  "success": true,               
  "code": "SUCCESS",             
  "message": "Thông báo",        
  "data": { ... },                  
  "timestamp": "2024-03-24T12:00:00"
}

error chung:
{
"code": "VOCABULARY_UNIT_SAME_NAME",
"message": "Bộ từ vựng đã tồn tại",
"success": false,
"timestamp": "2026-04-30T14:23:17.324057"
}
```

---
## 2. tra từ điển:
api: GET: /vocabularies/lookup?word=chance, không cần đăng nhập (accesstoken)
response:
{
"code": "SUCCESS",
"data": [
{
"description": "danh từ: sự may rủi, sự tình cờ",
"dictionaryWordId": 7329,
"htmlContent": "<h1>chance</h1><h3><i>/tʃɑ:ns/</i></h3><h2>danh từ</h2><ul><li>sự may rủi, sự tình cờ<ul style=\"list-style-type:circle\"><li>by chance:<i> tình cờ, ngẫu nhiên</i></li></ul></li><li>sự có thể, sự có khả năng, khả năng có thể<ul style=\"list-style-type:circle\"><li>the chances are against such an attempt:<i> có khả năng là sự cố gắng ấy sẽ không thành công</i></li><li>he has a chance of winning the prize:<i> anh ta có thể đoạt giải</i></li></ul></li><li>cơ hội<ul style=\"list-style-type:circle\"><li>the chance of a lifetime:<i> cơ hội nghìn năm có một</i></li><li>to stand a good chance:<i> được cơ hội thuận tiện</i></li><li>to lose a chance:<i> bỏ lỡ cơ hội</i></li></ul></li><li>số phận<ul style=\"list-style-type:circle\"><li>to take one's chance:<i> phó mặc số phận, đành liều xem sao</i></li></ul></li></ul><h2>thành ngữ</h2><ol><li>on the chance<ul><li>may ra có thể<ul style=\"list-style-type:circle\"><li>I'll call at his house on the chance of seeing him before he leaves home:<i> tôi sẽ lại nhà hắn may ra có thể gặp hắn trước khi hắn đi</i></li></ul></li></ul></li><li>the main chance<ul><li>cơ hội làm giàu, cơ hội để phất<ul style=\"list-style-type:circle\"><li>the capitalist always has an eye to the main chance:<i> nhà tư bản luôn luôn tìm cơ hội để phất</i></li></ul></li></ul></li></ol><h2>tính từ</h2><ul><li>tình cờ, ngẫu nhiên<ul style=\"list-style-type:circle\"><li>there is a chance likeness between the two boys, but thay are not brothers:<i> hai đứa trẻ tình cờ giống nhau nhưng chúng không phải là anh em</i></li></ul></li></ul><h2>động từ</h2><ul><li>tình cờ, ngẫu nhiên, may mà<ul style=\"list-style-type:circle\"><li>to chance to meet someone:<i> tình cờ gặp lại ai</i></li><li>it chanced that my friend was at home when I came:<i> may mà bạn tôi lại có nhà lúc tôi đến</i></li></ul></li><li>(thông tục) liều, đánh liều<ul style=\"list-style-type:circle\"><li>let us chance it:<i> chúng ta cứ liều</i></li></ul></li></ul><h2>thành ngữ</h2><ol><li>to chance upon<ul><li>tình cờ mà tìm thấy, tình cờ mà gặp</li></ul></li><li>to chance one's arm<ul><li>(thông tục) liều làm mà thành công</li></ul></li><li>to chance one's luck<ul><li>cầu may</li></ul></li></ol>",
"pronunciation": "tʃɑ:ns",
"word": "chance"
},
{
"description": "trường hợp ngẫu nhiên, khả năng có thể; cơ hội",
"dictionaryWordId": 104132,
"htmlContent": "<h1>chance</h1><h3><i>//</i></h3><ul><li>trường hợp ngẫu nhiên, khả năng có thể; cơ hội</li><li>by c. ngẫu nhiên</li><li>c. of acceptance xác suất thu nhận</li></ul>",
"pronunciation": "",
"word": "chance"
}
],
"message": "Tra cứu thành công!",
"success": true,
"timestamp": "2026-04-30T13:52:12.0763371"
}

## 3. Vocabulary Group (`/vocabulary-groups`)
**Prefix base:** `/vocabulary-groups` (ví dụ: `http://localhost:8085/api/v1/vocabulary-groups`)
**Quyền truy cập:** User đã đăng nhập (Cần Access Token)
**Mô tả:** Các API hỗ trợ người dùng tạo và quản lý các "Nhóm từ vựng" (sổ tay tự tạo của mỗi cá nhân).

### 3.1. Lấy danh sách nhóm từ vựng của User
- **URL**: `/find-all`
- **Method**: `GET`
- **Query Parameters**:
  - `sort` (string): Trường sắp xếp (Mặc định: "createdAt,asc/desc"), gồm: "updatedAt,asc/desc"
- **Response Data**:
  ```json
{
"code": "SUCCESS",
"data": [
{
"vocabularyGroupResponse": {
"createdAt": "2026-03-22T22:01:00.937551",
"default": false,
"id": 21,
"name": "Unit 4",
"updatedAt": "2026-03-22T22:01:00.937551",
"userId": "d226a016-6b1a-425e-9ad8-279ffaa70175"
},
"vocabularyUnitResponseList": [
{
"description": "this is unit 11",
"id": 1,
"name": "unit  11",
"orderIndex": 12,
"updatedAt": "2026-04-30T10:32:49.921446",
"vocabularyGroupId": 21
},
{
"description": "this is unit 11",
"id": 9,
"name": "unit  12",
"orderIndex": null,
"updatedAt": "2026-04-30T10:38:46.666194",
"vocabularyGroupId": 21
}
]
},
{
"vocabularyGroupResponse": {
"createdAt": "2026-03-22T19:49:52.906643",
"default": false,
"id": 20,
"name": "Unit 3",
"updatedAt": "2026-03-22T19:49:52.906643",
"userId": "d226a016-6b1a-425e-9ad8-279ffaa70175"
},
"vocabularyUnitResponseList": [
{
"description": "this is unit 11",
"id": 10,
"name": "unit  11",
"orderIndex": null,
"updatedAt": "2026-04-30T10:38:54.186402",
"vocabularyGroupId": 20
}
]
}
],
"message": "tải danh sách nhóm từ vựng bạn tạo thành công!",
"success": true,
"timestamp": "2026-04-30T13:50:02.1064722"
}
  ```

### 3.2. Tạo vocabulary group (tất cả api đều cần đăng nhập, accessToken)
api: POST: /vocabulary-groups
request body:
{
    "name": "ielts"
}

response success:
{
    "code": "SUCCESS",
    "data": {
        "createdAt": "2026-04-30T14:18:49.424776",
        "default": false,
        "id": 57,
        "name": "ielts",
        "updatedAt": "2026-04-30T14:18:49.424776",
        "userId": "d226a016-6b1a-425e-9ad8-279ffaa70175"
    },
    "message": "tạo bộ từ vựng thành công",
    "success": true,
    "timestamp": "2026-04-30T14:18:49.4277189"
}

response chỉ khi error validate:
{
    "code": "VALIDATION_ERROR",
    "errors": {
        "name": "tên bộ từ vựng không được để trống"
    },
    "message": "Dữ liệu không hợp lệ",
    "success": false,
    "timestamp": "2026-04-30T14:22:00.5482732"
}

### 3.3. Chỉnh sửa tên nhóm từ vựng
api: PUT: /vocabulary-groups/{id}
request body:
{
"name": "toeic_v2"
}

response error:
{
    "code": "VOCABULARY_GROUP_NOT_EXISTS",
    "message": "Bộ từ vựng không tồn tại",
    "success": false,
    "timestamp": "2026-04-30T14:26:59.1884496"
}

response succcess:
{
    "code": "SUCCESS",
    "data": {
        "createdAt": "2026-03-22T19:49:52.906643",
        "default": false,
        "id": 20,
        "name": "toeic_v2",
        "updatedAt": "2026-03-22T19:49:52.906643",
        "userId": "d226a016-6b1a-425e-9ad8-279ffaa70175"
    },
    "message": "cập nhật bộ từ vựng thành công",
    "success": true,
    "timestamp": "2026-04-30T14:27:34.6344611"
}

### 3.4. Xóa bộ từ vựng
api: DELETE: /vocabulary-groups/{id}

response{
    "code": "SUCCESS",
    "message": "xóa bộ từ vựng thành công",
    "success": true,
    "timestamp": "2026-04-30T14:28:39.7057672"
}


## 4. User Saved Words
**Quyền truy cập:** User đã đăng nhập (Cần Access Token)
**Mô tả:** Các API thao tác đưa từ vựng thực tế vào trong sổ tay của User đã tạo ở bước trên, cũng như đồng bộ nó với Anki Desktop.

### 4.1. Lưu từ vựng vào Sổ tay
api: POST: /user-saved-words
cần đăng nhập (accessToken)
req{
    "dictionaryWordId": 93309,
    "sourceSentence": "12345678",
    "sourceUrl": "vo.vn",
    "vocabularyUnitId": 2
}

res error:
{
    "code": "VOCABULARY_UNIT_NOT_EXISTS",
    "message": "Bộ unit từ vựng không tồn tại",
    "success": false,
    "timestamp": "2026-04-30T14:32:12.8757268"
}

res success:
{
    "code": "SUCCESS",
    "data": {
        "userSavedWordId": 247
    },
    "message": "Lưu từ vựng vào sổ tay của bạn thành công!",
    "success": true,
    "timestamp": "2026-04-30T14:32:55.5671754"
}

Mỗi vocabulary group sẽ gồm 1 list vocabulary unit
1. thêm unit:
api: POST: /vocabulary-units, cần accessToken
req body:
{
    "name": "unitư  11",
    "description": "this is unit 11",
    "vocabularyGroupId": 20
}
res:
{
    "code": "SUCCESS",
    "data": {
        "description": "this is unit 11",
        "id": 11,
        "name": "unitư  11",
        "orderIndex": null,
        "updatedAt": "2026-04-30T14:46:10.607149",
        "vocabularyGroupId": 20
    },
    "message": "tạo bộ từ vựng thành công!",
    "success": true,
    "timestamp": "2026-04-30T14:46:10.6187104"
}
2. Cập nhật unit:
api: PUT /vocabulary-units/{unit id}, cần accessToken
req:
{
    "name": "unit  1ccccc2",
    "description": "this is unit 12",
    "vocabularyGroupId": 21,
    "orderIndex": 132
}
res:
{
    "code": "SUCCESS",
    "data": {
        "description": "this is unit 12",
        "id": 1,
        "name": "unit  1ccccc2",
        "orderIndex": 132,
        "updatedAt": "2026-04-30T14:47:37.164",
        "vocabularyGroupId": 21
    },
    "message": "update bộ từ vựng thành công!",
    "success": true,
    "timestamp": "2026-04-30T14:47:37.173057"
}

3. xóa unit:
api: DELETE: /vocabulary-units/{id unit}
cần accessToken
res:
{
    "code": "SUCCESS",
    "message": "xóa bộ từ vựng thành công!",
    "success": true,
    "timestamp": "2026-04-30T14:48:50.3335191"
}

### 4.2. Xem danh sách toàn bộ từ đã lưu trong 1 unit
-api: GET: /user-saved-words/find-all/{vocabularyUnitId}`
cần accessToken
- **Query Parameters**: `pageNo` (1), `pageSize` (20), `sort` ("id,asc"), `keyword` (rỗng)-tìm theo word
- **Response Data** (`PageResponse<WordSavedFindResponse>`):
  ```json
  {
    "code": "SUCCESS",
    "data": {
        "data": [
            {
                "ankiNoteId": 1777476965512,
                "ankiStatus": "SYNCED",
                "id": 230,
                "lookupWordResponse": {
                    "description": "danh từ: lời đồn đại",
                    "dictionaryWordId": 33821,
                    "htmlContent": "<h1>on dit</h1><h3><i>/ʤn'di:/</i></h3><h2>danh từ</h2><ul><li>lời đồn đại</li></ul>",
                    "pronunciation": "ʤn'di:",
                    "word": "on dit"
                },
                "sourceUrl": "vo.vn",
                "userId": "d226a016-6b1a-425e-9ad8-279ffaa70175"
            }
            {
                "ankiNoteId": null,
                "ankiStatus": "PENDING",
                "id": 247,
                "lookupWordResponse": {
                    "description": "phòng hộ tịch (nơi làm hồ sơ về khai sanh, giấy kết hôn, giá thú, khai tử )",
                    "dictionaryWordId": 93309,
                    "htmlContent": "<h1>registry office</h1><h3><i>//</i></h3>* danh từ<br/><ul><li>phòng hộ tịch (nơi làm hồ sơ về khai sanh, giấy kết hôn, giá thú, khai tử )</li></ul>",
                    "pronunciation": "",
                    "word": "registry office"
                },
                "sourceUrl": "vo.vn",
                "userId": "d226a016-6b1a-425e-9ad8-279ffaa70175"
            }
        ],
        "pageNo": 1,
        "pageSize": 20,
        "totalElements": 8,
        "totalPages": 1
    },
    "message": "tải danh sách từ trong database thành công!",
    "success": true,
    "timestamp": "2026-04-30T14:37:15.2009265"
}

res khi rỗng:
{
    "code": "SUCCESS",
    "data": {
        "data": [],
        "pageNo": 1,
        "pageSize": 20,
        "totalElements": 0,
        "totalPages": 0
    },
    "message": "tải danh sách từ trong database thành công!",
    "success": true,
    "timestamp": "2026-04-30T14:38:37.234478"
}
  ```

### 4.3. Xóa một từ khỏi Sổ tay
api: DELETE: /user-saved-words/{id user saved word}
cần accessToken
res
{
  "code": "SUCCESS",
  "message": "Xóa từ vựng khỏi sổ tay của bạn thành công!",
  "success": true,
  "timestamp": "2026-04-30T14:40:40.6568171"
  }

### 4.4. Đồng bộ (Sync) sang Anki
api: POST /user-saved-words/sync-anki
cần accessToken
- **Request Body**: Không. Yêu cầu AnkiConnect Desktop app (port `8765`) đã được bật.
- **Response Data**:
  ```json
{
"code": "SUCCESS",
"data": {
"syncedWords": 10
},
"message": "Đồng bộ thành công 10 từ vựng sang Anki!",
"success": true,
"timestamp": "2026-04-30T14:58:50.5675154"
}
đồng bộ lại anki theo 
api: POST /user-saved-words/resync-anki/9
cần accessToken
res:
{
"code": "ERROR",
"message": "Lỗi: Anki chưa được mở hoặc AnkiConnect chưa cấu hình đúng port 8765!",
"success": false,
"timestamp": "2026-04-30T14:56:12.761666"
