# Bộ sơ đồ thuyết minh tự động đa ngôn ngữ

| Hình | Nội dung | Tệp chèn Word |
| --- | --- | --- |
| 01 | Kiến trúc tổng quát theo Component Diagram trong báo cáo | [PNG](01-tong-quat.png) · [SVG](01-tong-quat.svg) |
| 02 | DFD ngữ cảnh với tiến trình 0 | [PNG](02-dfd-ngu-canh.png) · [SVG](02-dfd-ngu-canh.svg) |
| 03 | DFD phân rã tiến trình 0 thành sáu tiến trình nghiệp vụ | [PNG](03-dfd-phan-ra.png) · [SVG](03-dfd-phan-ra.svg) |
| 04 | ERD nghiệp vụ và bội số của các liên kết | [PNG](04-erd-logic.png) · [SVG](04-erd-logic.svg) |
| 05 | Lược đồ quan hệ theo bốn schema MySQL | [PNG](05-luoc-do-quan-he.png) · [SVG](05-luoc-do-quan-he.svg) |
| 06 | C4 mức 1, ngữ cảnh hệ thống và dịch vụ bản đồ bên ngoài | [PNG](06-c4-system-context.png) · [SVG](06-c4-system-context.svg) |
| 07 | C4 mức 2, container và đường giao tiếp | [PNG](07-c4-container.png) · [SVG](07-c4-container.svg) |
| 08 | C4 mức 3, các thành phần của POI Service | [PNG](08-c4-component.png) · [SVG](08-c4-component.svg) |
| 09 | C4 mức 4, các lớp Java của Analytics | [PNG](09-c4-code.png) · [SVG](09-c4-code.svg) |
| 10 | Quy trình cập nhật nội dung, nghe thuyết minh và xem thống kê | [PNG](10-quy-trinh-admin-khach.png) · [SVG](10-quy-trinh-admin-khach.svg) |

Nguồn đối chiếu gồm báo cáo nhóm 10, `docker-compose.yml`, mã frontend và service, DDL trong `handoff/database/HoiAnGuide_AllDB.sql`, cùng migration category và metadata Analytics. Đây là mô hình của bản mã trong workspace và dữ liệu bàn giao. Các cột có dấu † thuộc phần bổ sung qua migration hoặc entity.

Hai hình DFD theo ký hiệu trong ảnh mẫu. Hình chữ nhật là tác nhân, hình tròn có số là tiến trình, ô có hai cạnh cong là kho dữ liệu và mũi tên có nhãn là luồng dữ liệu. Hình ngữ cảnh gom hệ thống thành tiến trình 0. Hình phân rã thể hiện sáu tiến trình 1.0–6.0 và năm kho D1–D5. Các ký hiệu kho lặp cùng mã chỉ cùng một kho.

- **DFD** dùng cùng hai tác nhân nghiệp vụ với Hình 1 của báo cáo là Khách tham quan (Visitor) và Quản trị viên (ADMIN). Dịch vụ ô bản đồ là phụ thuộc kỹ thuật của tiến trình bản đồ và được mô tả trong phần triển khai. Tác nhân hoặc kho có cùng tên được vẽ lại để dễ đọc. D1–D5 lần lượt là tài khoản, POI, bản dịch, metadata audio và sự kiện sử dụng. Tiến trình 6.0 kiểm tra POI ở D2 khi sự kiện có `poiId`. Hai loại sự kiện `poi_view` và `audio_play` bắt buộc có `poiId`.
- **C4** đi từ hệ thống tổng thể đến các lớp Java của một thành phần để minh họa đúng phạm vi phóng to. Mức 3 mở POI Service trong mức 2. Mức 4 đi sâu vào Analytics trong POI Service. Sơ đồ triển khai Docker của báo cáo mô tả cổng và nơi chạy.
- **Quy trình nghiệp vụ** dùng cùng một POI và ngôn ngữ ở hai giao diện. Khi nghiệm thu, nhóm ghi kết quả lưu, nội dung khách nhận được và số liệu trong cùng cửa sổ thời gian. Bản Word và sơ đồ mô tả mã trong workspace. Cần đối chiếu lại frontend và chạy quy trình sau khi ghép các nhánh trên GitHub.
- **ERD** thể hiện một POI có thể có nhiều bản dịch, audio và sự kiện. Với bản dịch và audio, mỗi cặp POI/ngôn ngữ là duy nhất trong từng bảng. Sự kiện có thể thiếu POI. Bội số thể hiện nghiệp vụ, còn các tham chiếu nét đứt không phải khóa ngoại trong DDL.
- **Lược đồ quan hệ** ghi tên cột và khóa của năm bảng nghiệp vụ. Các bảng sao lưu, đánh dấu migration và audit timestamp được ghi chú riêng. Kho audio giữ URL và thời lượng, còn tệp media nội bộ do Nginx phục vụ.
- **Dữ liệu bàn giao** có 7 POI hoạt động, 35 bản dịch và 35 bản ghi audio, tương ứng 7 địa điểm × 5 ngôn ngữ. Đây là số liệu snapshot được nêu trong báo cáo.

Sửa bố cục và nội dung trong [render-diagrams.mjs](render-diagrams.mjs), rồi chạy `node docs/diagrams/render-diagrams.mjs` từ thư mục gốc để xuất lại SVG. Khi chèn Word, dùng SVG nếu phiên bản Word hỗ trợ hoặc dùng PNG. Hình 03 và 05 phù hợp với trang ngang.
