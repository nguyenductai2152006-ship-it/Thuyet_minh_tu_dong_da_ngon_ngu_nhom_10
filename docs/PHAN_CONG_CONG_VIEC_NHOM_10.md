# Phân công công việc nhóm 10

Đề tài **Hệ thống thuyết minh tự động đa ngôn ngữ**. Nhóm dùng bảng này để thống nhất phạm vi phụ trách, người review và minh chứng bàn giao cho từng phần.

| Mã | Họ và tên | Tài khoản GitHub | Phụ trách chính |
| --- | --- | --- | --- |
| M1 | [Trương Quốc Thái] | [Thaiz2504] | Identity, POI, Analytics, Khám phá, QR và Admin |
| M2 | [Nguyễn Hoàng Phúc] | [hphuc071] | Localization, GPS, bản đồ, chỉ đường và trợ lý tra cứu |
| M3 | [Nguyễn Đức Tài] | [nguyenductai2152006-ship-it] | API Gateway, Audio, Docker/MySQL và tích hợp toàn hệ thống |

## M1 — Identity, POI, Analytics và quản trị

| Hạng mục | Công việc và phạm vi mã | Minh chứng bàn giao | Người review đề xuất |
| --- | --- | --- | --- |
| Identity | `identity-service/`. Đăng nhập, xác minh phiên, phân quyền Admin và khởi tạo tài khoản quản trị. | Test đăng nhập đúng/sai, tài khoản thường bị chặn ở chức năng quản trị, phiên hết hạn. | M3 |
| POI và Analytics | `poi-service/`. Danh sách POI công khai, tra cứu QR, CRUD POI dành cho Admin, ghi và tổng hợp sự kiện sử dụng. | Test POI hoạt động/ẩn, QR hợp lệ/không tồn tại, kiểm tra kết quả Dashboard với dữ liệu thử. | M2 kiểm tra dữ liệu POI, M3 kiểm tra route |
| Giao diện khách | `ExploreLanding`, `QrScanner` và CSS liên quan. Tìm kiếm, lọc danh mục, mở chi tiết từ thẻ hoặc QR. | Demo tìm kiếm tiếng Việt, chọn địa điểm, quét QR và xử lý mã sai. | M2 |
| Giao diện Admin | `LoginForm`, `AdminDashboard`, `AnalyticsDashboard`, phân trang, helper Admin và client Analytics. | Demo đăng nhập, sửa nội dung, phân trang và thống kê. Phối hợp với M2/M3 để thử bản dịch và audio. | M3 |
| Báo cáo | Đặc tả đăng nhập, phân quyền, QR, POI, Admin và Analytics. | Kiểm tra sơ đồ, ảnh minh họa và mô tả API theo commit nghiệm thu. | M2 |

Phần Identity/POI/Analytics và frontend M1 đã có PR merge vào nhánh tích hợp. M1 từng hỗ trợ cấu hình Docker/MySQL trong PR #10. [PR #11](https://github.com/nguyenductai2152006-ship-it/Thuyet_minh_tu_dong_da_ngon_ngu_nhom_10/pull/11) · [PR #12](https://github.com/nguyenductai2152006-ship-it/Thuyet_minh_tu_dong_da_ngon_ngu_nhom_10/pull/12) · [PR #10](https://github.com/nguyenductai2152006-ship-it/Thuyet_minh_tu_dong_da_ngon_ngu_nhom_10/pull/10)

## M2 — Đa ngôn ngữ, GPS, bản đồ và trợ lý

| Hạng mục | Công việc và phạm vi mã | Minh chứng bàn giao | Người review đề xuất |
| --- | --- | --- | --- |
| Localization | `localization-service/`. Lấy tên và mô tả theo POI/ngôn ngữ, quản lý bản dịch, kiểm tra quyền và POI tham chiếu. | Test đọc đủ 5 ngôn ngữ với dữ liệu mẫu, quản trị bản dịch và xử lý POI không hợp lệ. | M1, M3 kiểm tra cấu hình chạy |
| Bản đồ và chỉ đường | `InteractiveMap`, `GoogleMapsDirections`, `utils/googleMaps.js` và CSS. Đồng bộ ghim với danh sách, tìm kiếm, chỉ đường đến POI. | Demo chọn ghim, đổi nền bản đồ và mở đúng đích chỉ đường. | M1 |
| GPS | `hooks/useGeoNarration.js` và tiện ích geofence theo phạm vi đã thống nhất. Xử lý quyền vị trí, sai số và vùng kích hoạt thuyết minh. | Kịch bản GPS bật/tắt, gần/ngoài vùng và vùng chồng lấn. Ghi rõ dùng vị trí mô phỏng hay thiết bị thật. | M3 |
| Trợ lý tra cứu | `ChatbotPanel` và CSS. Tra cứu theo dữ liệu POI và mở địa điểm/bản đồ từ câu trả lời. | Demo câu hỏi có dữ liệu và trường hợp thiếu dữ liệu. | M1 |
| Báo cáo | Mô tả luồng đa ngôn ngữ, vị trí, bản đồ và trợ lý. | Đối chiếu sơ đồ, giới hạn của trợ lý và điều kiện kích hoạt GPS với mã đã merge. | M1 |

Nhánh M2 đã có mã để đối chiếu. Khi bàn giao, đặt component, hook và tiện ích vào đúng cây `frontend/src/`, rồi kiểm tra import trên bản ghép. [Nhánh M2](https://github.com/nguyenductai2152006-ship-it/Thuyet_minh_tu_dong_da_ngon_ngu_nhom_10/tree/feat/m2-gps-map-chatbot)

## M3 — Gateway, Audio, hạ tầng và tích hợp

| Hạng mục | Công việc và phạm vi mã | Minh chứng bàn giao | Người review đề xuất |
| --- | --- | --- | --- |
| API Gateway | `api-gateway/`. Định tuyến đến Identity, POI, Localization và Audio. Đồng bộ cấu hình giữa frontend và backend. | Bảng route và kiểm tra các API chính qua Gateway. | M1, M2 kiểm tra route Localization |
| Audio | `audio-service/`, `AudioPlayerCard`. Quản lý URL, thời lượng và nội dung audio theo POI/ngôn ngữ. Ghép trình phát và xử lý thiếu audio. | Test lấy metadata, phát/tạm dừng, đổi ngôn ngữ và xử lý media lỗi. | M2 |
| Hạ tầng | Docker Compose, Dockerfile, Nginx, khởi tạo MySQL và cấu hình mẫu. | Hướng dẫn chạy từ clone sạch, cấu hình mẫu và kết quả kiểm tra các dịch vụ. | M1 |
| Tích hợp frontend | `frontend/src/main.jsx`, `RootPage.jsx`, `App.jsx`, `api/api.js`, package/lockfile và cấu hình build. | Build/test frontend. Demo từ Khám phá, QR hoặc bản đồ đến thuyết minh. M1/M2 xác nhận giao diện phần mình. | M1 và M2 |
| Báo cáo và bản phát hành | Đối chiếu kiến trúc, triển khai, Audio, README và kết quả nghiệm thu toàn hệ thống. | Ghi commit đã kiểm thử, môi trường chạy, kết quả và giới hạn còn lại. | M1 và M2 |

## Bàn giao chung trên GitHub

- Người phụ trách mở Issue cho đầu việc còn lại, tự nhận Issue và gắn PR bằng `Refs #<số Issue>`. Khi nghiệm thu ở nhánh phát hành, nhóm đóng Issue và gắn minh chứng.
- Tác giả PR ghi phạm vi, tệp dùng chung cần phối hợp, cách chạy kiểm thử và kết quả. Người review ghi kịch bản đã thử, lỗi cần sửa hoặc xác nhận đạt ngay trên PR.
- M3 điều phối thay đổi ở `App.jsx`, `api/api.js` và cấu hình chạy. M1 và M2 xác nhận hợp đồng API và luồng người dùng thuộc phần mình.
- Mỗi thành viên đối chiếu phần báo cáo của mình với commit nghiệm thu. Cả nhóm thống nhất bản nộp, minh chứng và người đại diện tạo PR phát hành.

| Hạng mục nghiệm thu chung | Người thực hiện | Kết quả và minh chứng |
| --- | --- | --- |
| Trang khách, QR, GPS, bản đồ, 5 ngôn ngữ và audio | M1, M2, M3 theo phạm vi trên | [PR / commit / thiết bị / kết quả] |
| Admin, quản lý dữ liệu và Analytics | M1 chủ trì, M2/M3 kiểm tra API liên quan | [PR / commit / kết quả] |
| Clone sạch, build, Docker và kiểm thử tích hợp | M3 chủ trì, M1/M2 xác nhận | [Commit / log đã lọc / kết quả] |
| Báo cáo, sơ đồ và bản demo | Cả nhóm | [Bản báo cáo / commit / ngày xác nhận] |
