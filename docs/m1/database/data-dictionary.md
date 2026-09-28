# M1 - Data Dictionary

## 1. Identity Service - users

| Field | Type | Null | Key | Default | Description |
|---|---|---|---|---|---|
| id | BIGINT | NO | PK | AUTO_INCREMENT | Định danh người dùng |
| username | VARCHAR(50) | NO | UNIQUE | - | Tên đăng nhập |
| email | VARCHAR(150) | NO | UNIQUE | - | Địa chỉ email |
| password_hash | VARCHAR(255) | NO | - | - | Mật khẩu đã được băm ( hashed) |
| role | VARCHAR(20) | NO | - | USER | Vai trò của người dùng |
| enabled | BOOLEAN | NO | - | TRUE | Trạng thái hoạt động của tài khoản |
| created_at | TIMESTAMP | NO | - | CURRENT_TIMESTAMP | Thời điểm tạo tài khoản |
| updated_at | TIMESTAMP | NO | - | CURRENT_TIMESTAMP + auto update | Thời điểm cập nhật tài khoản |

### Role values

- `USER`: Người dùng/khách tham quan.
- `ADMIN`: Quản trị viên.

---

## 2. POI Service - pois

| Field | Type | Null | Key | Default | Description |
|---|---|---|---|---|---|
| id | BIGINT | NO | PK | AUTO_INCREMENT | Định danh POI |
| name | VARCHAR(200) | NO | - | - | Tên điểm tham quan |
| description | TEXT | NO | - | - | Mô tả gốc của POI |
| latitude | DECIMAL(10,7) | NO | - | - | Vĩ độ của POI |
| longitude | DECIMAL(10,7) | NO | - | - | Kinh độ của POI |
| radius | DECIMAL(8,2) | NO | - | - | Bán kính kích hoạt POI |
| image_url | VARCHAR(500) | YES | - | NULL | URL hình ảnh của POI |
| status | VARCHAR(20) | NO | - | ACTIVE | Trạng thái của POI |
| created_at | TIMESTAMP | NO | - | CURRENT_TIMESTAMP | Thời điểm tạo POI |
| updated_at | TIMESTAMP | NO | - | CURRENT_TIMESTAMP | Thời điểm cập nhật POI |

### Status values

- `ACTIVE`: POI đang được sử dụng.
- `INACTIVE`: POI tạm thời không được hiển thị/sử dụng.

---

## 3. Database Ownership

### Identity Service

Database:

`identity_db`

Owned table:

`users`

### POI Service

Database:

`poi_db`

Owned table:

`pois`

Mỗi service chỉ truy cập database thuộc quyền sở hữu của service đó.

Không tạo foreign key trực tiếp giữa `identity_db` và `poi_db`.

Việc giao tiếp giữa các service được thực hiện thông qua API.
