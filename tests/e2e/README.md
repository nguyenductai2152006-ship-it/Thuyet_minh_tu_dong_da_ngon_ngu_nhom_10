# Kiểm thử tích hợp từ bản clone

Khởi động Docker Desktop, mở PowerShell tại thư mục gốc và chạy:

```powershell
.\Run-AdminE2E.ps1
```

Bộ kiểm thử dựng các dịch vụ với MySQL và dữ liệu mẫu riêng. Lệnh tạo tên dự án Compose và mật khẩu thử cho mỗi lượt chạy, sau đó dọn môi trường thử. Kết quả nằm trong `artifacts/admin-e2e/<run-id>/`, gồm `admin-e2e-results.md`, `admin-e2e-results.json` và trạng thái của launcher.

Ghi mã commit đã chạy và số ca đạt hoặc lỗi vào PR nghiệm thu. Chỉ dùng kết quả của lượt chạy tương ứng với commit cần bàn giao.
