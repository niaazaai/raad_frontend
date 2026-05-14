import { useCallback, useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import {
  Compress,
  Expand,
  HelpCircle,
  Pause,
  Play,
  Settings,
  SoundHigh,
  SoundLow,
  SoundOff,
} from "iconoir-react";
import { cn } from "@/lib/utils";

export interface LessonVideoPlayerProps {
  src: string;
  playbackType?: "hls" | "progressive";
  qualities?: { label: string; src: string }[] | null;
  watermarkText?: string;
  onEnded?: () => void;
  className?: string;
}

interface HlsLevel {
  index: number;
  label: string;
}

type WatermarkPos = { top?: string; bottom?: string; left?: string; right?: string };

const WM_POSITIONS: WatermarkPos[] = [
  { top: "8%", left: "5%" },
  { top: "8%", right: "5%" },
  { top: "50%", left: "5%" },
  { top: "50%", right: "5%" },
];

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;
type SpeedOption = (typeof SPEED_OPTIONS)[number];

function fmt(s: number): string {
  if (!Number.isFinite(s) || s < 0) return "0:00";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

const SHORTCUTS = [
  { key: "Space / K", action: "Play / Pause" },
  { key: "← / →", action: "Seek ±5 seconds" },
  { key: "↑ / ↓", action: "Volume ±10%" },
  { key: "M", action: "Mute / Unmute" },
  { key: "F", action: "Fullscreen" },
  { key: "[ / ]", action: "Speed −0.25× / +0.25×" },
  { key: "0–9", action: "Jump to 0%–90%" },
];

const LessonVideoPlayer = ({
  src,
  playbackType,
  watermarkText,
  onEnded,
  className,
}: LessonVideoPlayerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wmTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const centerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seekingRef = useRef(false);
  const lastTimeRef = useRef(0);
  const bufferCheckRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onEndedRef = useRef<(() => void) | undefined>(onEnded);
  onEndedRef.current = onEnded;

  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [qualityMenuOpen, setQualityMenuOpen] = useState(false);
  const [speedMenuOpen, setSpeedMenuOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [hlsLevels, setHlsLevels] = useState<HlsLevel[]>([]);
  const [currentLevel, setCurrentLevel] = useState(-1);
  const [wmPosIdx, setWmPosIdx] = useState(0);
  const [centerIcon, setCenterIcon] = useState<"play" | "pause" | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState<SpeedOption>(1);
  const [volumeSliderVisible, setVolumeSliderVisible] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverX, setHoverX] = useState(0);
  const [devToolsOpen, setDevToolsOpen] = useState(false);

  // HLS or progressive setup
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    setError(null);
    setHlsLevels([]);
    setCurrentLevel(-1);
    setCurrentTime(0);
    setDuration(0);
    setBuffered(0);
    setPlaying(false);

    const isHls =
      playbackType === "hls" ||
      src.includes(".m3u8") ||
      (!playbackType && src.includes(".m3u8"));

    const destroyHls = () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };

    if (!isHls) {
      destroyHls();
      video.src = src;
      video.load();
      return () => {
        destroyHls();
        video.removeAttribute("src");
        video.load();
      };
    }

    const canNative =
      video.canPlayType("application/vnd.apple.mpegurl") !== "" ||
      video.canPlayType("application/x-mpegURL") !== "";

    if (canNative) {
      destroyHls();
      video.src = src;
      video.load();
      return () => {
        destroyHls();
        video.removeAttribute("src");
        video.load();
      };
    }

    if (!Hls.isSupported()) {
      setError("Video playback is not supported in this browser.");
      return;
    }

    destroyHls();
    const hls = new Hls({
      enableWorker: true,
      lowLatencyMode: false,
      maxBufferLength: 60,
      maxMaxBufferLength: 600,
      startLevel: -1,
      abrEwmaDefaultEstimate: 1_500_000,
      fragLoadingRetryDelay: 1000,
      fragLoadingMaxRetry: 3,
      manifestLoadingMaxRetry: 3,
      manifestLoadingRetryDelay: 1000,
    });
    hlsRef.current = hls;

    hls.on(Hls.Events.MANIFEST_PARSED, (_evt, data) => {
      const levels: HlsLevel[] = data.levels.map((l, i) => ({
        index: i,
        label: l.height ? `${l.height}p` : `Level ${i + 1}`,
      }));
      setHlsLevels(levels);
    });

    hls.on(Hls.Events.LEVEL_SWITCHED, (_evt, data) => {
      setCurrentLevel(data.level);
    });

    hls.on(Hls.Events.ERROR, (_evt, data) => {
      if (data.fatal) {
        setError(
          data.type === Hls.ErrorTypes.NETWORK_ERROR
            ? "Network error while loading video."
            : "Video playback error."
        );
      }
    });

    hls.loadSource(src);
    hls.attachMedia(video);

    return () => {
      destroyHls();
      video.removeAttribute("src");
      video.load();
    };
  }, [src, playbackType]);

  // Video event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => setPlaying(true);
    const onPause = () => { setPlaying(false); setIsBuffering(false); };
    const onEndedHandler = () => { setPlaying(false); setIsBuffering(false); onEndedRef.current?.(); };
    const onTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      lastTimeRef.current = video.currentTime;
      if (video.buffered.length > 0) {
        const end = video.buffered.end(video.buffered.length - 1);
        setBuffered(video.duration > 0 ? end / video.duration : 0);
      }
    };
    const onDurationChange = () => setDuration(video.duration || 0);
    const onVolumeChange = () => {
      setMuted(video.muted);
      setVolume(video.volume);
    };
    const onWaiting = () => setIsBuffering(true);
    const onCanPlay = () => setIsBuffering(false);
    const onPlaying = () => setIsBuffering(false);

    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("ended", onEndedHandler);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("durationchange", onDurationChange);
    video.addEventListener("volumechange", onVolumeChange);
    video.addEventListener("waiting", onWaiting);
    video.addEventListener("canplay", onCanPlay);
    video.addEventListener("playing", onPlaying);

    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("ended", onEndedHandler);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("durationchange", onDurationChange);
      video.removeEventListener("volumechange", onVolumeChange);
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("canplay", onCanPlay);
      video.removeEventListener("playing", onPlaying);
    };
  }, []);

  // Buffering stall detection
  useEffect(() => {
    bufferCheckRef.current = setInterval(() => {
      const video = videoRef.current;
      if (!video || video.paused || video.ended) return;
      if (video.readyState < HTMLMediaElement.HAVE_FUTURE_DATA) {
        setIsBuffering(true);
      }
    }, 500);
    return () => {
      if (bufferCheckRef.current) clearInterval(bufferCheckRef.current);
    };
  }, []);

  // Fullscreen API
  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  // Watermark position cycling every 12s
  useEffect(() => {
    wmTimerRef.current = setInterval(() => {
      setWmPosIdx((p) => (p + 1) % WM_POSITIONS.length);
    }, 12_000);
    return () => {
      if (wmTimerRef.current) clearInterval(wmTimerRef.current);
    };
  }, []);

  // Anti-piracy: DevTools detection
  useEffect(() => {
    const check = () => {
      const open =
        window.outerWidth - window.innerWidth > 200 ||
        window.outerHeight - window.innerHeight > 200;
      setDevToolsOpen(open);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Anti-piracy: block dangerous keyboard shortcuts globally while player is focused
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onKeyDown = (e: KeyboardEvent) => {
      const blockedKeys = ["F12"];
      const blockedCtrlShift = ["I", "J", "C", "K"];
      const blockedCtrl = ["U", "S", "P"];

      if (blockedKeys.includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      if (e.ctrlKey && e.shiftKey && blockedCtrlShift.includes(e.key.toUpperCase())) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      if (e.ctrlKey && !e.shiftKey && blockedCtrl.includes(e.key.toUpperCase())) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    container.addEventListener("keydown", onKeyDown, { capture: true });
    return () => container.removeEventListener("keydown", onKeyDown, { capture: true });
  }, []);

  // Controls auto-hide
  const showControls = useCallback(() => {
    setControlsVisible(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setControlsVisible(false), 3000);
  }, []);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const willPlay = video.paused;
    if (willPlay) void video.play();
    else video.pause();
    setCenterIcon(willPlay ? "play" : "pause");
    if (centerTimerRef.current) clearTimeout(centerTimerRef.current);
    centerTimerRef.current = setTimeout(() => setCenterIcon(null), 700);
  }, []);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
  }, []);

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void el.requestFullscreen();
  }, []);

  const applySpeed = useCallback((speed: SpeedOption) => {
    const video = videoRef.current;
    if (video) video.playbackRate = speed;
    setPlaybackSpeed(speed);
    setSpeedMenuOpen(false);
  }, []);

  const seekFromClientX = useCallback((clientX: number) => {
    const bar = progressBarRef.current;
    const video = videoRef.current;
    if (!bar || !video || !Number.isFinite(video.duration)) return;
    const rect = bar.getBoundingClientRect();
    const fraction = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    video.currentTime = fraction * video.duration;
  }, []);

  const onProgressMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      seekingRef.current = true;
      seekFromClientX(e.clientX);
      const onMove = (me: MouseEvent) => {
        if (seekingRef.current) seekFromClientX(me.clientX);
      };
      const onUp = () => {
        seekingRef.current = false;
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
      };
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    [seekFromClientX]
  );

  const onProgressMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const bar = progressBarRef.current;
      const video = videoRef.current;
      if (!bar || !video || !Number.isFinite(video.duration)) return;
      const rect = bar.getBoundingClientRect();
      const fraction = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      setHoverTime(fraction * video.duration);
      setHoverX(e.clientX - rect.left);
    },
    []
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const video = videoRef.current;
      if (!video) return;

      // Close menus on Escape
      if (e.key === "Escape") {
        setQualityMenuOpen(false);
        setSpeedMenuOpen(false);
        setShortcutsOpen(false);
        return;
      }

      switch (e.key) {
        case " ":
        case "k":
        case "K":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowRight":
          e.preventDefault();
          video.currentTime = Math.min(video.currentTime + 5, video.duration);
          break;
        case "ArrowLeft":
          e.preventDefault();
          video.currentTime = Math.max(video.currentTime - 5, 0);
          break;
        case "ArrowUp":
          e.preventDefault();
          video.volume = Math.min(1, video.volume + 0.1);
          break;
        case "ArrowDown":
          e.preventDefault();
          video.volume = Math.max(0, video.volume - 0.1);
          break;
        case "f":
        case "F":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "m":
        case "M":
          e.preventDefault();
          toggleMute();
          break;
        case "[": {
          e.preventDefault();
          const idx = SPEED_OPTIONS.indexOf(playbackSpeed);
          if (idx > 0) applySpeed(SPEED_OPTIONS[idx - 1] as SpeedOption);
          break;
        }
        case "]": {
          e.preventDefault();
          const idx = SPEED_OPTIONS.indexOf(playbackSpeed);
          if (idx < SPEED_OPTIONS.length - 1) applySpeed(SPEED_OPTIONS[idx + 1] as SpeedOption);
          break;
        }
        default: {
          const digit = parseInt(e.key, 10);
          if (!isNaN(digit) && digit >= 0 && digit <= 9 && Number.isFinite(video.duration)) {
            e.preventDefault();
            video.currentTime = (digit / 10) * video.duration;
          }
        }
      }
    },
    [togglePlay, toggleFullscreen, toggleMute, applySpeed, playbackSpeed]
  );

  const selectLevel = useCallback((level: number) => {
    const hls = hlsRef.current;
    if (hls) hls.currentLevel = level;
    setCurrentLevel(level);
    setQualityMenuOpen(false);
  }, []);

  const wmPos = WM_POSITIONS[wmPosIdx];
  const playedPct = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPct = buffered * 100;
  const currentLevelLabel =
    currentLevel === -1 || hlsLevels.length === 0
      ? "Auto"
      : (hlsLevels.find((l) => l.index === currentLevel)?.label ?? "Auto");

  const anyMenuOpen = qualityMenuOpen || speedMenuOpen || shortcutsOpen;

  const volumePct = Math.round(volume * 100);
  const VolumeIcon = muted || volume === 0 ? SoundOff : volume < 0.5 ? SoundLow : SoundHigh;

  return (
    <div
      ref={containerRef}
      className={cn(
        "group relative aspect-video w-full select-none overflow-hidden bg-black outline-none",
        isFullscreen ? "rounded-none" : "rounded-xl",
        className
      )}
      tabIndex={0}
      role="application"
      aria-label="Video player"
      onKeyDown={onKeyDown}
      onMouseMove={showControls}
      onMouseEnter={showControls}
      onMouseLeave={() => {
        if (!anyMenuOpen) setControlsVisible(false);
        setVolumeSliderVisible(false);
        setHoverTime(null);
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Video element */}
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-contain"
        preload="auto"
        playsInline
        disablePictureInPicture
        controlsList="nodownload noremoteplayback"
        draggable={false}
        onClick={togglePlay}
        onDoubleClick={toggleFullscreen}
        onDragStart={(e) => e.preventDefault()}
      />

      {/* Error state */}
      {error ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 px-6">
          <p className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-center text-sm font-medium text-danger">
            {error}
          </p>
        </div>
      ) : null}

      {/* DevTools warning overlay */}
      {devToolsOpen ? (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-black/95">
          <p className="text-sm font-semibold text-yellow-400">Developer tools detected</p>
          <p className="max-w-xs text-center text-xs text-white/60">
            Playback is paused while developer tools are open to protect content.
          </p>
        </div>
      ) : null}

      {/* Buffering spinner overlay */}
      {isBuffering && !error && !devToolsOpen ? (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-white" />
        </div>
      ) : null}

      {/* Watermark */}
      {watermarkText ? (
        <div
          className="pointer-events-none absolute z-20 transition-all duration-1000"
          style={{ opacity: 0.2, ...wmPos }}
        >
          <span
            className="select-none whitespace-nowrap text-[11px] font-medium text-white"
            style={{ textShadow: "0 1px 3px rgba(0,0,0,0.9)" }}
          >
            {watermarkText}
          </span>
        </div>
      ) : null}

      {/* Protected content badge */}
      <div className="pointer-events-none absolute left-2 top-2 z-20 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <span className="rounded bg-black/50 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-white/40">
          Protected
        </span>
      </div>

      {/* Center play/pause feedback icon */}
      {centerIcon !== null ? (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <div className="rounded-full bg-black/50 p-5 backdrop-blur-sm">
            {centerIcon === "play" ? (
              <Play className="h-8 w-8 text-white" />
            ) : (
              <Pause className="h-8 w-8 text-white" />
            )}
          </div>
        </div>
      ) : null}

      {/* Controls bar */}
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 z-30 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-3 pb-3 pt-14 transition-opacity duration-200",
          controlsVisible || anyMenuOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      >
        {/* Progress / seek bar */}
        <div
          ref={progressBarRef}
          className="group/bar relative mb-3 h-1 cursor-pointer rounded-full bg-white/25 transition-all duration-100 hover:h-[5px]"
          onMouseDown={onProgressMouseDown}
          onMouseMove={onProgressMouseMove}
          onMouseLeave={() => setHoverTime(null)}
          role="slider"
          aria-label="Seek"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(playedPct)}
        >
          {/* Buffered */}
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-white/30"
            style={{ width: `${bufferedPct}%` }}
          />
          {/* Played */}
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-primary transition-[width] duration-75"
            style={{ width: `${playedPct}%` }}
          >
            {/* Thumb */}
            <div className="absolute -right-[6px] top-1/2 h-3 w-3 -translate-y-1/2 scale-0 rounded-full bg-white shadow-md transition-transform duration-100 group-hover/bar:scale-100" />
          </div>

          {/* Time tooltip on hover */}
          {hoverTime !== null ? (
            <div
              className="pointer-events-none absolute -top-8 z-10 -translate-x-1/2 rounded bg-black/80 px-1.5 py-0.5 text-[10px] tabular-nums text-white shadow"
              style={{ left: `${hoverX}px` }}
            >
              {fmt(hoverTime)}
            </div>
          ) : null}
        </div>

        {/* Button row */}
        <div className="flex items-center gap-1">
          {/* Play/Pause */}
          <button
            type="button"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-white hover:bg-white/15 focus-visible:outline-none"
            onClick={togglePlay}
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>

          {/* Time display */}
          <span className="ml-1.5 text-[11px] tabular-nums text-white/75">
            {fmt(currentTime)}{" "}
            <span className="text-white/40">/</span>{" "}
            {fmt(duration)}
          </span>

          <div className="flex-1" />

          {/* Volume control */}
          <div
            className="relative flex items-center"
            onMouseEnter={() => setVolumeSliderVisible(true)}
            onMouseLeave={() => setVolumeSliderVisible(false)}
          >
            {volumeSliderVisible ? (
              <div className="absolute bottom-8 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center gap-1 rounded-lg bg-black/90 px-2 py-3 shadow-xl">
                <span className="text-[9px] tabular-nums text-white/60">{volumePct}%</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={muted ? 0 : volumePct}
                  className="h-[72px] w-[4px] cursor-pointer appearance-none rounded-full bg-white/25 [writing-mode:vertical-lr] [direction:rtl]"
                  style={{
                    background: `linear-gradient(to top, #fff ${muted ? 0 : volumePct}%, rgba(255,255,255,0.25) ${muted ? 0 : volumePct}%)`,
                  }}
                  onChange={(e) => {
                    const video = videoRef.current;
                    if (!video) return;
                    const v = parseInt(e.target.value, 10) / 100;
                    video.volume = v;
                    video.muted = v === 0;
                  }}
                  aria-label="Volume"
                />
              </div>
            ) : null}
            <button
              type="button"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-white hover:bg-white/15 focus-visible:outline-none"
              onClick={toggleMute}
              aria-label={muted ? "Unmute" : "Mute"}
            >
              <VolumeIcon className="h-4 w-4" />
            </button>
          </div>

          {/* Playback speed */}
          <div className="relative">
            <button
              type="button"
              className="flex h-7 items-center gap-0.5 rounded px-2 text-[11px] font-medium text-white hover:bg-white/15 focus-visible:outline-none"
              onClick={(e) => {
                e.stopPropagation();
                setSpeedMenuOpen((p) => !p);
                setQualityMenuOpen(false);
                setShortcutsOpen(false);
              }}
              aria-label="Playback speed"
              aria-haspopup="listbox"
              aria-expanded={speedMenuOpen}
            >
              {playbackSpeed === 1 ? "1×" : `${playbackSpeed}×`}
            </button>

            {speedMenuOpen ? (
              <div
                className="absolute bottom-9 right-0 z-50 min-w-[80px] overflow-hidden rounded-lg border border-white/10 bg-black/90 py-1 shadow-xl"
                role="listbox"
                aria-label="Speed options"
              >
                {SPEED_OPTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    role="option"
                    aria-selected={playbackSpeed === s}
                    className={cn(
                      "w-full px-4 py-2 text-left text-xs transition-colors hover:bg-white/10",
                      playbackSpeed === s ? "font-semibold text-primary" : "text-white"
                    )}
                    onClick={() => applySpeed(s)}
                  >
                    {s === 1 ? "1× Normal" : `${s}×`}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {/* Quality selector */}
          {hlsLevels.length > 0 ? (
            <div className="relative">
              <button
                type="button"
                className="flex h-7 items-center gap-1 rounded px-2 text-[11px] font-medium text-white hover:bg-white/15 focus-visible:outline-none"
                onClick={(e) => {
                  e.stopPropagation();
                  setQualityMenuOpen((p) => !p);
                  setSpeedMenuOpen(false);
                  setShortcutsOpen(false);
                }}
                aria-label="Video quality"
                aria-haspopup="listbox"
                aria-expanded={qualityMenuOpen}
              >
                <Settings className="h-3.5 w-3.5" />
                <span>{currentLevelLabel}</span>
              </button>

              {qualityMenuOpen ? (
                <div
                  className="absolute bottom-9 right-0 z-50 min-w-[100px] overflow-hidden rounded-lg border border-white/10 bg-black/90 py-1 shadow-xl"
                  role="listbox"
                  aria-label="Quality options"
                >
                  <button
                    type="button"
                    role="option"
                    aria-selected={currentLevel === -1}
                    className={cn(
                      "w-full px-4 py-2 text-left text-xs transition-colors hover:bg-white/10",
                      currentLevel === -1 ? "font-semibold text-primary" : "text-white"
                    )}
                    onClick={() => selectLevel(-1)}
                  >
                    Auto
                  </button>
                  {hlsLevels.map((lvl) => (
                    <button
                      key={lvl.index}
                      type="button"
                      role="option"
                      aria-selected={currentLevel === lvl.index}
                      className={cn(
                        "w-full px-4 py-2 text-left text-xs transition-colors hover:bg-white/10",
                        currentLevel === lvl.index ? "font-semibold text-primary" : "text-white"
                      )}
                      onClick={() => selectLevel(lvl.index)}
                    >
                      {lvl.label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          {/* Keyboard shortcuts help */}
          <div className="relative">
            <button
              type="button"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-white hover:bg-white/15 focus-visible:outline-none"
              onClick={(e) => {
                e.stopPropagation();
                setShortcutsOpen((p) => !p);
                setQualityMenuOpen(false);
                setSpeedMenuOpen(false);
              }}
              aria-label="Keyboard shortcuts"
            >
              <HelpCircle className="h-3.5 w-3.5" />
            </button>

            {shortcutsOpen ? (
              <div className="absolute bottom-9 right-0 z-50 w-56 overflow-hidden rounded-lg border border-white/10 bg-black/90 p-3 shadow-xl">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-white/50">
                  Shortcuts
                </p>
                <ul className="space-y-1">
                  {SHORTCUTS.map((s) => (
                    <li key={s.key} className="flex items-center justify-between gap-2">
                      <span className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[10px] text-white">
                        {s.key}
                      </span>
                      <span className="text-right text-[10px] text-white/70">{s.action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          {/* Fullscreen */}
          <button
            type="button"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-white hover:bg-white/15 focus-visible:outline-none"
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Compress className="h-4 w-4" /> : <Expand className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LessonVideoPlayer;
