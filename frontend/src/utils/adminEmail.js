// Reuse the browser email rules and the Identity Service limit (150 characters).
export function getAdminEmailError(input) {
    if (!input.value.trim()) return "Vui lòng nhập địa chỉ email quản trị.";
    if (input.validity.typeMismatch) return "Đây không phải là một địa chỉ email hợp lệ.";
    if (input.value.trim().length > 150) return "Địa chỉ email không được vượt quá 150 ký tự.";
    return "";
}
