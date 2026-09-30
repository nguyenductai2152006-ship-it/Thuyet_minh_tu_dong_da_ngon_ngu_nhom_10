# M1 - POI Service API Contract

## 1. Overview

POI Service chịu trách nhiệm quản lý thông tin các điểm tham quan
(Point of Interest) và cung cấp REST API cho các client và service khác.

Base URL:

`/api/pois`

---

## 2. GET /api/pois

### Purpose

Lấy danh sách các POI trong hệ thống.

### Authentication

Yêu cầu JWT.

### Authorization

USER và ADMIN đều được phép truy cập.

### Success Response

HTTP Status: `200 OK`

Response:

Danh sách POI, mỗi POI gồm:

- `id`
- `name`
- `description`
- `latitude`
- `longitude`
- `radius`
- `imageUrl`
- `status`

### Error Responses

#### 401 Unauthorized

JWT không tồn tại, không hợp lệ hoặc đã hết hạn.

`UNAUTHORIZED`

---

## 3. GET /api/pois/{id}

### Purpose

Lấy thông tin chi tiết của một POI theo ID.

### Authentication

Yêu cầu JWT.

### Authorization

USER và ADMIN đều được phép truy cập.

### Path Parameter

| Parameter | Type | Required | Description |
|---|---|---|---|
| id | Long | Yes | ID của POI |

### Success Response

HTTP Status: `200 OK`

Response:

- `id`
- `name`
- `description`
- `latitude`
- `longitude`
- `radius`
- `imageUrl`
- `status`

### Error Responses

#### 401 Unauthorized

JWT không hợp lệ.

`UNAUTHORIZED`

#### 404 Not Found

Không tìm thấy POI với ID được cung cấp.

`POI_NOT_FOUND`

---

## 4. POST /api/pois

### Purpose

Tạo một POI mới.

### Authentication

Yêu cầu JWT.

### Authorization

Chỉ ADMIN được phép thực hiện.

### Request

| Field | Type | Required | Constraint |
|---|---|---|---|
| name | String | Yes | Không được rỗng |
| description | String | Yes | Không được rỗng |
| latitude | Decimal | Yes | Từ -90 đến 90 |
| longitude | Decimal | Yes | Từ -180 đến 180 |
| radius | Decimal | Yes | Lớn hơn 0 |
| imageUrl | String | No | URL hình ảnh |
| status | String | No | ACTIVE hoặc INACTIVE |

### Request Example

`name = Chùa Linh Ứng`

`description = Một địa điểm tham quan nổi tiếng.`

`latitude = 16.1056000`

`longitude = 108.2432000`

`radius = 30`

`imageUrl = https://example.com/linh-ung.jpg`

`status = ACTIVE`

### Success Response

HTTP Status: `201 Created`

Response:

- `id`
- `name`
- `description`
- `latitude`
- `longitude`
- `radius`
- `imageUrl`
- `status`

### Error Responses

#### 400 Bad Request

Dữ liệu request không hợp lệ.

`VALIDATION_ERROR`

#### 401 Unauthorized

JWT không hợp lệ hoặc không được cung cấp.

`UNAUTHORIZED`

#### 403 Forbidden

User không có quyền ADMIN.

`FORBIDDEN`

---

## 5. PUT /api/pois/{id}

### Purpose

Cập nhật thông tin của một POI.

### Authentication

Yêu cầu JWT.

### Authorization

Chỉ ADMIN được phép thực hiện.

### Path Parameter

| Parameter | Type | Required | Description |
|---|---|---|---|
| id | Long | Yes | ID của POI cần cập nhật |

### Request

| Field | Type | Required | Constraint |
|---|---|---|---|
| name | String | Yes | Không được rỗng |
| description | String | Yes | Không được rỗng |
| latitude | Decimal | Yes | Từ -90 đến 90 |
| longitude | Decimal | Yes | Từ -180 đến 180 |
| radius | Decimal | Yes | Lớn hơn 0 |
| imageUrl | String | No | URL hình ảnh |
| status | String | Yes | ACTIVE hoặc INACTIVE |

### Success Response

HTTP Status: `200 OK`

Response:

Thông tin POI sau khi cập nhật.

### Error Responses

#### 400 Bad Request

Dữ liệu không hợp lệ.

`VALIDATION_ERROR`

#### 401 Unauthorized

JWT không hợp lệ.

`UNAUTHORIZED`

#### 403 Forbidden

User không có quyền ADMIN.

`FORBIDDEN`

#### 404 Not Found

POI không tồn tại.

`POI_NOT_FOUND`

---

## 6. DELETE /api/pois/{id}

### Purpose

Xóa một POI khỏi hệ thống.

### Authentication

Yêu cầu JWT.

### Authorization

Chỉ ADMIN được phép thực hiện.

### Path Parameter

| Parameter | Type | Required | Description |
|---|---|---|---|
| id | Long | Yes | ID của POI cần xóa |

### Success Response

HTTP Status: `204 No Content`

Không trả response body.

### Error Responses

#### 401 Unauthorized

JWT không hợp lệ.

`UNAUTHORIZED`

#### 403 Forbidden

User không có quyền ADMIN.

`FORBIDDEN`

#### 404 Not Found

POI không tồn tại.

`POI_NOT_FOUND`

---

## 7. Authorization Summary

| Endpoint | Authentication | USER | ADMIN |
|---|---|---:|---:|
| GET `/api/pois` | JWT | Yes | Yes |
| GET `/api/pois/{id}` | JWT | Yes | Yes |
| POST `/api/pois` | JWT | No | Yes |
| PUT `/api/pois/{id}` | JWT | No | Yes |
| DELETE `/api/pois/{id}` | JWT | No | Yes |

---

## 8. Validation Rules

### Name

Không được rỗng.

### Description

Không được rỗng.

### Latitude

Giá trị phải nằm trong khoảng:

`-90 <= latitude <= 90`

### Longitude

Giá trị phải nằm trong khoảng:

`-180 <= longitude <= 180`

### Radius

Phải lớn hơn `0`.

### Status

Chỉ chấp nhận:

- `ACTIVE`
- `INACTIVE`

---

## 9. Service Boundary

POI Service chỉ truy cập database thuộc quyền sở hữu của mình:

`poi_db`

POI Service không truy cập trực tiếp:

`identity_db`

Authentication được xác thực thông qua JWT.

POI Service không quản lý password của người dùng.

Các nội dung dịch và audio không được lưu trực tiếp trong bảng `pois`; chúng thuộc trách nhiệm của Localization Service và Audio Service.
