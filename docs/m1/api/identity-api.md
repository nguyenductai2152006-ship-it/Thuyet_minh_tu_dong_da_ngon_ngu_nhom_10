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

```json
{
  "username": "thai",
  "email": "thai@example.com",
  "password": "12345678"
}
