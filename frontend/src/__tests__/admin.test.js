import { describe, expect, it } from "vitest";
import { pageSlice, isRecentlyActive, normalizeSearch, validAudioUrl, validCoordinates, safeAssetUrl } from "../utils/admin";

describe("Admin pagination and validation", () => {
    it("splits seven records into five and two without loss", () => {
        const rows = Array.from({ length: 7 }, (_, i) => i + 1);
        expect(pageSlice(rows, 1).rows).toEqual([1, 2, 3, 4, 5]);
        expect(pageSlice(rows, 2).rows).toEqual([6, 7]);
    });
    it("clamps the page after deletion and handles an empty list", () => {
        expect(pageSlice([1, 2], 4)).toMatchObject({ page: 1, from: 1, to: 2 });
        expect(pageSlice([], 5)).toMatchObject({ page: 1, from: 0, to: 0, rows: [] });
    });
    it("never treats a stale active flag as current", () => {
        const now = Date.now();
        expect(isRecentlyActive({ active: true, lastSeenEpochMs: now - 60_000 }, now, now)).toBe(false);
        expect(isRecentlyActive({ lastSeenEpochMs: now - 1000 }, now, now)).toBe(true);
        expect(isRecentlyActive({}, now, now)).toBe(false);
        expect(isRecentlyActive({ active: true }, now + 31_000, now)).toBe(false);
        expect(isRecentlyActive({ lastSeenEpochMs: now + 60_000 }, now, now)).toBe(false);
    });
    it("supports the local audio URLs used by all demo records", () => {
        expect(validAudioUrl("/audio/3-vi.mp3")).toBe(true);
        expect(validAudioUrl("https://example.org/guide.mp3")).toBe(true);
        expect(validAudioUrl("javascript:alert(1)")).toBe(false);
        expect(validAudioUrl("//other.test/file.mp3")).toBe(false);
        expect(validAudioUrl("/audio/../file.mp3")).toBe(false);
    });
    it("does not normalize null coordinates into zero", () => {
        expect(validCoordinates(null, null)).toBe(false);
        expect(validCoordinates("", 108)).toBe(false);
        expect(validCoordinates(0, 0)).toBe(true);
        expect(validCoordinates(91, 108)).toBe(false);
    });
    it("normalizes Vietnamese search and prevents unsafe links", () => {
        expect(normalizeSearch("Quảng Đông")).toBe("quang dong");
        expect(safeAssetUrl("javascript:alert(1)")).toBe(null);
        expect(safeAssetUrl("/Images/test.jpg")).toBe("/Images/test.jpg");
    });
});
