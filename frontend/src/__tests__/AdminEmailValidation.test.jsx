// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdminPage from "../pages/AdminPage";
import LoginForm from "../components/LoginForm";
import { getCurrentUser, login } from "../api/api";

vi.mock("../components/AdminDashboard", () => ({ default: () => <div>Dashboard ready</div> }));
vi.mock("../api/api", () => ({ getCurrentUser: vi.fn(), login: vi.fn(), logout: vi.fn() }));

beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
    login.mockResolvedValue({ role: "ADMIN" });
    getCurrentUser.mockResolvedValue({ role: "ADMIN", email: "admin@example.com" });
});
afterEach(cleanup);

describe.each([
    ["AdminPage", AdminPage],
    ["LoginForm", LoginForm],
])("%s email validation", (_name, Component) => {
    it.each(["abc", "abc@", "abc gmail.com", "a@@example.com"])("blocks malformed email %s before calling the API", async (email) => {
        const { container } = render(<Component onLoginSuccess={vi.fn()} />);
        const user = userEvent.setup();
        await user.type(screen.getByLabelText("Email quản trị"), email);
        await user.type(screen.getByLabelText("Mật khẩu"), "test-password");
        await user.click(container.querySelector('button[type="submit"]'));
        expect(screen.getByRole("alert").textContent).toBe("Đây không phải là một địa chỉ email hợp lệ.");
        expect(screen.getByLabelText("Email quản trị").getAttribute("aria-invalid")).toBe("true");
        expect(document.activeElement).toBe(screen.getByLabelText("Email quản trị"));
        expect(login).not.toHaveBeenCalled();
        expect(getCurrentUser).not.toHaveBeenCalled();
    });

    it("asks for an email when left blank", async () => {
        const { container } = render(<Component onLoginSuccess={vi.fn()} />);
        const user = userEvent.setup();
        await user.type(screen.getByLabelText("Mật khẩu"), "test-password");
        await user.click(container.querySelector('button[type="submit"]'));
        expect(screen.getByRole("alert").textContent).toBe("Vui lòng nhập địa chỉ email quản trị.");
        expect(login).not.toHaveBeenCalled();
    });

    it("also rejects invalid input when native form validation is bypassed", () => {
        const { container } = render(<Component onLoginSuccess={vi.fn()} />);
        fireEvent.change(screen.getByLabelText("Email quản trị"), { target: { value: "not-an-email" } });
        fireEvent.submit(container.querySelector("form"));
        expect(screen.getByRole("alert").textContent).toBe("Đây không phải là một địa chỉ email hợp lệ.");
        expect(login).not.toHaveBeenCalled();
    });

    it("enforces the Identity Service 150 character limit", async () => {
        const { container } = render(<Component onLoginSuccess={vi.fn()} />);
        const user = userEvent.setup();
        fireEvent.change(screen.getByLabelText("Email quản trị"), { target: { value: `${"a".repeat(140)}@example.com` } });
        await user.type(screen.getByLabelText("Mật khẩu"), "test-password");
        await user.click(container.querySelector('button[type="submit"]'));
        expect(screen.getByRole("alert").textContent).toBe("Địa chỉ email không được vượt quá 150 ký tự.");
        expect(login).not.toHaveBeenCalled();
    });

    it("clears the validation error and allows login after correcting the email", async () => {
        const onLoginSuccess = vi.fn();
        const { container } = render(<Component onLoginSuccess={onLoginSuccess} />);
        const user = userEvent.setup();
        const emailInput = screen.getByLabelText("Email quản trị");
        await user.type(emailInput, "invalid");
        await user.type(screen.getByLabelText("Mật khẩu"), "test-password");
        await user.click(container.querySelector('button[type="submit"]'));
        await user.clear(emailInput);
        await user.type(emailInput, "admin+demo@example.com");
        expect(screen.queryByRole("alert")).toBeNull();
        expect(emailInput.getAttribute("aria-invalid")).toBe("false");
        await user.click(container.querySelector('button[type="submit"]'));
        expect(login).toHaveBeenCalledExactlyOnceWith("admin+demo@example.com", "test-password");
        if (Component === AdminPage) {
            await screen.findByText("Dashboard ready");
            expect(getCurrentUser).toHaveBeenCalledOnce();
        } else {
            expect(onLoginSuccess).toHaveBeenCalledOnce();
        }
    });
});
