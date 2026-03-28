"use client";

import { Play, Pause, Volume2, VolumeX, Maximize, RotateCcw, RotateCw } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";

export default function CustomVideoPlayer({ url }: { url: string }) {
    
    const displayUrl = url;

    const getYouTubeId = (link: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = link.match(regExp);
        return match && match[2].length === 11 ? match[2] : null;
    };

    const getGoogleDriveId = (link: string) => {
        const match = link.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
        return match ? match[1] : null;
    };

    const youtubeId = getYouTubeId(displayUrl);

    if (youtubeId) {
        return (
            <div className="w-full h-full relative group">
                <iframe
                    className="w-full h-full object-cover"
                    src={`https://www.youtube.com/embed/${youtubeId}?autoplay=0&rel=0&showinfo=0`}
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                />
            </div>
        );
    }

    const googleDriveId = getGoogleDriveId(displayUrl);

    if (googleDriveId) {
        return (
            <div className="w-full h-full relative group">
                <iframe
                    className="w-full h-full"
                    src={`https://drive.google.com/file/d/${googleDriveId}/preview`}
                    title="Google Drive video player"
                    frameBorder="0"
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                />
            </div>
        );
    }

    return <NativeVideoPlayer url={displayUrl} />;
}

function formatTime(s: number) {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
}

function NativeVideoPlayer({ url }: { url: string }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const progressRef = useRef<HTMLDivElement>(null);
    const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [volume, setVolume] = useState(1);
    const [showControls, setShowControls] = useState(true);
    const [hoverPct, setHoverPct] = useState<number | null>(null);

    const scheduleHide = useCallback(() => {
        if (hideTimer.current) clearTimeout(hideTimer.current);
        setShowControls(true);
        hideTimer.current = setTimeout(() => {
            if (videoRef.current && !videoRef.current.paused) setShowControls(false);
        }, 2500);
    }, []);

    useEffect(() => () => { if (hideTimer.current) clearTimeout(hideTimer.current); }, []);

    const togglePlay = () => {
        if (!videoRef.current) return;
        isPlaying ? videoRef.current.pause() : videoRef.current.play();
        setIsPlaying(!isPlaying);
    };

    const toggleMute = () => {
        if (!videoRef.current) return;
        videoRef.current.muted = !isMuted;
        setIsMuted(!isMuted);
    };

    const skip = (n: number) => {
        if (videoRef.current) videoRef.current.currentTime += n;
    };

    const handleTimeUpdate = () => {
        const v = videoRef.current;
        if (!v) return;
        setCurrentTime(v.currentTime);
        setProgress(v.duration ? (v.currentTime / v.duration) * 100 : 0);
    };

    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        const el = progressRef.current;
        const v = videoRef.current;
        if (!el || !v) return;
        const { left, width } = el.getBoundingClientRect();
        v.currentTime = ((e.clientX - left) / width) * (v.duration || 0);
    };

    const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        setVolume(val);
        if (videoRef.current) {
            videoRef.current.volume = val;
            videoRef.current.muted = val === 0;
            setIsMuted(val === 0);
        }
    };

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Geist+Mono:wght@300;400&display=swap');

                .vp {
                    position: relative;
                    width: 100%; height: 100%;
                    background: #0c0c0c;
                    overflow: hidden;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .vp video {
                    width: 100%; height: 100%;
                    object-fit: contain;
                    display: block;
                    cursor: pointer;
                }

                /* ─── Controls shell ─── */
                .vp-ctrl {
                    position: absolute;
                    bottom: 0; left: 0; right: 0;
                    padding: 52px 18px 16px;
                    background: linear-gradient(to top, rgba(0,0,0,0.72) 0%, transparent 100%);
                    transition: opacity 0.22s ease, transform 0.22s ease;
                    z-index: 6;
                }
                .vp-ctrl.hide {
                    opacity: 0;
                    transform: translateY(4px);
                    pointer-events: none;
                }

                /* ─── Progress bar ─── */
                .vp-prog {
                    position: relative;
                    height: 18px;
                    display: flex;
                    align-items: center;
                    cursor: pointer;
                    margin-bottom: 10px;
                }
                .vp-prog-track {
                    position: relative;
                    width: 100%;
                    height: 2px;
                    background: rgba(255,255,255,0.1);
                    border-radius: 99px;
                    transition: height 0.15s ease;
                }
                .vp-prog:hover .vp-prog-track { height: 3px; }

                .vp-prog-ghost {
                    position: absolute; top: 0; left: 0; height: 100%;
                    background: rgba(255,255,255,0.18);
                    border-radius: 99px;
                    pointer-events: none;
                    transition: width 0.04s linear;
                }
                .vp-prog-fill {
                    position: absolute; top: 0; left: 0; height: 100%;
                    background: rgba(255,255,255,0.85);
                    border-radius: 99px;
                    transition: width 0.08s linear;
                }
                .vp-prog-dot {
                    position: absolute; top: 50%;
                    width: 10px; height: 10px;
                    background: #fff;
                    border-radius: 50%;
                    transform: translate(-50%, -50%) scale(0);
                    pointer-events: none;
                    transition: transform 0.16s ease;
                }
                .vp-prog:hover .vp-prog-dot { transform: translate(-50%, -50%) scale(1); }

                /* ─── Bottom row ─── */
                .vp-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }
                .vp-group { display: flex; align-items: center; gap: 0; }

                /* ─── Buttons ─── */
                .vp-btn {
                    background: none; border: none;
                    color: rgba(255,255,255,0.4);
                    padding: 6px 8px;
                    border-radius: 5px;
                    cursor: pointer;
                    display: flex; align-items: center; gap: 3px;
                    transition: color 0.12s, background 0.12s;
                    line-height: 1;
                    font-family: 'Geist Mono', monospace;
                    font-size: 9px;
                    letter-spacing: 0.05em;
                }
                .vp-btn:hover {
                    color: rgba(255,255,255,0.9);
                    background: rgba(255,255,255,0.06);
                }

                .vp-btn-play {
                    color: rgba(255,255,255,0.88);
                    padding: 6px 10px;
                    margin-right: 6px;
                }
                .vp-btn-play:hover {
                    color: #fff;
                    background: rgba(255,255,255,0.08);
                }

                /* ─── Time ─── */
                .vp-time {
                    font-family: 'Geist Mono', monospace;
                    font-size: 10px;
                    letter-spacing: 0.06em;
                    color: rgba(255,255,255,0.35);
                    padding: 0 10px;
                    white-space: nowrap;
                }
                .vp-time em {
                    color: rgba(255,255,255,0.78);
                    font-style: normal;
                }

                /* ─── Volume ─── */
                .vp-vol-group { display: flex; align-items: center; }
                .vp-vol-expand {
                    display: flex; align-items: center;
                    max-width: 0; overflow: hidden;
                    opacity: 0;
                    transition: max-width 0.22s ease, opacity 0.22s ease;
                }
                .vp-vol-group:hover .vp-vol-expand { max-width: 64px; opacity: 1; }

                .vp-vol-expand input[type=range] {
                    -webkit-appearance: none; appearance: none;
                    width: 52px; height: 2px;
                    border-radius: 99px;
                    background: linear-gradient(
                        to right,
                        rgba(255,255,255,0.75) 0%,
                        rgba(255,255,255,0.75) var(--v, 100%),
                        rgba(255,255,255,0.12) var(--v, 100%),
                        rgba(255,255,255,0.12) 100%
                    );
                    outline: none; cursor: pointer; margin-right: 4px;
                }
                .vp-vol-expand input[type=range]::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    width: 9px; height: 9px;
                    background: #fff; border-radius: 50%; cursor: pointer;
                }

                /* ─── Center play overlay ─── */
                .vp-center {
                    position: absolute; inset: 0;
                    display: flex; align-items: center; justify-content: center;
                    cursor: pointer; z-index: 5;
                }
                .vp-center-ring {
                    width: 54px; height: 54px;
                    border-radius: 50%;
                    border: 1px solid rgba(255,255,255,0.18);
                    background: rgba(10,10,10,0.4);
                    backdrop-filter: blur(14px);
                    -webkit-backdrop-filter: blur(14px);
                    display: flex; align-items: center; justify-content: center;
                    transition: border-color 0.18s, transform 0.18s, background 0.18s;
                }
                .vp-center:hover .vp-center-ring {
                    border-color: rgba(255,255,255,0.42);
                    background: rgba(10,10,10,0.55);
                    transform: scale(1.06);
                }
            `}</style>

            <div
                className="vp"
                onMouseMove={scheduleHide}
                onMouseEnter={scheduleHide}
            >
                <video
                    ref={videoRef}
                    src={url}
                    onClick={togglePlay}
                    onPlay={() => { setIsPlaying(true); scheduleHide(); }}
                    onPause={() => { setIsPlaying(false); setShowControls(true); }}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
                />

                {/* Center play */}
                {!isPlaying && (
                    <div className="vp-center" onClick={togglePlay}>
                        <div className="vp-center-ring">
                            <Play style={{ width: 18, height: 18, color: "#fff", fill: "#fff", marginLeft: 2 }} />
                        </div>
                    </div>
                )}

                {/* Controls */}
                <div className={`vp-ctrl${showControls ? "" : " hide"}`}>
                    {/* Scrub */}
                    <div
                        ref={progressRef}
                        className="vp-prog"
                        onClick={handleSeek}
                        onMouseMove={e => {
                            const r = progressRef.current!.getBoundingClientRect();
                            setHoverPct(((e.clientX - r.left) / r.width) * 100);
                        }}
                        onMouseLeave={() => setHoverPct(null)}
                    >
                        <div className="vp-prog-track">
                            {hoverPct !== null && (
                                <div className="vp-prog-ghost" style={{ width: `${hoverPct}%` }} />
                            )}
                            <div className="vp-prog-fill" style={{ width: `${progress}%` }} />
                            <div className="vp-prog-dot"   style={{ left: `${progress}%` }} />
                        </div>
                    </div>

                    {/* Bottom row */}
                    <div className="vp-row">
                        <div className="vp-group">
                            <button className="vp-btn vp-btn-play" onClick={togglePlay}>
                                {isPlaying
                                    ? <Pause style={{ width: 15, height: 15, fill: "currentColor" }} />
                                    : <Play  style={{ width: 15, height: 15, fill: "currentColor", marginLeft: 1 }} />
                                }
                            </button>

                            <button className="vp-btn" onClick={() => skip(-10)}>
                                <RotateCcw style={{ width: 12, height: 12 }} />
                                <span>10</span>
                            </button>

                            <button className="vp-btn" onClick={() => skip(10)}>
                                <RotateCw style={{ width: 12, height: 12 }} />
                                <span>10</span>
                            </button>

                            <div className="vp-time">
                                <em>{formatTime(currentTime)}</em> / {formatTime(duration)}
                            </div>
                        </div>

                        <div className="vp-group">
                            <div className="vp-vol-group">
                                <button className="vp-btn" onClick={toggleMute}>
                                    {isMuted
                                        ? <VolumeX style={{ width: 13, height: 13 }} />
                                        : <Volume2 style={{ width: 13, height: 13 }} />
                                    }
                                </button>
                                <div className="vp-vol-expand">
                                    <input
                                        type="range" min={0} max={1} step={0.02}
                                        value={isMuted ? 0 : volume}
                                        onChange={handleVolume}
                                        style={{ "--v": `${(isMuted ? 0 : volume) * 100}%` } as React.CSSProperties}
                                    />
                                </div>
                            </div>

                            <button className="vp-btn" onClick={() => videoRef.current?.requestFullscreen()}>
                                <Maximize style={{ width: 12, height: 12 }} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}