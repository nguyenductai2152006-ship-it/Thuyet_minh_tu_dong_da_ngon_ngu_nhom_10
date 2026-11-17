# Thuyết minh tự động đa ngôn ngữ

Dự án Nhóm 10 hướng dẫn tham quan Hội An bằng bản đồ, mã QR, GPS và nội dung thuyết minh theo địa điểm. Trang quản trị dùng để quản lý POI, bản dịch, metadata audio và xem thống kê sử dụng. Bộ dữ liệu mẫu gồm bảy POI với nội dung tiếng Việt, Anh, Trung, Hàn và Nhật.

## Chạy trên máy tính

Cài Docker Desktop hoặc Docker Engine có Docker Compose, rồi mở PowerShell ở thư mục gốc của repo.

```powershell
Copy-Item .env.example .env
```

Mở `.env` bằng trình soạn thảo và khai báo sáu biến bên dưới. Dùng giá trị riêng cho từng mật khẩu và JWT secret ngẫu nhiên dài ít nhất 32 byte. Giữ các biến tùy chọn trong file mẫu nếu dùng cấu hình mặc định. Với volume đã chạy trước đó, dùng thông tin MySQL tương ứng với volume.

```dotenv
MYSQL_ROOT_PASSWORD=
IDENTITY_DB_PASSWORD=
POI_DB_PASSWORD=
LOCALIZATION_DB_PASSWORD=
AUDIO_DB_PASSWORD=
JWT_SECRET=
```

Giữ `.env` ở máy chạy. Sau khi điền cấu hình, kiểm tra và khởi động dự án.

```powershell
docker compose config --quiet
docker compose up -d --build
docker compose ps
```

- Trang khách **http://localhost:5173/**
- Trang quản trị **http://localhost:5173/admin**
- API Gateway trên máy chạy **http://localhost:8080**

MySQL nạp dữ liệu mẫu khi khởi tạo volume lần đầu. Khi cần dừng ứng dụng và giữ dữ liệu, dùng `docker compose down`.

### Tạo tài khoản quản trị trên cơ sở dữ liệu mới

Nếu chưa có tài khoản ADMIN, chạy bootstrap một lần sau khi các dịch vụ đã khởi động. Lệnh dùng biến môi trường trong phiên PowerShell để chuyển thông tin cho container chạy một lần.

```powershell
$env:BOOTSTRAP_ADMIN_EMAIL = Read-Host 'Email quản trị'
$env:BOOTSTRAP_ADMIN_PASSWORD = Read-Host 'Mật khẩu quản trị' -MaskInput
try {
    docker compose run --rm -e SPRING_PROFILES_ACTIVE=bootstrap `
        -e BOOTSTRAP_ADMIN_EMAIL -e BOOTSTRAP_ADMIN_PASSWORD identity-service
} finally {
    Remove-Item Env:BOOTSTRAP_ADMIN_EMAIL, Env:BOOTSTRAP_ADMIN_PASSWORD
}
```

Dùng PowerShell 7.2 trở lên cho `-MaskInput`. Bootstrap tạo tài khoản mới và từ chối email đã tồn tại. Quay lại trang quản trị để đăng nhập sau khi lệnh hoàn tất.

## Kiểm tra thay đổi

GitHub Actions chạy Maven verify bằng Java 21 cho năm module và chạy test, build, lint frontend. Có thể chạy phần frontend tại máy bằng Node 22.22.2.

```powershell
Set-Location frontend
npm ci
npm test
npm run build
npm run lint
```

Để kiểm tra một module Java trên Windows, vào thư mục module và chạy `./mvnw.cmd -B clean verify` với JDK 21.

Khi nghiệm thu hệ thống, ghi commit và kết quả cho các luồng từ trang khách đến API, Admin, bản đồ, QR, GPS và phát audio. Nêu rõ thiết bị hoặc vị trí mô phỏng đã dùng. Dùng cơ sở dữ liệu thử riêng cho thao tác tạo, sửa và xóa.

## Tài liệu nhóm

- [Phân công công việc](docs/PHAN_CONG_CONG_VIEC_NHOM_10.md)
- [Sơ đồ kiến trúc và dữ liệu](docs/diagrams/README.md)
