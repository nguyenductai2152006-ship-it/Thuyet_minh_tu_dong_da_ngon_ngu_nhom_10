# M1 — Kiểm tra email khi đăng nhập Admin

Ngày chỉnh sửa: 18/11/2026. Thành viên M1: Thaiz2504.

## 1. Yêu cầu và Use Case

Thay đổi thuộc **UC08 — Đăng nhập quản trị**, không phải chức năng đăng ký tài khoản. Tên đăng nhập của dự án là email được lưu trong Identity Service. Khách tham quan dùng các chức năng công khai mà không cần đăng nhập.

Trước thay đổi, hai giao diện đã sử dụng `type="email"` và `required`. Trình duyệt chặn nhiều dữ liệu sai nhưng thông báo phụ thuộc ngôn ngữ trình duyệt. Phần sửa bổ sung thông báo tiếng Việt ngay trên trang và kiểm tra trong hàm submit trước khi gọi API.

| Dữ liệu nhập | Kết quả |
| --- | --- |
| Để trống | Vui lòng nhập địa chỉ email quản trị. |
| `abc`, `abc@`, `abc gmail.com`, `a@@example.com` | Đây không phải là một địa chỉ email hợp lệ. |
| Email đúng cú pháp nhưng dài hơn 150 ký tự | Địa chỉ email không được vượt quá 150 ký tự. |
| Email đúng định dạng, ví dụ `admin+demo@example.com` | Tiếp tục gửi yêu cầu đăng nhập để backend kiểm tra. |

Kiểm tra định dạng không xác minh hộp thư tồn tại, không xác nhận mật khẩu đúng và không tự cấp quyền ADMIN. Trường email tuân theo quy tắc `input type="email"` của trình duyệt. Đây không phải bộ kiểm tra mọi địa chỉ email theo toàn bộ RFC.

## 2. Từng file thay đổi có ý nghĩa gì?

| File | Vai trò |
| --- | --- |
| `frontend/src/utils/adminEmail.js` | Hàm dùng chung `getAdminEmailError(input)`, kiểm tra rỗng, `input.validity.typeMismatch` và giới hạn 150 ký tự giống DTO backend. Trả chuỗi lỗi hoặc chuỗi rỗng. |
| `frontend/src/pages/AdminPage.jsx` | Trang `/admin` đang được `RootPage.jsx` sử dụng. Bổ sung trạng thái lỗi email, bắt sự kiện `onInvalid`, kiểm tra phòng vệ trong `handleSubmit`, hiển thị lỗi và đưa con trỏ về email. |
| `frontend/src/components/LoginForm.jsx` | Form đăng nhập dùng chung có cùng hành vi kiểm tra. Dùng chung helper để hai nơi không đưa thông báo khác nhau. |
| `frontend/src/__tests__/AdminEmailValidation.test.jsx` | 16 trường hợp cho hai giao diện, bao gồm email sai, trống, quá dài, submit bỏ qua kiểm tra HTML và sửa email thành hợp lệ để đăng nhập tiếp. |
| `docs/m1/van-dap-kiem-tra-email-admin.md` | Giải thích yêu cầu, cách triển khai, kiểm thử và minh chứng GitHub để vấn đáp. |

Các file frontend này dùng JavaScript/React. Backend Identity Service dùng Java/Spring Boot.

## 3. Luồng xử lý để trình bày với giáo viên

1. Người dùng nhập email và mật khẩu rồi nhấn Đăng nhập.
2. Trình duyệt áp dụng `required` và `type="email"`. Nếu email không hợp lệ, React nhận `onInvalid`.
3. `getAdminEmailError` chọn thông báo tiếng Việt. `preventDefault()` trong `onInvalid` tắt hộp thông báo mặc định để sử dụng thông báo trên giao diện. Nó không biến dữ liệu sai thành hợp lệ.
4. `emailError` lưu thông báo trong state. React render phần tử có `role="alert"`, liên kết với input bằng `aria-describedby` và đánh dấu `aria-invalid`.
5. Khi sửa nội dung email, thông báo cũ được xóa. Xóa thông báo chưa có nghĩa là email đã hợp lệ, lần submit tiếp theo vẫn kiểm tra lại.
6. Trong `handleSubmit`, hàm kiểm tra email chạy thêm một lần trước khi bật loading hoặc gọi `login`. Nếu sai, hàm `return` ngay. Vì vậy submit được kích hoạt trực tiếp cũng không gọi API với email sai.
7. Email đúng định dạng được `trim()` rồi gửi cùng mật khẩu qua `POST /api/v1/auth/login` trong `frontend/src/api/api.js`.
8. Backend `AuthDto.LoginRequest` đã có `@NotBlank`, `@Email`, `@Size(max = 150)` và controller dùng `@Valid`. Lớp này vẫn kiểm tra khi client gọi API trực tiếp.
9. Backend kiểm tra tài khoản, mật khẩu và trả thông tin xác thực. Trang `/admin` tiếp tục gọi `/api/v1/auth/me` và xác minh vai trò ADMIN trước khi hiển thị Dashboard.

Kiểm tra email ở frontend giúp người dùng nhận lỗi sớm. Xác thực tài khoản và phân quyền vẫn do backend thực hiện. Phần sửa này không thay đổi database, API, mật khẩu hay thuật toán tạo JWT.

## 4. Các câu hỏi vấn đáp thường gặp

**Em làm chức năng gì và UC nào?**

Em phụ trách phần M1. Trong lần chỉnh sửa này em bổ sung kiểm tra email của UC08, đăng nhập quản trị. Dữ liệu sai được báo bằng tiếng Việt trước khi gửi API, còn quyền ADMIN vẫn được xác minh từ backend.

**Đã có type=email rồi tại sao còn sửa?**

Thuộc tính đó đã chặn sai định dạng nhưng thông báo mặc định tùy trình duyệt. Em sử dụng chính kết quả kiểm tra của trình duyệt để hiển thị thông báo tiếng Việt nhất quán. Em thêm kiểm tra trong submit để tránh gọi API nếu submit trực tiếp bỏ qua bước kiểm tra HTML.

**Tại sao không viết một regex email riêng?**

Giao diện đã dùng `type="email"`, nên em tái sử dụng `validity.typeMismatch` để không có hai quy tắc khác nhau ngay trong frontend. Backend có validation độc lập để bảo vệ API.

**Email đúng định dạng có chắc đăng nhập được không?**

Chưa chắc. Đúng định dạng chỉ cho phép gửi yêu cầu. Tài khoản phải tồn tại, mật khẩu phải đúng và vai trò phải là ADMIN. Một địa chỉ gõ đúng cấu trúc cũng chưa chứng minh hộp thư tồn tại.

**Vì sao có giới hạn 150 ký tự?**

DTO đăng nhập backend đã giới hạn email tối đa 150 ký tự. Frontend kiểm tra cùng giới hạn để báo lỗi sớm thay vì chờ phản hồi HTTP 400.

**Nếu bỏ qua frontend và dùng Postman thì sao?**

Backend vẫn áp dụng `@Valid` trên request cùng các annotation trong DTO. Frontend không phải ranh giới bảo mật của hệ thống.

**Tại sao sửa hai giao diện?**

Trang Admin hiện chạy qua `AdminPage.jsx`. Dự án cũng còn `LoginForm.jsx` dùng chung. Cả hai dùng một helper, giúp hành vi nhất quán khi sử dụng hoặc tái sử dụng các component.

**Em kiểm tra chức năng bằng cách nào?**

Em dùng React Testing Library và Vitest, nhập dữ liệu, nhấn nút thật trong môi trường DOM mô phỏng rồi kiểm tra thông báo và xác nhận `login` chưa được gọi. Em kiểm tra thêm việc sửa email thành hợp lệ, khi đó API mock được gọi và luồng ADMIN tiếp tục.

**Thầy yêu cầu đổi thông báo thì sửa ở đâu?**

Sửa chuỗi trả về tương ứng trong `frontend/src/utils/adminEmail.js`, cập nhật kỳ vọng của test, sau đó chạy test và build. Hai giao diện đều nhận thay đổi vì cùng sử dụng helper.

## 5. Minh chứng GitHub

Nhánh của M1: `fix/m1-admin-email-validation`.

Commit có tiêu đề `fix(m1): validate admin login email with Vietnamese feedback`. Mở commit để xem tác giả, diff từng dòng và danh sách file thay đổi. Mở PR từ nhánh này vào `main` để xem review và kết quả kiểm tra.

- [Xem nhánh M1](https://github.com/nguyenductai2152006-ship-it/Thuyet_minh_tu_dong_da_ngon_ngu_nhom_10/tree/fix/m1-admin-email-validation)
- [So sánh với main](https://github.com/nguyenductai2152006-ship-it/Thuyet_minh_tu_dong_da_ngon_ngu_nhom_10/compare/main...fix/m1-admin-email-validation)

Việc đẩy nhánh lên GitHub chưa đồng nghĩa với merge vào `main`. Khi vấn đáp, mở đúng commit hoặc PR để chỉ minh chứng của lần sửa này.

## 6. Kết quả kiểm tra và build

Bản GitHub được chuẩn bị trên nền `main` tại commit `c65ad16`. Chỉ các file của thay đổi email được đưa vào commit, các thay đổi riêng đang có trong thư mục làm việc không được đưa kèm.

- Frontend: 62/62 test vượt qua, gồm 16 test email mới và 46 test sẵn có.
- `npm run build`: thành công với Node 24.22.1.
- `npm run lint`: thành công.
- `docker compose --env-file ../../.env -p nhom10-m1-email-validation build`: thành công với sáu image frontend, gateway, Identity, POI, Localization và Audio. Các lớp backend không thay đổi có thể dùng build cache. Dockerfile backend hiện dùng `-DskipTests`, vì vậy build image không phải bằng chứng đã chạy lại backend test.

Các test email sử dụng API mock và DOM mô phỏng. Kết quả trên không phải lần chạy lại bộ nghiệm thu HTTP/SQL 71 ca và không khẳng định toàn bộ dự án không còn lỗi.

## 7. Câu trả lời ngắn khoảng một phút

“Em bổ sung kiểm tra email cho UC08, đăng nhập Admin của phần M1. Trước đây form có type=email nhưng thông báo tùy trình duyệt. Em tạo helper dùng chung để lấy kết quả kiểm tra của trình duyệt, kiểm tra thêm giới hạn 150 ký tự giống backend và hiển thị thông báo tiếng Việt ngay dưới email. Em áp dụng cho trang Admin và form đăng nhập dùng chung. Email sai thì dừng trước khi gọi API. Khi sửa email, lỗi cũ được xóa và lần gửi tiếp theo kiểm tra lại. Email đúng vẫn cần backend xác thực mật khẩu và quyền ADMIN. Em thêm 16 test cho hai form, tổng 62 test frontend đều qua, đồng thời build frontend, lint và build sáu image thành công. Minh chứng là commit và PR của nhánh fix/m1-admin-email-validation trên tài khoản M1.”
