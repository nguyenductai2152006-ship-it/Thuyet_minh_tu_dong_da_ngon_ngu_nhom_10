# Tài Liệu Kỹ Thuật Member 3: API Gateway & Audio Service

## 1. Phạm vi phụ trách (Service Boundary)
- **API Gateway (`api-gateway`)**: Cổng giao tiếp duy nhất (Single Entry Point) nhận request từ Client và định tuyến (route) tới các Backend Services tương ứng.
- **Audio Service (`audio-service`)**: Dịch vụ độc lập chuyên xử lý chuyển đổi văn bản thuyết minh thành giọng nói (Text-to-Speech - TTS), quản lý lưu trữ và bộ nhớ đệm (cache) cho file âm thanh đa ngôn ngữ.

---

## 2. Sơ đồ Kiến trúc & Giao tiếp Dịch vụ (Component & Sequence)

### 2.1. Luồng định tuyến qua API Gateway
```mermaid
graph LR
    Client["Client (Web/Mobile/Postman)"] --> GW["API Gateway (:8080)"]
    GW -->|"/api/v1/auth/**"| ID["Identity Service (:8081)"]
    GW -->|"/api/v1/pois/**"| POI["POI Service (:8082)"]
    GW -->|"/api/v1/localizations/**"| LOC["Localization Service (:8083)"]
    GW -->|"/api/v1/audio/**"| AUD["Audio Service (:8084)"]
    LOC -.->|"REST HTTP (Internal)"| AUD
sequenceDiagram
    participant C as Client
    participant GW as API Gateway
    participant LOC as Localization Service
    participant AUD as Audio Service
    participant DB as MySQL (hoian_audio_db)
### 2.2. Luồng gọi tạo thuyết minh âm thanh (Service-to-Service)
    C->>GW: Yêu cầu thuyết minh POI theo ngôn ngữ (lang)
    GW->>LOC: Chuyển tiếp request
    LOC->>AUD: POST /api/v1/audio/generate (poiId, lang, text)
    AUD->>DB: Kiểm tra cache theo (poiId, lang, textHash)
    alt Đã có file Audio hợp lệ (Cache HIT)
        DB-->>AUD: Trả về thông tin bản ghi Audio
    else Chưa có Audio (Cache MISS)
        AUD->>AUD: Gọi TTS Engine sinh file MP3
        AUD->>DB: Lưu metadata & đường dẫn audioUrl
    end
    AUD-->>LOC: 200 OK (audioId, audioUrl, status)
    LOC-->>GW: Trả về nội dung + audioUrl
    GW-->>C: 200 OK (JSON Response)

3. Cấu hình Định tuyến API Gateway (api-gateway)
Route ID                Đường dẫn khớp (Path Predicate)        Dịch vụ đích (Target URI)        Mô tả
identity-service	      /api/v1/auth/**	                       http://localhost:8081	          Xác thực và phân quyền người dùng
poi-service	            /api/v1/pois/**	                       http://localhost:8082	          Quản lý điểm tham quan (POI) và tìm kiếm GPS/QR
localization-service	  /api/v1/localizations/**	             http://localhost:8083	          Quản lý nội dung bản dịch đa ngôn ngữ
audio-service           /api/v1/audio/**                       http://localhost:8084            Tạo và truy xuất file âm thanh thuyết minh (TTS)

4. API Contract — Audio Service (audio-service)
4.1. Tạo hoặc lấy file thuyết minh âm thanh
Method: POST
Endpoint: /api/v1/audio/generate
Mục đích: Nhận văn bản đã dịch từ localization-service (hoặc Client), kiểm tra cache và sinh file âm thanh MP3 tương ứng.
Request Body (JSON):{
  "poiId": 1,
  "languageCode": "en",
  "text": "The Japanese Covered Bridge is an iconic symbol of Hoi An Ancient Town."
}
Response Thành công (200 OK / 201 Created):{
  "audioId": 101,
  "poiId": 1,
  "languageCode": "en",
  "audioUrl": "/api/v1/audio/files/poi_1_en.mp3",
  "status": "READY"
}
Error Cases:

400 Bad Request: Thiếu text hoặc languageCode không hợp lệ.

503 Service Unavailable: Dịch vụ TTS bên thứ ba không phản hồi (cho phép service gọi thực hiện cơ chế Fallback).
4.2. Truy xuất thông tin Audio theo POI và Ngôn ngữ
Method: GET

Endpoint: /api/v1/audio/poi/{poiId}?lang={languageCode}

Mục đích: Kiểm tra và lấy đường dẫn file âm thanh đã sinh của một POI theo mã ngôn ngữ.
5. Thiết kế Cơ sở Dữ liệu (hoian_audio_db)
Bảng audio_files (Đạt dạng chuẩn 3NF — mọi thuộc tính không khóa đều phụ thuộc trực tiếp vào khóa chính id, không có phụ thuộc bắc cầu):
Tên cột        Kiểu dữ liệu        Ràng buộc                    Mô tả
id	           BIGINT	             PRIMARY KEY, AUTO_INCREMENT	Mã định danh duy nhất của bản ghi Audio
poi_id	       BIGINT	             NOT NULL, INDEX	            ID tham chiếu logic tới POI (không dùng FK vật lý chéo DB)
language_code	 VARCHAR(10)	       NOT NULL	                    Mã ngôn ngữ (vi, en, ja, ko, fr...)
text_hash	     VARCHAR(64)	       NOT NULL	                    Mã băm MD5/SHA-256 của văn bản dùng để kiểm tra Cache
audio_url	     VARCHAR(500)	       NOT NULL	                    Đường dẫn tĩnh hoặc URL để phát file âm thanh
status	       VARCHAR(20)	       NOT NULL	                    Trạng thái (READY, PROCESSING, FAILED)
created_at	   DATETIME	           DEFAULT CURRENT_TIMESTAMP	  Thời điểm khởi tạo file
updated_at	   DATETIME	ON         UPDATE CURRENT_TIMESTAMP	    Thời điểm cập nhật gần nhất
