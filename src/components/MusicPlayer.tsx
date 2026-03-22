import { useState, useEffect, useCallback, useRef } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Heart,
  Shuffle,
  Repeat,
  Volume2,
  Plus,
  Music,
  X,
  ChevronUp,
} from "lucide-react";
import albumCover from "@/assets/album-cover.jpg";

interface Track {
  title: string;
  artist: string;
  duration: number;
  file?: File;
  url?: string;
}

const defaultTracks: Track[] = [
  { title: "Midnight Drive", artist: "Lena Voss", duration: 237 },
  { title: "Golden Hour", artist: "Theo Marcell", duration: 204 },
  { title: "Still Waters", artist: "Aya Nakamura", duration: 189 },
  { title: "Neon Rain", artist: "Cassie Drake", duration: 221 },
  { title: "Lost Signal", artist: "Mika Sato", duration: 195 },
];

const formatTime = (s: number) => {
  if (!isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

const cleanFileName = (name: string) =>
  name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");

const MusicPlayer = () => {
  const [tracks, setTracks] = useState<Track[]>(defaultTracks);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [liked, setLiked] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [volume, setVolume] = useState(75);
  const [transitioning, setTransitioning] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [miniPlayerVisible, setMiniPlayerVisible] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const playlistRef = useRef<HTMLDivElement>(null);
  const trackItemsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const simTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mainPlayerRef = useRef<HTMLDivElement>(null);

  const track = tracks[currentTrack];
  const isRealAudio = !!track?.url;

  // Mini player visibility via IntersectionObserver
  useEffect(() => {
    const el = mainPlayerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setMiniPlayerVisible(!entry.isIntersecting),
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Sync audio element when track changes
  useEffect(() => {
    if (!track?.url) return;
    if (audioRef.current) {
      audioRef.current.pause();
      const prev = audioRef.current.src;
      audioRef.current.src = "";
      if (prev.startsWith("blob:")) URL.revokeObjectURL(prev);
    }
    const audio = new Audio(track.url);
    audio.volume = volume / 100;
    audioRef.current = audio;

    const onMeta = () => {
      setTracks((prev) =>
        prev.map((t, i) =>
          i === currentTrack ? { ...t, duration: audio.duration } : t
        )
      );
    };

    const onTimeUpdate = () => {
      if (!isDragging) setProgress(audio.currentTime);
    };

    const onEnded = () => {
      if (repeat) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      } else {
        skip(1);
      }
    };

    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);

    if (isPlaying) audio.play().catch(() => {});

    return () => {
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
      audio.pause();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack, track?.url]);

  // Simulated progress for demo tracks (requestAnimationFrame-based)
  useEffect(() => {
    if (isRealAudio) return;
    if (simTimerRef.current) clearInterval(simTimerRef.current);

    if (!isPlaying) return;

    simTimerRef.current = setInterval(() => {
      setProgress((p) => {
        if (p >= track.duration) {
          setIsPlaying(false);
          return 0;
        }
        return p + 0.25;
      });
    }, 250);

    return () => {
      if (simTimerRef.current) clearInterval(simTimerRef.current);
    };
  }, [isPlaying, track.duration, isRealAudio]);

  // Sync play/pause with real audio
  useEffect(() => {
    if (!audioRef.current || !isRealAudio) return;
    if (isPlaying) {
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, isRealAudio]);

  // Sync volume
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume / 100;
  }, [volume]);

  // Auto-scroll playlist to current track
  useEffect(() => {
    const el = trackItemsRef.current[currentTrack];
    if (el && showPlaylist) {
      el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [currentTrack, showPlaylist]);

  const skip = useCallback(
    (dir: 1 | -1) => {
      setTransitioning(true);
      setTimeout(() => {
        setCurrentTrack((c) => {
          if (shuffle) {
            let next = c;
            while (next === c && tracks.length > 1) {
              next = Math.floor(Math.random() * tracks.length);
            }
            return next;
          }
          return (c + dir + tracks.length) % tracks.length;
        });
        setProgress(0);
        setIsPlaying(true);
        setTimeout(() => setTransitioning(false), 50);
      }, 180);
    },
    [tracks.length, shuffle]
  );

  // Progress bar seeking — supports click and drag
  const seekTo = useCallback(
    (clientX: number) => {
      const bar = progressBarRef.current;
      if (!bar) return;
      const rect = bar.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const newTime = ratio * track.duration;
      setProgress(newTime);
      if (audioRef.current && isRealAudio) {
        audioRef.current.currentTime = newTime;
      }
    },
    [track.duration, isRealAudio]
  );

  const handleProgressMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    seekTo(e.clientX);

    const onMouseMove = (ev: MouseEvent) => seekTo(ev.clientX);
    const onMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const handleProgressTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    setIsDragging(true);
    seekTo(e.touches[0].clientX);

    const onTouchMove = (ev: TouchEvent) => seekTo(ev.touches[0].clientX);
    const onTouchEnd = () => {
      setIsDragging(false);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
    window.addEventListener("touchmove", onTouchMove);
    window.addEventListener("touchend", onTouchEnd);
  };

  const handleVolumeClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setVolume(Math.round(ratio * 100));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newTracks: Track[] = Array.from(files).map((file) => ({
      title: cleanFileName(file.name),
      artist: "Local File",
      duration: 0,
      file,
      url: URL.createObjectURL(file),
    }));
    setTracks((prev) => [...prev, ...newTracks]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const playTrack = (index: number) => {
    if (index === currentTrack) {
      setIsPlaying(!isPlaying);
      return;
    }
    setTransitioning(true);
    setTimeout(() => {
      setCurrentTrack(index);
      setProgress(0);
      setIsPlaying(true);
      setTimeout(() => setTransitioning(false), 50);
    }, 180);
  };

  const removeTrack = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tracks[index].url) URL.revokeObjectURL(tracks[index].url!);
    setTracks((prev) => prev.filter((_, i) => i !== index));
    if (index === currentTrack) {
      setCurrentTrack(0);
      setProgress(0);
      setIsPlaying(false);
    } else if (index < currentTrack) {
      setCurrentTrack((c) => c - 1);
    }
  };

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (simTimerRef.current) clearInterval(simTimerRef.current);
    };
  }, []);

  const progressPercent = track.duration > 0 ? (progress / track.duration) * 100 : 0;

  return (
    <>
      {/* ── Main player ── */}
      <div
        ref={mainPlayerRef}
        className="player-gradient flex min-h-[100dvh] items-start justify-center px-5 pt-10 pb-28"
      >
        <div className="flex w-full max-w-[400px] flex-col items-center gap-0">

          {/* ── Player card ── */}
          <div
            className={`flex w-full flex-col items-center gap-6 transition-all duration-300 ${
              transitioning ? "opacity-0 scale-[0.98]" : "opacity-100 scale-100"
            }`}
          >
            {/* Header */}
            <div
              className="flex w-full items-center justify-between opacity-0 animate-fade-up"
              style={{ animationDelay: "0.05s" }}
            >
              <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Now Playing
              </span>
              <span className="text-[13px] font-semibold tracking-tight text-foreground/70">
                MAXI
              </span>
            </div>

            {/* Album Art */}
            <div
              className="opacity-0 animate-fade-up w-full"
              style={{ animationDelay: "0.12s" }}
            >
              <div
                className={`aspect-square w-full overflow-hidden rounded-2xl shadow-[0_12px_48px_rgba(0,0,0,0.6)] transition-transform duration-700 ease-out ${
                  isPlaying ? "scale-[1.012]" : "scale-100"
                }`}
              >
                <img
                  src={albumCover}
                  alt="Album artwork"
                  className="h-full w-full object-cover"
                  draggable={false}
                />
              </div>
            </div>

            {/* Track Info + Like */}
            <div
              className="flex w-full items-center justify-between gap-3 opacity-0 animate-fade-up"
              style={{ animationDelay: "0.2s" }}
            >
              <div className="min-w-0">
                <h1 className="truncate text-[17px] font-semibold leading-snug text-foreground tracking-[-0.02em]">
                  {track.title}
                </h1>
                <p className="mt-0.5 truncate text-[13px] text-muted-foreground">
                  {track.artist}
                </p>
              </div>
              <button
                onClick={() => setLiked(!liked)}
                className="flex-shrink-0 p-1 transition-all duration-200 active:scale-90"
                aria-label="Like"
                data-testid="button-like"
              >
                <Heart
                  size={20}
                  className={`transition-colors duration-200 ${
                    liked
                      ? "fill-primary text-primary"
                      : "text-muted-foreground hover:text-foreground/60"
                  }`}
                />
              </button>
            </div>

            {/* Progress Bar */}
            <div
              className="w-full space-y-2 opacity-0 animate-fade-up"
              style={{ animationDelay: "0.26s" }}
            >
              <div
                ref={progressBarRef}
                className="group relative h-1 w-full cursor-pointer rounded-full bg-progress-bg"
                onMouseDown={handleProgressMouseDown}
                onTouchStart={handleProgressTouchStart}
                data-testid="progress-bar"
                style={{ touchAction: "none" }}
              >
                {/* Expanded hit area */}
                <div className="absolute -inset-y-2 inset-x-0" />

                {/* Fill */}
                <div
                  className="absolute left-0 top-0 h-full rounded-full bg-progress-fill"
                  style={{
                    width: `${progressPercent}%`,
                    transition: isDragging || isRealAudio ? "none" : "width 0.25s linear",
                  }}
                />

                {/* Thumb — always visible when dragging, hover otherwise */}
                <div
                  className={`absolute top-1/2 h-3 w-3 rounded-full bg-foreground shadow-sm transition-all duration-150 ${
                    isDragging ? "opacity-100 scale-110" : "opacity-0 group-hover:opacity-100"
                  }`}
                  style={{
                    left: `${progressPercent}%`,
                    transform: "translateX(-50%) translateY(-50%)",
                    pointerEvents: "none",
                  }}
                />
              </div>
              <div className="flex justify-between text-[11px] tabular-nums text-muted-foreground/60">
                <span>{formatTime(progress)}</span>
                <span>{track.duration > 0 ? formatTime(track.duration) : "--:--"}</span>
              </div>
            </div>

            {/* Controls */}
            <div
              className="flex w-full items-center justify-between px-1 opacity-0 animate-fade-up"
              style={{ animationDelay: "0.32s" }}
            >
              <button
                onClick={() => setShuffle(!shuffle)}
                className={`p-2 transition-colors duration-200 active:scale-90 rounded-full ${
                  shuffle
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground/60"
                }`}
                aria-label="Shuffle"
                data-testid="button-shuffle"
              >
                <Shuffle size={17} />
              </button>

              <button
                onClick={() => skip(-1)}
                className="p-2 text-foreground/80 transition-all duration-150 hover:text-foreground active:scale-90 rounded-full"
                aria-label="Previous"
                data-testid="button-prev"
              >
                <SkipBack size={24} fill="currentColor" />
              </button>

              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="flex h-13 w-13 items-center justify-center rounded-full bg-foreground shadow-md transition-all duration-150 hover:bg-white/90 active:scale-95"
                style={{ width: 52, height: 52 }}
                aria-label={isPlaying ? "Pause" : "Play"}
                data-testid="button-play-pause"
              >
                {isPlaying ? (
                  <Pause size={22} className="text-background" fill="currentColor" />
                ) : (
                  <Play size={22} className="ml-0.5 text-background" fill="currentColor" />
                )}
              </button>

              <button
                onClick={() => skip(1)}
                className="p-2 text-foreground/80 transition-all duration-150 hover:text-foreground active:scale-90 rounded-full"
                aria-label="Next"
                data-testid="button-next"
              >
                <SkipForward size={24} fill="currentColor" />
              </button>

              <button
                onClick={() => setRepeat(!repeat)}
                className={`p-2 transition-colors duration-200 active:scale-90 rounded-full ${
                  repeat
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground/60"
                }`}
                aria-label="Repeat"
                data-testid="button-repeat"
              >
                <Repeat size={17} />
              </button>
            </div>

            {/* Volume */}
            <div
              className="flex w-full items-center gap-2.5 opacity-0 animate-fade-up"
              style={{ animationDelay: "0.37s" }}
            >
              <Volume2 size={13} className="flex-shrink-0 text-muted-foreground/50" />
              <div
                className="group relative h-[3px] flex-1 cursor-pointer rounded-full bg-progress-bg transition-[height] duration-150 hover:h-[5px]"
                onClick={handleVolumeClick}
                data-testid="volume-bar"
              >
                <div
                  className="h-full rounded-full bg-muted-foreground/40 transition-colors duration-200 group-hover:bg-foreground/50"
                  style={{ width: `${volume}%` }}
                />
              </div>
              <span className="w-6 text-right text-[10px] tabular-nums text-muted-foreground/40">
                {volume}
              </span>
            </div>
          </div>

          {/* ── Playlist ── */}
          <div
            className="mt-8 w-full opacity-0 animate-fade-up"
            style={{ animationDelay: "0.42s" }}
          >
            {/* Playlist header */}
            <div className="mb-3 flex items-center justify-between">
              <button
                onClick={() => setShowPlaylist(!showPlaylist)}
                className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground transition-colors duration-200 hover:text-foreground/60"
                data-testid="button-toggle-playlist"
              >
                <ChevronUp
                  size={13}
                  className={`transition-transform duration-300 ${
                    showPlaylist ? "rotate-0" : "rotate-180"
                  }`}
                />
                Playlist · {tracks.length}
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-[11px] font-medium text-foreground/70 transition-all duration-200 hover:bg-white/8 hover:text-foreground/90 active:scale-95"
                data-testid="button-add-songs"
              >
                <Plus size={12} />
                Add Songs
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*,.mp3,.wav,.ogg,.m4a,.flac"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {/* Track list */}
            <div
              className={`overflow-hidden transition-all duration-300 ease-out ${
                showPlaylist ? "max-h-[320px] opacity-100" : "max-h-0 opacity-0 pointer-events-none"
              }`}
            >
              <div
                ref={playlistRef}
                className="max-h-[300px] overflow-y-auto space-y-0.5 pr-0.5"
                style={{ scrollbarWidth: "none" }}
              >
                {tracks.map((t, i) => (
                  <button
                    key={`${t.title}-${i}`}
                    ref={(el) => { trackItemsRef.current[i] = el; }}
                    onClick={() => playTrack(i)}
                    className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-150 ${
                      i === currentTrack
                        ? "bg-white/8 text-foreground"
                        : "text-foreground/60 hover:bg-white/4 hover:text-foreground/80"
                    }`}
                    data-testid={`track-item-${i}`}
                  >
                    {/* Icon / number */}
                    <div
                      className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-[11px] font-medium tabular-nums transition-colors duration-150 ${
                        i === currentTrack
                          ? "bg-primary/20 text-primary"
                          : "bg-secondary/60 text-muted-foreground group-hover:bg-secondary"
                      }`}
                    >
                      {i === currentTrack && isPlaying ? (
                        <Pause size={12} fill="currentColor" />
                      ) : i === currentTrack ? (
                        <Play size={12} fill="currentColor" />
                      ) : (
                        <Music size={12} />
                      )}
                    </div>

                    {/* Title + artist */}
                    <div className="min-w-0 flex-1">
                      <p
                        className={`truncate text-[13px] font-medium leading-tight ${
                          i === currentTrack ? "text-primary" : ""
                        }`}
                      >
                        {t.title}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] text-muted-foreground/70">
                        {t.artist}
                      </p>
                    </div>

                    {/* Duration */}
                    <span className="flex-shrink-0 text-[11px] tabular-nums text-muted-foreground/50">
                      {t.duration > 0 ? formatTime(t.duration) : "--:--"}
                    </span>

                    {/* Remove (only for uploaded files) */}
                    {t.url && (
                      <button
                        onClick={(e) => removeTrack(i, e)}
                        className="ml-1 flex-shrink-0 opacity-0 transition-opacity duration-150 group-hover:opacity-100 text-muted-foreground/50 hover:text-foreground/60"
                        aria-label="Remove track"
                        data-testid={`button-remove-track-${i}`}
                      >
                        <X size={13} />
                      </button>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Mini Player ── */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 ease-out ${
          miniPlayerVisible
            ? "translate-y-0 opacity-100"
            : "translate-y-full opacity-0 pointer-events-none"
        }`}
      >
        <div className="mx-auto max-w-lg px-3 pb-3">
          <div className="flex items-center gap-3 rounded-2xl bg-[hsl(0_0%_13%)] px-4 py-3 shadow-[0_-4px_32px_rgba(0,0,0,0.5)] border border-white/6 backdrop-blur-md">
            {/* Mini album art */}
            <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg shadow-md">
              <img
                src={albumCover}
                alt="Album artwork"
                className="h-full w-full object-cover"
                draggable={false}
              />
            </div>

            {/* Track info */}
            <div className="min-w-0 flex-1">
              <p
                className={`truncate text-[13px] font-semibold leading-tight transition-all duration-300 ${
                  transitioning ? "opacity-0" : "opacity-100"
                }`}
              >
                {track.title}
              </p>
              <p className="truncate text-[11px] text-muted-foreground/70 mt-0.5">
                {track.artist}
              </p>
            </div>

            {/* Mini progress */}
            <div className="hidden sm:block flex-1 max-w-[100px]">
              <div className="h-[3px] w-full rounded-full bg-progress-bg overflow-hidden">
                <div
                  className="h-full rounded-full bg-progress-fill"
                  style={{
                    width: `${progressPercent}%`,
                    transition: isDragging || isRealAudio ? "none" : "width 0.25s linear",
                  }}
                />
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => skip(-1)}
                className="p-1.5 text-foreground/60 transition-colors hover:text-foreground active:scale-90"
                aria-label="Previous"
                data-testid="mini-button-prev"
              >
                <SkipBack size={16} fill="currentColor" />
              </button>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground transition-all duration-150 hover:bg-white/90 active:scale-95"
                aria-label={isPlaying ? "Pause" : "Play"}
                data-testid="mini-button-play-pause"
              >
                {isPlaying ? (
                  <Pause size={14} className="text-background" fill="currentColor" />
                ) : (
                  <Play size={14} className="ml-0.5 text-background" fill="currentColor" />
                )}
              </button>
              <button
                onClick={() => skip(1)}
                className="p-1.5 text-foreground/60 transition-colors hover:text-foreground active:scale-90"
                aria-label="Next"
                data-testid="mini-button-next"
              >
                <SkipForward size={16} fill="currentColor" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MusicPlayer;
