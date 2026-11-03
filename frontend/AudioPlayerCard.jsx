import { useEffect, useRef, useState } from "react";
import "./AudioPlayerCard.css";
import GoogleMapsDirections from "./GoogleMapsDirections";
import { getPoiDisplayName } from "../utils/googleMaps";

const FALLBACK_IMAGE =
    "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?q=80&w=800&auto=format&fit=crop";

function formatTime(time) {
    if (!Number.isFinite(time) || time < 0) return "00:00";

    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function AudioPlayerCard({
    poi,
    localization,
    audio,
    selectedLanguage,
    onClose,
    onSpeak,
    onStopSpeaking,
    isSpeaking = false,
    autoPlayRequested = false,
    onAutoPlayHandled,
}) {
    const audioRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(Number(audio?.durationSeconds) || 0);
    const [imageError, setImageError] = useState(false);
    const [playError, setPlayError] = useState("");

    // Accept an absolute HTTP(S) URL or a local MP3 under frontend/public/audio.
    const audioUrl = typeof audio?.audioUrl === "string" ? audio.audioUrl.trim() : "";
    const hasRealAudio = Boolean(
        audioUrl &&
        !/example\.com/i.test(audioUrl) &&
        (/^https?:\/\/\S+$/i.test(audioUrl) ||
            /^\/audio\/[A-Za-z0-9_-]+\.mp3(?:[?#].*)?$/i.test(audioUrl))
    );

    const title = getPoiDisplayName(
        poi,
        selectedLanguage?.code || "vi",
        localization?.localizedName
    );
    const description = localization?.localizedDescription || poi?.description || "";

    // Reset the player when the selected POI/language returns a different audio URL.
    useEffect(() => {
        setIsPlaying(false);
        setProgress(0);
        setCurrentTime(0);
        setDuration(Number(audio?.durationSeconds) || 0);
        setPlayError("");

        const player = audioRef.current;
        if (player) {
            player.pause();
            if (hasRealAudio) player.load();
        }
    }, [audioUrl, audio?.durationSeconds, hasRealAudio]);

    useEffect(() => {
        setImageError(false);
    }, [poi?.imageUrl, poi?.id]);

    // Try to autoplay real audio once the selected POI has loaded.
    // Browsers can block playback after asynchronous work; in that case the manual
    // Play button remains available and a readable message is shown.
    useEffect(() => {
        if (!autoPlayRequested) return undefined;

        const player = audioRef.current;
        if (!player || !hasRealAudio) {
            onAutoPlayHandled?.();
            return undefined;
        }

        let cancelled = false;
        let attempted = false;

        const attemptPlay = async () => {
            if (cancelled || attempted) return;
            attempted = true;

            try {
                setPlayError("");
                await player.play();
            } catch (error) {
                if (cancelled) return;
                console.warn("Autoplay audio bị từ chối hoặc thất bại:", error);
                if (error?.name === "NotAllowedError") {
                    setPlayError("Trình duyệt chặn tự phát âm thanh. Hãy nhấn nút Play để nghe.");
                } else {
                    setPlayError("Không phát được tệp âm thanh. Hãy nhấn Play để thử lại hoặc kiểm tra URL audio.");
                }
            } finally {
                if (!cancelled) onAutoPlayHandled?.();
            }
        };

        const handleMediaError = () => {
            if (cancelled || attempted) return;
            attempted = true;
            setPlayError("Không tải được tệp âm thanh. Hãy kiểm tra URL audio hoặc thử giọng đọc trình duyệt.");
            onAutoPlayHandled?.();
        };

        if (player.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
            void attemptPlay();
        } else {
            player.addEventListener("canplay", attemptPlay, { once: true });
            player.addEventListener("error", handleMediaError, { once: true });
            player.load();
        }

        return () => {
            cancelled = true;
            player.removeEventListener("canplay", attemptPlay);
            player.removeEventListener("error", handleMediaError);
        };
    }, [autoPlayRequested, hasRealAudio, audioUrl, onAutoPlayHandled]);

    useEffect(() => {
        const player = audioRef.current;
        return () => {
            if (player) player.pause();
        };
    }, []);

    async function togglePlayPause() {
        const player = audioRef.current;
        if (!player || !hasRealAudio) return;

        if (!player.paused) {
            player.pause();
            return;
        }

        try {
            setPlayError("");
            await player.play();
        } catch (error) {
            console.error("Không thể phát tệp âm thanh:", error);
            setPlayError(
                error?.name === "NotAllowedError"
                    ? "Trình duyệt chưa cho phép phát. Hãy nhấn Play lần nữa sau khi tương tác với trang."
                    : "Không phát được tệp âm thanh. Hãy kiểm tra URL hoặc thử đọc bằng giọng trình duyệt."
            );
        }
    }

    function handleTimeUpdate() {
        const player = audioRef.current;
        if (!player) return;

        const total = Number.isFinite(player.duration) ? player.duration : 0;
        setCurrentTime(player.currentTime || 0);
        setDuration(total || Number(audio?.durationSeconds) || 0);
        setProgress(total > 0 ? (player.currentTime / total) * 100 : 0);
    }

    function handleProgressChange(event) {
        const player = audioRef.current;
        if (!player || !Number.isFinite(player.duration)) return;

        const nextProgress = Number(event.target.value);
        player.currentTime = (nextProgress / 100) * player.duration;
        setProgress(nextProgress);
        setCurrentTime(player.currentTime);
    }

    function handleClose() {
        if (audioRef.current) audioRef.current.pause();
        onStopSpeaking?.();
        onClose?.();
    }

    return (
        <section className="audio-card-container">
            <button type="button" className="back-scan-btn" onClick={handleClose}>
                <span aria-hidden="true">←</span>
                Quét địa điểm khác
            </button>

            <div className="cover-container">
                <img
                    src={!imageError && poi?.imageUrl ? poi.imageUrl : FALLBACK_IMAGE}
                    alt={title}
                    className="poi-cover-img"
                    onError={() => setImageError(true)}
                />
                <div className="cover-overlay">
                    <span className="lang-badge">
                        {selectedLanguage?.name || audio?.languageCode || "Tiếng Việt"}
                    </span>
                </div>
            </div>

            <div className="audio-card-body">
                <p className="audio-eyebrow">HOIANGUIDE · THUYẾT MINH DU LỊCH</p>
                <h2 className="poi-title-xl">{title}</h2>

                <div className="google-maps-directions-wrapper">
                    <GoogleMapsDirections poi={poi} />
                </div>

                {hasRealAudio ? (
                    <div className="custom-player">
                        <audio
                            ref={audioRef}
                            src={audioUrl}
                            preload="metadata"
                            onTimeUpdate={handleTimeUpdate}
                            onLoadedMetadata={handleTimeUpdate}
                            onDurationChange={handleTimeUpdate}
                            onPlay={() => setIsPlaying(true)}
                            onPause={() => setIsPlaying(false)}
                            onEnded={() => {
                                setIsPlaying(false);
                                setProgress(100);
                            }}
                            onError={() => {
                                setIsPlaying(false);
                                setPlayError("Không thể tải tệp âm thanh này.");
                            }}
                        />

                        <div className="player-controls">
                            <button
                                type="button"
                                className="play-pause-btn"
                                onClick={togglePlayPause}
                                aria-label={isPlaying ? "Tạm dừng" : "Phát thuyết minh"}
                            >
                                {isPlaying ? "Ⅱ" : "▶"}
                            </button>
                            <div className="progress-container">
                                <input
                                    type="range"
                                    className="progress-slider"
                                    min="0"
                                    max="100"
                                    step="0.1"
                                    value={progress}
                                    onChange={handleProgressChange}
                                    aria-label="Tiến trình phát âm thanh"
                                />
                                <div className="time-display">
                                    <span>{formatTime(currentTime)}</span>
                                    <span>{formatTime(duration)}</span>
                                </div>
                            </div>
                        </div>

                        {playError && <p className="player-error" role="alert">{playError}</p>}
                    </div>
                ) : (
                    <div className="no-audio-alert">
                        <strong>Chưa có tệp thu âm thật</strong>
                        <p>Bạn có thể dùng giọng đọc của trình duyệt để nghe phần giới thiệu địa điểm.</p>
                        <div className="speech-controls">
                            <button
                                type="button"
                                className="speech-button"
                                onClick={onSpeak}
                                disabled={!description.trim() && !title}
                            >
                                {isSpeaking ? "Đang đọc thuyết minh…" : "▶ Đọc thuyết minh"}
                            </button>
                            {isSpeaking && (
                                <button type="button" className="speech-stop-button" onClick={onStopSpeaking}>
                                    Dừng đọc
                                </button>
                            )}
                        </div>
                    </div>
                )}

                <div className="poi-text-content">
                    <h3>Giới thiệu địa điểm</h3>
                    <p>{description || "Chưa có nội dung giới thiệu cho địa điểm này."}</p>
                </div>
            </div>
        </section>
    );
}

export default AudioPlayerCard;
