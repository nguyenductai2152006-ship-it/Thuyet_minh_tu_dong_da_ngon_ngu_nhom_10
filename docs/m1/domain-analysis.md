# M1 - Domain Analysis 

## 1. Identity Domain 

Identity Service chịu trách nhiệm quản lý danh tính và xác thực người dùng.

Các chức năng chính 

- User Registration
- User Login
- Password Hashing
- JWT Generation
- JWT Validation
- Authentication Middleware
- Role-based Authorization

Identity Service sở hữu và quản lý người dùng trong 'identity.db' .

---

## 2. POI Domain 
POI Service chịu trách nhiệm quản lý thông tin các điểm tham quan ( Point of Interest ) 

Các chức năng chính:

- Creative POI
- Get POI
- List POI
- Update POI
- Delete POI
- Manage POI metadata

  POI Service sở hữu và quản lý dữ liệu POI trong 'poi_db' .

  ---

  ## 3. Service Boundaries

   Hệ thống áp dụng kiến trúc Database-per-Service.

  ### Identity Service

  - Database: 'identity_db'
  - Main table: ' users'

  ### POI Service

  - Database: 'poi_db'
  - Main table: 'pois'

  Mỗi service chỉ được truy cập database thuộc quyền sở hữu của service đó.

  Identity Service không truy cập trực tiếp 'poi_db'.

  POI Service không truy cập trực tiếp 'identity_db'.

  Việc giao tiếp giữa các service được thực hiện thông qua API.

  ---
  ## 4. Role
  Hệ thống sử dụng 2 role cơ bản:

  ### USER

  Người dùng/khách tham quan có thể:

  - Đăng ký tài khoản
  - Đăng nhập
  - Xem danh sách POI
  - Xem thông tin chi tiết POI

  ### ADMIN

  Quản trị viên có thể:

  - Đăng nhập
  - Xem POI
  - Tạo POI
  - Cập nhật POI
  - Xóa POI
  - Quản lý dữ liệu thuộc POI Service
 
  ---
  ## 5. Domain Separation

  ```text
  Identity Service
     |
     +-- User
     |
     +-- Authentication
     |
     +-- Authorization
     |
     +-- Identity_db

   POI Service
       |
       +-- POI
       |
       +-- POI CRUD
       |
       +-- poi_db
  
  
  - 
  
