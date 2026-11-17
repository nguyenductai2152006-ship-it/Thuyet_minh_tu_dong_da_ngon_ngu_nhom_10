// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdminPage from "../pages/AdminPage";
import { getCurrentUser, login, logout } from "../api/api";
vi.mock("../components/AdminDashboard", () => ({ default: () => <div>Dashboard ready</div> }));
vi.mock("../api/api", () => ({ getCurrentUser: vi.fn(), login: vi.fn(), logout: vi.fn() }));
beforeEach(() => {
    vi.resetAllMocks(); localStorage.clear();
    logout.mockImplementation(() => { localStorage.clear(); });
});
afterEach(cleanup);
it("does not show the dashboard before /me validates an ADMIN", async () => {
    localStorage.setItem("accessToken", "saved");
    let resolve;
    getCurrentUser.mockImplementation(() => new Promise((done) => { resolve = done; }));
    render(<AdminPage />);
    expect(screen.queryByText("Dashboard ready")).toBeNull();
    await act(async () => resolve({ role: "ADMIN", email: "admin@test.invalid" }));
    await screen.findByText("Dashboard ready");
});
it("clears a token when login succeeds but verification fails", async () => {
    login.mockImplementation(async () => { localStorage.setItem("accessToken", "new"); return { role: "ADMIN" }; });
    getCurrentUser.mockRejectedValue(new Error("verification failed"));
    render(<AdminPage />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Email quản trị"), "admin@test.invalid");
    await user.type(screen.getByLabelText("Mật khẩu"), "test-password");
    await user.click(screen.getByRole("button", { name: "Đăng nhập vào Admin" }));
    await screen.findByText("verification failed");
    expect(localStorage.getItem("accessToken")).toBeNull();
});
it("rejects USER login without rendering Admin", async () => {
    login.mockResolvedValue({ role: "USER" });
    render(<AdminPage />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Email quản trị"), "user@test.invalid");
    await user.type(screen.getByLabelText("Mật khẩu"), "password");
    await user.click(screen.getByRole("button", { name: "Đăng nhập vào Admin" }));
    await screen.findByText("Tài khoản này không có quyền ADMIN.");
    expect(screen.queryByText("Dashboard ready")).toBeNull();
    expect(logout).toHaveBeenCalled();
});
it("returns to login after a 401 notification", async () => {
    localStorage.setItem("accessToken", "saved");
    getCurrentUser.mockResolvedValue({ role: "ADMIN" });
    render(<AdminPage />);
    await screen.findByText("Dashboard ready");
    act(() => window.dispatchEvent(new Event("hoianguide:unauthorized")));
    await waitFor(() => expect(screen.queryByText("Dashboard ready")).toBeNull());
    expect(localStorage.getItem("accessToken")).toBeNull();
});
