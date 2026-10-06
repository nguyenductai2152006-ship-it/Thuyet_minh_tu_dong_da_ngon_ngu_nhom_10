# Identity Service

Identity Service chịu trách nhiệm quản lý người dùng và xác thực JWT cho hệ thống thuyết minh tự động đa ngôn ngữ.

## Technology Stack

- Java 21
- Spring Boot 4.1.1
- Spring Security
- Spring Data JPA
- MySQL 8
- JWT (JJWT)
- Maven

## Database

Database: `identity_db`

Main table:

- `users`

Các thông tin chính:

- `id`
- `email`
- `full_name`
- `password`
- `role`

## API

Base URL:

```text
http://localhost:8085