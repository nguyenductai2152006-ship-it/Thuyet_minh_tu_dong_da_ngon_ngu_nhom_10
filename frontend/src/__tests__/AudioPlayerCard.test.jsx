// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render } from "@testing-library/react";
import AudioPlayerCard from "../components/AudioPlayerCard";
import { trackAnalytics } from "../api/analytics";
vi.mock("../api/analytics", () => ({ trackAnalytics: vi.fn() }));
vi.mock("../components/GoogleMapsDirections", () => ({ default: () => null }));
beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
    vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(() => {});
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
const props = { poi: { id: 3, name: "POI", description: "Text" }, selectedLanguage: { code: "vi" }, audio: { audioUrl: "/audio/3-vi.mp3", durationSeconds: 45 } };
it("tracks a successful MP3 start once, without counting pause/resume twice", () => {
    const { container } = render(<AudioPlayerCard {...props} />);
    const player = container.querySelector("audio");
    expect(trackAnalytics).not.toHaveBeenCalled();
    fireEvent.play(player); fireEvent.pause(player); fireEvent.play(player);
    expect(trackAnalytics).toHaveBeenCalledTimes(1);
    expect(trackAnalytics).toHaveBeenCalledWith("audio_play", { poiId: 3, source: "audio_file" });
});
it("does not count media errors and starts a new count after changing recording", () => {
    const { container, rerender } = render(<AudioPlayerCard {...props} />);
    fireEvent.error(container.querySelector("audio"));
    expect(trackAnalytics).not.toHaveBeenCalled();
    fireEvent.play(container.querySelector("audio"));
    rerender(<AudioPlayerCard {...props} audio={{ audioUrl: "/audio/3-en.mp3", durationSeconds: 50 }} />);
    fireEvent.play(container.querySelector("audio"));
    expect(trackAnalytics).toHaveBeenCalledTimes(2);
});
it("keeps the test source when a test recording starts", () => {
    const { container } = render(<AudioPlayerCard {...props} analyticsSource="browser-test" />);
    fireEvent.play(container.querySelector("audio"));
    expect(trackAnalytics).toHaveBeenCalledWith("audio_play", { poiId: 3, source: "browser-test" });
});
