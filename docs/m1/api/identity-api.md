# M1 - Identity Service API Contract

## 1. Overview

Identity Service chịu trách nhiệm quản lý người dùng, đăng ký tài khoản,
đăng nhập, xác thực JWT và cung cấp thông tin người dùng hiện tại.

Base URL:

`/api/auth`

---

## 2. POST /api/auth/register

### Purpose

Tạo tài khoản người dùng mới.

### Authentication

Không yêu cầu JWT.

### Request

| Field | Type | Required | Example |
|---|---|---|---|
| username | String | Yes | thai |
| email | String | Yes | thai@example.com |
| password | String | Yes | 12345678 |

### Request Example

`username = thai`

`email = thai@example.com`

`password = 12345678`

### Success Response

HTTP Status: `201 Created`

Response:

`id = 1`

`username = thai`

`email = thai@example.com`

`role = USER`

`enabled = true`

### Error Responses

#### 400 Bad Request

Dữ liệu request không hợp lệ.

`VALIDATION_ERROR`

#### 409 Conflict

Username hoặc email đã tồn tại.

`USERNAME_ALREADY_EXISTS`

### Notes

- Password không được lưu dưới dạng plaintext.
- Password phải được hash trước khi lưu vào database.
- Không trả password hoặc password_hash về client.
- Role mặc định khi đăng ký là USER.
- User mới có trạng thái enabled = true.

---

## 3. POST /api/auth/login

### Purpose

Xác thực người dùng và cấp JWT access token.

### Authentication

Không yêu cầu JWT.

### Request

| Field | Type | Required | Example |
|---|---|---|---|
| username | String | Yes | thai |
| password | String | Yes | 12345678 |

### Success Response

HTTP Status: `200 OK`

Response:

`accessToken = JWT_TOKEN`

`tokenType = Bearer`

`expiresIn = 3600`

### Error Responses

#### 400 Bad Request

Request không hợp lệ.

`VALIDATION_ERROR`

#### 401 Unauthorized

Thông tin đăng nhập không chính xác.

`INVALID_CREDENTIALS`

#### 403 Forbidden

Tài khoản bị vô hiệu hóa.

`ACCOUNT_DISABLED`

### Notes

- Password được kiểm tra bằng password hash đã lưu trong database.
- Không trả password_hash về client.
- Access token được sử dụng để gọi protected API.
- Client gửi token theo dạng:

`Authorization: Bearer JWT_TOKEN`

---

## 4. GET /api/auth/me

### Purpose

Lấy thông tin của người dùng hiện đang đăng nhập.

### Authentication

Yêu cầu JWT.

### Request Header

`Authorization: Bearer JWT_TOKEN`

### Success Response

HTTP Status: `200 OK`

Response:

`id = 1`

`username = thai`

`email = thai@example.com`

`role = USER`

`enabled = true`

### Error Responses

#### 401 Unauthorized

JWT không tồn tại, không hợp lệ hoặc đã hết hạn.

`UNAUTHORIZED`

### Notes

- API chỉ trả thông tin của user được xác định từ JWT.
- Không sử dụng thông tin user do client tự truyền.
- Không trả password_hash.

---

## 5. Authorization Summary

| Endpoint | Authentication | USER | ADMIN |
|---|---|---:|---:|
| POST `/api/auth/register` | No | Public | Public |
| POST `/api/auth/login` | No | Public | Public |
| GET `/api/auth/me` | JWT | Yes | Yes |

### Role Definition

- `USER`: Người dùng/khách tham quan.
- `ADMIN`: Quản trị viên.

---

## 6. Security Rules

- Password phải được hash trước khi lưu vào identity_db.
- Không lưu password dạng plaintext.
- Không trả password hoặc password_hash về client.
- Protected API phải yêu cầu JWT hợp lệ.
- JWT được sử dụng để xác định danh tính người dùng.
- Role được sử dụng cho authorization.
