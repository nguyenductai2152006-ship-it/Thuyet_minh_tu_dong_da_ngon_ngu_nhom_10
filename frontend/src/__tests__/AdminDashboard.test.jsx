// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdminDashboard from "../components/AdminDashboard";
import * as api from "../api/api";

vi.mock("../api/api", () => ({
    default: { get: vi.fn() }, getAdminPois: vi.fn(), createPoi: vi.fn(), updatePoi: vi.fn(), deletePoi: vi.fn(),
    getLocalizationsForPoi: vi.fn(), createLocalization: vi.fn(), updateLocalization: vi.fn(), deleteLocalization: vi.fn(),
    getAudiosForPoi: vi.fn(), createAudio: vi.fn(), updateAudio: vi.fn(), deleteAudio: vi.fn(),
}));
const pois = Array.from({ length: 7 }, (_, i) => ({ id: i + 3, name: `POI ${i + 3}`, description: "Description", qrCode: `QR_${i + 3}`,
    latitude: 15.87, longitude: 108.3, radius: 30, status: "ACTIVE", imageUrl: "/Images/keep.jpg" }));
let devices;
let failedContent = false;

beforeEach(() => {
    vi.resetAllMocks();
    failedContent = false;
    devices = pois.map((poi, i) => ({ deviceId: `device-${i}`, platform: "Android", browserName: "Chrome", deviceType: "MOBILE", eventCount: 2,
        active: true, lastSeenEpochMs: Date.now() - (i === 0 ? 1000 : 120_000), lastSeen: "2026-10-28T09:00:00" }));
    api.getAdminPois.mockResolvedValue(pois);
    api.getLocalizationsForPoi.mockImplementation(async (id) => {
        if (failedContent) throw new Error("localization unavailable");
        return [{ id, poiId: id, languageCode: "vi", localizedName: `Bản dịch ${id}`, localizedDescription: "Mô tả" }];
    });
    api.getAudiosForPoi.mockImplementation(async (id) => [{ id, poiId: id, languageCode: "vi", audioUrl: `/audio/${id}-vi.mp3`, durationSeconds: 45 }]);
    api.default.get.mockImplementation(async (url) => ({ data: url.endsWith("devices") ? devices : url.endsWith("sessions") ? [] : url.endsWith("top") ? [{ poiId: 3, views: 10 }] : { pageViews: 7, activeSessions: 1, uniqueVisitors: 7, sessions: 7, qrOpens: 0 } }));
});
afterEach(cleanup);
async function openTab(name) {
    const user = userEvent.setup();
    render(<AdminDashboard />);
    await waitFor(() => expect(api.getAudiosForPoi).toHaveBeenCalled());
    await user.click(screen.getByRole("button", { name }));
    return user;
}

describe("AdminDashboard integration at the API boundary", () => {
    it("shows five devices then two, and old events are not green", async () => {
        const user = await openTab(/Thiết bị & phiên/);
        await screen.findByText("device-0");
        expect(screen.getByRole("table").querySelectorAll("tbody tr")).toHaveLength(5);
        const table = screen.getByRole("table");
        expect(within(table).getAllByText("Không hoạt động gần đây")).toHaveLength(4);
        expect(within(table).getAllByText("Gần đây")).toHaveLength(1);
        await user.click(screen.getByRole("button", { name: "Trang sau thiết bị" }));
        expect(screen.getByRole("table").querySelectorAll("tbody tr")).toHaveLength(2);
        expect(screen.queryByText("device-0")).toBeNull();
        expect(screen.getByText("6–7 / 7 dòng · 5 dòng/trang")).toBeTruthy();
    });
    it("clamps the device page when refresh shrinks the dataset", async () => {
        const user = await openTab(/Thiết bị & phiên/);
        await screen.findByText("device-0");
        await user.click(screen.getByRole("button", { name: "Trang sau thiết bị" }));
        devices = devices.slice(0, 2);
        await user.click(screen.getByRole("button", { name: /↻ Làm mới$/ }));
        await screen.findByText("device-0");
        expect(screen.getByText("1–2 / 2 dòng · 5 dòng/trang")).toBeTruthy();
    });
    it("resets POI pagination when filtering", async () => {
        const user = await openTab(/Địa điểm POI/);
        await user.click(screen.getByRole("button", { name: "Trang sau địa điểm" }));
        await user.type(screen.getByPlaceholderText("Tìm theo tên, ID hoặc mã QR…"), "POI 3");
        await waitFor(() => expect(screen.getByText("1–1 / 1 dòng · 5 dòng/trang")).toBeTruthy());
    });
    it("preserves imageUrl in a POI update", async () => {
        const user = await openTab(/Địa điểm POI/);
        await user.click(screen.getAllByRole("button", { name: "Sửa" })[0]);
        await user.click(screen.getByRole("button", { name: "Lưu vào database" }));
        await waitFor(() => expect(api.updatePoi).toHaveBeenCalledWith(3, expect.objectContaining({ imageUrl: "/Images/keep.jpg", qrCode: "QR_3" })));
    });
    it("saves an existing relative audio URL and locks its POI during editing", async () => {
        const user = await openTab(/Âm thanh/);
        await screen.findByText("/audio/3-vi.mp3");
        await user.click(screen.getAllByRole("button", { name: "Sửa" })[0]);
        expect(screen.getByLabelText("Địa điểm *").disabled).toBe(true);
        await user.click(screen.getByRole("button", { name: "Lưu metadata audio" }));
        await waitFor(() => expect(api.updateAudio).toHaveBeenCalledWith(3, expect.objectContaining({ audioUrl: "/audio/3-vi.mp3", durationSeconds: 45 })));
    });
    it("does not submit a blank duration and paginates translations too", async () => {
        const user = await openTab(/Âm thanh/);
        await user.click(screen.getByRole("button", { name: /Thêm audio/ }));
        await user.type(screen.getByLabelText(/URL audio \*/), "/audio/new.mp3");
        fireEvent.submit(screen.getByRole("button", { name: "Lưu metadata audio" }).closest("form"));
        await screen.findByText(/Thời lượng là số nguyên/);
        expect(api.createAudio).not.toHaveBeenCalled();
        await user.click(screen.getByRole("button", { name: /Đa ngôn ngữ/ }));
        await screen.findByText("Bản dịch 3");
        expect(screen.getByRole("table").querySelectorAll("tbody tr")).toHaveLength(5);
    });
    it("connects top POI to the actual monitoring tab", async () => {
        await openTab(/Giám sát truy cập/);
        await screen.findByRole("heading", { name: "Địa điểm được xem nhiều" });
        const table = screen.getAllByRole("table")[1];
        await waitFor(() => expect(table.textContent).toContain("POI 3"));
        const cells = within(table).getAllByRole("row")[1].querySelectorAll("td");
        expect(cells[2].textContent).toBe("10");
    });
    it("renders all eleven summary KPIs and uses the server active-session total", async () => {
        const summary={pageViews:101,uniqueVisitors:102,sessions:103,activeSessions:145,qrOpens:105,qrPoiOpens:106,audioPlays:107,poiViews:108,tourStarts:109,totalEvents:110,legacyQrOpens:111};
        const get=api.default.get.getMockImplementation();
        api.default.get.mockImplementation(async url=>url.endsWith("summary")?{data:summary}:get(url));
        await openTab(/Giám sát truy cập/);
        await screen.findByText("145");
        const cards=document.querySelectorAll(".hag-stat-grid--monitor .hag-stat");
        expect(cards).toHaveLength(11);
        expect(Array.from(cards).map(card=>Number(card.querySelector(".hag-stat__value").textContent))).toEqual([101,102,103,145,105,106,107,108,109,110,111]);
    });
    it("reports partial content failures rather than claiming an empty database", async () => {
        failedContent = true;
        render(<AdminDashboard />);
        await screen.findByText(/Số lượng bên dưới chưa đầy đủ/);
    });
    it("distinguishes a committed write from a failed refresh", async () => {
        const user = await openTab(/Địa điểm POI/);
        await user.click(screen.getAllByRole("button", { name: "Sửa" })[0]);
        api.getAdminPois.mockRejectedValueOnce(new Error("network"));
        await user.click(screen.getByRole("button", { name: "Lưu vào database" }));
        await screen.findByText(/Thay đổi đã được API chấp nhận/);
    });
});
