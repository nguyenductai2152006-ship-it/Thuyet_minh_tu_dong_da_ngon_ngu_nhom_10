
import { useEffect, useRef, useState } from "react";
import "./AudioPlayerCard.css";

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
                         }) {
    const audioRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(
        Number(audio?.durationSeconds) || 0
    );
    const [imageError, setImageError] = useState(false);
    const [playError, setPlayError] = useState("");

    const hasRealAudio = Boolean(
        audio?.audioUrl &&
        /^https?:\/\//i.test(audio.audioUrl) &&
        !/example\.com/i.test(audio.audioUrl)
    );

    const title = localization?.localizedName || poi?.name || "Địa điểm Hội An";
    const description =
        localization?.localizedDescription || poi?.description || "";

    useEffect(() => {
        setIsPlaying(false);
        setProgress(0);
        setCurrentTime(0);
        setDuration(Number(audio?.durationSeconds) || 0);
        setPlayError("");

        const player = audioRef.current;
        if (player && hasRealAudio) {
            player.pause();
            player.load();
        }
    }, [audio?.audioUrl, audio?.durationSeconds, hasRealAudio]);

    useEffect(() => {
        setImageError(false);
    }, [poi?.imageUrl, poi?.id]);

    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
            }
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
                "Không phát được tệp âm thanh. Hãy kiểm tra URL hoặc thử đọc bằng giọng trình duyệt."
            );
        }
    }

    function handleTimeUpdate() {
        const player = audioRef.current;
        if (!player) return;

        const total = Number.isFinite(player.duration)
            ? player.duration
            : 0;

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
        if (audioRef.current) {
            audioRef.current.pause();
        }

        onStopSpeaking?.();
        onClose?.();
    }

    return (
        <section className="audio-card-container">
            <button
                type="button"
                className="back-scan-btn"
                onClick={handleClose}
            >
                <span aria-hidden="true">←</span>
                Quét địa điểm khác
            </button>

            <div className="cover-container">
                <img
                    src={
                        !imageError && poi?.imageUrl
                            ? poi.imageUrl
                            : FALLBACK_IMAGE
                    }
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

                {hasRealAudio ? (
                    <div className="custom-player">
                        <audio
                            ref={audioRef}
                            src={audio.audioUrl}
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

                        {playError && (
                            <p className="player-error" role="alert">
                                {playError}
                            </p>
                        )}
                    </div>
                ) : (
                    <div className="no-audio-alert">
                        <strong>Chưa có tệp thu âm thật</strong>
                        <p>
                            Bạn có thể dùng giọng đọc của trình duyệt để nghe
                            phần giới thiệu địa điểm.
                        </p>

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
                                <button
                                    type="button"
                                    className="speech-stop-button"
                                    onClick={onStopSpeaking}
                                >
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
