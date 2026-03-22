import { useState, useEffect, useCallback, useRef } from "react";
import {
  Play, Pause, SkipBack, SkipForward, Heart, Shuffle,
  Repeat, Volume2, VolumeX, Plus, X, ChevronDown, ListMusic,
} from "lucide-react";
import albumCover from "@/assets/album-cover.jpg";

/* ─── Types ─────────────────────────────────────── */
interface Track {
  title: string;
  artist: string;
  duration: number;
  file?: File;
  url?: string;
}

/* ─── Demo playlist ──────────────────────────────── */
const defaultTracks: Track[] = [
  { title: "Midnight Drive",  artist: "Lena Voss",      duration: 237 },
  { title: "Golden Hour",     artist: "Theo Marcell",   duration: 204 },
  { title: "Still Waters",    artist: "Aya Nakamura",   duration: 189 },
  { title: "Neon Rain",       artist: "Cassie Drake",   duration: 221 },
  { title: "Lost Signal",     artist: "Mika Sato",      duration: 195 },
  { title: "Glass Canvas",    artist: "Elara Moon",     duration: 213 },
];

/* ─── Helpers ────────────────────────────────────── */
const fmt = (s: number) => {
  if (!isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

const cleanFileName = (n: string) =>
  n.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");

/* ─── Equalizer bars ─────────────────────────────── */
const EqBars = () => (
  <div className="flex items-end gap-[2px] h-[14px]">
    <span className="w-[3px] rounded-sm bg-primary animate-eq-1" style={{ height: 4 }} />
    <span className="w-[3px] rounded-sm bg-primary animate-eq-2" style={{ height: 10 }} />
    <span className="w-[3px] rounded-sm bg-primary animate-eq-3" style={{ height: 6 }} />
  </div>
);

/* ─── Component ──────────────────────────────────── */
const MusicPlayer = () => {
  const [tracks,        setTracks]        = useState<Track[]>(defaultTracks);
  const [currentTrack,  setCurrentTrack]  = useState(0);
  const [isPlaying,     setIsPlaying]     = useState(false);
  const [progress,      setProgress]      = useState(0);
  const [liked,         setLiked]         = useState(false);
  const [shuffle,       setShuffle]       = useState(false);
  const [repeat,        setRepeat]        = useState(false);
  const [volume,        setVolume]        = useState(75);
  const [muted,         setMuted]         = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [showPlaylist,  setShowPlaylist]  = useState(true);
  const [isDragging,    setIsDragging]    = useState(false);
  const [isVolDragging, setIsVolDragging] = useState(false);
  const [miniVisible,   setMiniVisible]   = useState(false);
  const [trackKey,      setTrackKey]      = useState(0);   // triggers re-mount for fade-in

  const audioRef        = useRef<HTMLAudioElement | null>(null);
  const fileInputRef    = useRef<HTMLInputElement>(null);
  const progressBarRef  = useRef<HTMLDivElement>(null);
  const volumeBarRef    = useRef<HTMLDivElement>(null);
  const playlistRef     = useRef<HTMLDivElement>(null);
  const trackItemsRef   = useRef<(HTMLDivElement | null)[]>([]);
  const simTimerRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const heroRef         = useRef<HTMLDivElement>(null);

  const track       = tracks[currentTrack];
  const isRealAudio = !!track?.url;
  const effectiveVol = muted ? 0 : volume;
  const progressPct  = track.duration > 0 ? (progress / track.duration) * 100 : 0;

  /* ── Mini player visibility ───────────────────── */
  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => setMiniVisible(!e.isIntersecting),
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  /* ── Audio engine ─────────────────────────────── */
  useEffect(() => {
    if (!track?.url) return;
    if (audioRef.current) {
      audioRef.current.pause();
      const src = audioRef.current.src;
      audioRef.current.src = "";
      if (src.startsWith("blob:")) URL.revokeObjectURL(src);
    }
    const audio = new Audio(track.url);
    audio.volume = effectiveVol / 100;
    audioRef.current = audio;

    const onMeta = () =>
      setTracks(prev => prev.map((t, i) =>
        i === currentTrack ? { ...t, duration: audio.duration } : t
      ));
    const onTime   = () => { if (!isDragging) setProgress(audio.currentTime); };
    const onEnded  = () => { repeat ? (audio.currentTime = 0, audio.play().catch(() => {})) : skip(1); };

    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnded);
    if (isPlaying) audio.play().catch(() => {});

    return () => {
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("ended", onEnded);
      audio.pause();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack, track?.url]);

  /* ── Simulated progress for demo tracks ──────── */
  useEffect(() => {
    if (isRealAudio) return;
    if (simTimerRef.current) clearInterval(simTimerRef.current);
    if (!isPlaying) return;
    simTimerRef.current = setInterval(() => {
      setProgress(p => {
        if (p >= track.duration) { setIsPlaying(false); return 0; }
        return p + 0.25;
      });
    }, 250);
    return () => { if (simTimerRef.current) clearInterval(simTimerRef.current); };
  }, [isPlaying, track.duration, isRealAudio]);

  /* ── Play / pause sync ────────────────────────── */
  useEffect(() => {
    if (!audioRef.current || !isRealAudio) return;
    isPlaying ? audioRef.current.play().catch(() => {}) : audioRef.current.pause();
  }, [isPlaying, isRealAudio]);

  /* ── Volume sync ──────────────────────────────── */
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = effectiveVol / 100;
  }, [effectiveVol]);

  /* ── Auto-scroll playlist ─────────────────────── */
  useEffect(() => {
    const el = trackItemsRef.current[currentTrack];
    if (el && showPlaylist) el.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [currentTrack, showPlaylist]);

  /* ── Keyboard controls ────────────────────────── */
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      switch (e.code) {
        case "Space":        e.preventDefault(); setIsPlaying(p => !p); break;
        case "ArrowRight":   e.preventDefault(); skip(1);               break;
        case "ArrowLeft":    e.preventDefault(); skip(-1);              break;
        case "ArrowUp":      e.preventDefault(); setVolume(v => Math.min(100, v + 5)); break;
        case "ArrowDown":    e.preventDefault(); setVolume(v => Math.max(0,   v - 5)); break;
        case "KeyM":         setMuted(m => !m);                         break;
        case "KeyL":         setLiked(l => !l);                         break;
        case "KeyS":         setShuffle(s => !s);                       break;
        case "KeyR":         setRepeat(r => !r);                        break;
      }
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Skip ─────────────────────────────────────── */
  const skip = useCallback((dir: 1 | -1) => {
    setTransitioning(true);
    setTimeout(() => {
      setCurrentTrack(c => {
        if (shuffle) {
          let n = c;
          while (n === c && tracks.length > 1) n = Math.floor(Math.random() * tracks.length);
          return n;
        }
        return (c + dir + tracks.length) % tracks.length;
      });
      setProgress(0);
      setIsPlaying(true);
      setTrackKey(k => k + 1);
      setTimeout(() => setTransitioning(false), 60);
    }, 200);
  }, [tracks.length, shuffle]);

  /* ── Progress seeking ─────────────────────────── */
  const seekTo = useCallback((clientX: number) => {
    const bar = progressBarRef.current;
    if (!bar) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const t = ratio * track.duration;
    setProgress(t);
    if (audioRef.current && isRealAudio) audioRef.current.currentTime = t;
  }, [track.duration, isRealAudio]);

  const onProgressDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
    const cx = "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    seekTo(cx);
    const move = (ev: MouseEvent | TouchEvent) =>
      seekTo("touches" in ev ? ev.touches[0].clientX : (ev as MouseEvent).clientX);
    const up = () => {
      setIsDragging(false);
      window.removeEventListener("mousemove", move as EventListener);
      window.removeEventListener("touchmove", move as EventListener);
      window.removeEventListener("mouseup", up);
      window.removeEventListener("touchend", up);
    };
    window.addEventListener("mousemove", move as EventListener);
    window.addEventListener("touchmove", move as EventListener);
    window.addEventListener("mouseup", up);
    window.addEventListener("touchend", up);
  };

  /* ── Volume seeking ───────────────────────────── */
  const seekVol = useCallback((clientX: number) => {
    const bar = volumeBarRef.current;
    if (!bar) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    setVolume(Math.round(ratio * 100));
    setMuted(false);
  }, []);

  const onVolumeDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsVolDragging(true);
    const cx = "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    seekVol(cx);
    const move = (ev: MouseEvent | TouchEvent) =>
      seekVol("touches" in ev ? ev.touches[0].clientX : (ev as MouseEvent).clientX);
    const up = () => {
      setIsVolDragging(false);
      window.removeEventListener("mousemove", move as EventListener);
      window.removeEventListener("touchmove", move as EventListener);
      window.removeEventListener("mouseup", up);
      window.removeEventListener("touchend", up);
    };
    window.addEventListener("mousemove", move as EventListener);
    window.addEventListener("touchmove", move as EventListener);
    window.addEventListener("mouseup", up);
    window.addEventListener("touchend", up);
  };

  /* ── File upload ──────────────────────────────── */
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newTracks: Track[] = Array.from(files).map(f => ({
      title: cleanFileName(f.name),
      artist: "Local File",
      duration: 0,
      file: f,
      url: URL.createObjectURL(f),
    }));
    setTracks(prev => [...prev, ...newTracks]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  /* ── Play track from playlist ─────────────────── */
  const playTrack = (idx: number) => {
    if (idx === currentTrack) { setIsPlaying(p => !p); return; }
    setTransitioning(true);
    setTimeout(() => {
      setCurrentTrack(idx);
      setProgress(0);
      setIsPlaying(true);
      setTrackKey(k => k + 1);
      setTimeout(() => setTransitioning(false), 60);
    }, 200);
  };

  /* ── Remove track ─────────────────────────────── */
  const removeTrack = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tracks[idx].url) URL.revokeObjectURL(tracks[idx].url!);
    setTracks(prev => prev.filter((_, i) => i !== idx));
    if (idx === currentTrack) { setCurrentTrack(0); setProgress(0); setIsPlaying(false); }
    else if (idx < currentTrack) setCurrentTrack(c => c - 1);
  };

  /* ── Cleanup ──────────────────────────────────── */
  useEffect(() => () => {
    if (simTimerRef.current) clearInterval(simTimerRef.current);
  }, []);

  /* ══════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════ */
  return (
    <>
      {/* ─── Ambient background ─────────────────── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div
          className="absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full opacity-[0.12] blur-[100px] animate-orb-1"
          style={{ background: "radial-gradient(circle, hsl(142 70% 45%), transparent 70%)" }}
        />
        <div
          className="absolute -bottom-40 -right-20 h-[420px] w-[420px] rounded-full opacity-[0.09] blur-[90px] animate-orb-2"
          style={{ background: "radial-gradient(circle, hsl(142 60% 40%), transparent 70%)" }}
        />
      </div>

      {/* ─── Main layout ────────────────────────── */}
      <div className="player-bg relative flex min-h-[100dvh] flex-col items-center justify-start px-4 pt-8 pb-28 sm:pt-12">
        <div className="w-full max-w-[420px]">

          {/* ── Header ────────────────────────── */}
          <div
            ref={heroRef}
            className="flex items-center justify-between mb-6 opacity-0 animate-fade-up"
            style={{ animationDelay: "0.05s" }}
          >
            <span className="text-[10px] font-medium uppercase tracking-[0.25em] text-muted-foreground/70">
              Now Playing
            </span>
            <span className="text-[13px] font-bold tracking-widest text-foreground/50 select-none">
              MAXI
            </span>
          </div>

          {/* ── Album Art ─────────────────────── */}
          <div
            key={trackKey}
            className="mb-6 opacity-0 animate-scale-in w-full"
            style={{ animationDelay: "0.08s" }}
          >
            <div
              className={`relative aspect-square w-full overflow-hidden rounded-2xl transition-all duration-700 ease-out ${
                isPlaying
                  ? "animate-album-breathe"
                  : "shadow-[0_16px_64px_rgba(0,0,0,0.65)]"
              }`}
            >
              <img
                src={albumCover}
                alt="Album artwork"
                className={`h-full w-full object-cover transition-all duration-700 ${
                  transitioning ? "scale-[1.04] opacity-0 blur-sm" : "scale-100 opacity-100 blur-0"
                }`}
                draggable={false}
              />
              {/* Playing overlay shimmer */}
              {isPlaying && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
              )}
            </div>
          </div>

          {/* ── Track Info + Like ──────────────── */}
          <div
            key={`info-${trackKey}`}
            className={`flex items-center justify-between gap-3 mb-5 transition-all duration-300 ${
              transitioning ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
            }`}
          >
            <div className="min-w-0">
              <h1 className="truncate text-[19px] font-semibold leading-tight text-foreground tracking-[-0.025em]">
                {track.title}
              </h1>
              <p className="mt-1 truncate text-[13px] font-medium text-muted-foreground/70">
                {track.artist}
              </p>
            </div>
            <button
              onClick={() => setLiked(l => !l)}
              className="group flex-shrink-0 p-2 rounded-full transition-all duration-200 active:scale-85"
              aria-label="Like"
              data-testid="button-like"
            >
              <Heart
                size={20}
                className={`transition-all duration-300 ${
                  liked
                    ? "fill-primary text-primary scale-110"
                    : "text-muted-foreground/50 group-hover:text-foreground/50 group-hover:scale-110"
                }`}
              />
            </button>
          </div>

          {/* ── Progress Bar ──────────────────── */}
          <div className="mb-5">
            <div
              ref={progressBarRef}
              className="group relative cursor-pointer rounded-full bg-[hsl(var(--progress-bg))] touch-none"
              style={{
                height: isDragging ? 5 : undefined,
                transition: "height 0.15s ease",
              }}
              onMouseDown={onProgressDown}
              onTouchStart={onProgressDown}
              data-testid="progress-bar"
            >
              {/* Invisible expanded hit area */}
              <div className="absolute -inset-y-3 inset-x-0 z-10" />

              {/* Track background */}
              <div className="h-[4px] w-full rounded-full bg-[hsl(var(--progress-bg))] group-hover:h-[5px] transition-all duration-150 overflow-hidden">
                {/* Fill */}
                <div
                  className="h-full rounded-full progress-fill-gradient"
                  style={{
                    width: `${progressPct}%`,
                    transition: isDragging || isRealAudio ? "none" : "width 0.25s linear",
                  }}
                />
              </div>

              {/* Thumb */}
              <div
                className={`absolute top-1/2 z-20 h-[13px] w-[13px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-lg transition-all duration-150 ${
                  isDragging
                    ? "opacity-100 scale-110"
                    : "opacity-0 group-hover:opacity-100 group-hover:scale-100"
                }`}
                style={{ left: `${progressPct}%`, pointerEvents: "none" }}
              />
            </div>

            <div className="mt-2 flex justify-between text-[11px] tabular-nums font-medium text-muted-foreground/50">
              <span>{fmt(progress)}</span>
              <span>{track.duration > 0 ? fmt(track.duration) : "--:--"}</span>
            </div>
          </div>

          {/* ── Controls ──────────────────────── */}
          <div className="flex w-full items-center justify-between mb-5 px-1">
            {/* Shuffle */}
            <button
              onClick={() => setShuffle(s => !s)}
              className={`relative p-2 rounded-full transition-all duration-200 active:scale-85 ${
                shuffle ? "text-primary" : "text-muted-foreground/50 hover:text-foreground/60"
              }`}
              aria-label="Shuffle"
              data-testid="button-shuffle"
            >
              <Shuffle size={17} />
              {shuffle && (
                <span className="absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary" />
              )}
            </button>

            {/* Previous */}
            <button
              onClick={() => skip(-1)}
              className="p-2.5 text-foreground/70 transition-all duration-150 hover:text-foreground hover:scale-110 active:scale-90 rounded-full"
              aria-label="Previous"
              data-testid="button-prev"
            >
              <SkipBack size={26} fill="currentColor" />
            </button>

            {/* Play / Pause */}
            <button
              onClick={() => setIsPlaying(p => !p)}
              className={`relative flex items-center justify-center rounded-full bg-white transition-all duration-200 hover:scale-105 active:scale-95 ${
                isPlaying ? "animate-pulse-ring" : ""
              }`}
              style={{ width: 60, height: 60, boxShadow: "0 4px 24px rgba(0,0,0,0.4)" }}
              aria-label={isPlaying ? "Pause" : "Play"}
              data-testid="button-play-pause"
            >
              <span
                className="transition-all duration-200"
                style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                {isPlaying
                  ? <Pause size={24} className="text-black" fill="black" />
                  : <Play  size={24} className="text-black ml-0.5" fill="black" />
                }
              </span>
            </button>

            {/* Next */}
            <button
              onClick={() => skip(1)}
              className="p-2.5 text-foreground/70 transition-all duration-150 hover:text-foreground hover:scale-110 active:scale-90 rounded-full"
              aria-label="Next"
              data-testid="button-next"
            >
              <SkipForward size={26} fill="currentColor" />
            </button>

            {/* Repeat */}
            <button
              onClick={() => setRepeat(r => !r)}
              className={`relative p-2 rounded-full transition-all duration-200 active:scale-85 ${
                repeat ? "text-primary" : "text-muted-foreground/50 hover:text-foreground/60"
              }`}
              aria-label="Repeat"
              data-testid="button-repeat"
            >
              <Repeat size={17} />
              {repeat && (
                <span className="absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary" />
              )}
            </button>
          </div>

          {/* ── Volume ────────────────────────── */}
          <div className="flex items-center gap-3 mb-8">
            <button
              onClick={() => setMuted(m => !m)}
              className="flex-shrink-0 text-muted-foreground/50 hover:text-foreground/60 transition-colors duration-150 active:scale-90"
              aria-label={muted ? "Unmute" : "Mute"}
              data-testid="button-mute"
            >
              {muted || volume === 0 ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>

            <div
              ref={volumeBarRef}
              className="group relative flex-1 cursor-pointer touch-none"
              onMouseDown={onVolumeDown}
              onTouchStart={onVolumeDown}
              data-testid="volume-bar"
            >
              <div className="absolute -inset-y-3 inset-x-0" />
              <div className="h-[3px] w-full rounded-full bg-[hsl(var(--progress-bg))] group-hover:h-[4px] transition-all duration-150 overflow-hidden">
                <div
                  className="h-full rounded-full bg-muted-foreground/40 group-hover:bg-foreground/50 transition-colors duration-150"
                  style={{ width: `${effectiveVol}%` }}
                />
              </div>
              {/* Thumb */}
              <div
                className={`absolute top-1/2 h-[10px] w-[10px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white transition-opacity duration-150 ${
                  isVolDragging ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                }`}
                style={{ left: `${effectiveVol}%`, pointerEvents: "none" }}
              />
            </div>

            <span className="w-7 flex-shrink-0 text-right text-[11px] tabular-nums font-medium text-muted-foreground/40">
              {effectiveVol}
            </span>
          </div>

          {/* ── Playlist ──────────────────────── */}
          <div>
            {/* Playlist header */}
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => setShowPlaylist(s => !s)}
                className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/60 hover:text-foreground/60 transition-colors duration-200"
                data-testid="button-toggle-playlist"
              >
                <ListMusic size={13} />
                Playlist
                <span className="ml-0.5 text-muted-foreground/40">· {tracks.length}</span>
                <ChevronDown
                  size={12}
                  className={`transition-transform duration-300 ${showPlaylist ? "rotate-180" : "rotate-0"}`}
                />
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 rounded-full glass px-3.5 py-1.5 text-[11px] font-medium text-foreground/60 transition-all duration-200 hover:text-foreground/90 hover:bg-white/8 active:scale-95"
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
              className={`overflow-hidden transition-all duration-400 ease-out ${
                showPlaylist ? "max-h-[340px] opacity-100" : "max-h-0 opacity-0 pointer-events-none"
              }`}
              style={{ transition: "max-height 0.35s cubic-bezier(0.4,0,0.2,1), opacity 0.25s ease" }}
            >
              <div ref={playlistRef} className="playlist-scroll max-h-[320px] overflow-y-auto space-y-[2px] pb-1">
                {tracks.map((t, i) => (
                  <div
                    key={`${t.title}-${i}`}
                    ref={el => { trackItemsRef.current[i] = el; }}
                    onClick={() => playTrack(i)}
                    className={`group relative flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 ${
                      i === currentTrack
                        ? "track-active-bar"
                        : "hover:bg-white/[0.035]"
                    }`}
                    data-testid={`track-item-${i}`}
                  >
                    {/* Index / EQ */}
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white/5">
                      {i === currentTrack && isPlaying ? (
                        <EqBars />
                      ) : i === currentTrack ? (
                        <Play size={11} className="text-primary ml-0.5" fill="currentColor" />
                      ) : (
                        <span className="text-[11px] font-medium tabular-nums text-muted-foreground/40 group-hover:hidden">
                          {i + 1}
                        </span>
                      )}
                      {i !== currentTrack && (
                        <Play size={11} className="text-foreground/50 ml-0.5 hidden group-hover:block" fill="currentColor" />
                      )}
                    </div>

                    {/* Title + Artist */}
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-[13px] font-medium leading-tight ${
                        i === currentTrack ? "text-primary" : "text-foreground/80 group-hover:text-foreground"
                      } transition-colors duration-150`}>
                        {t.title}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] text-muted-foreground/50">
                        {t.artist}
                      </p>
                    </div>

                    {/* Duration */}
                    <span className="flex-shrink-0 text-[11px] tabular-nums text-muted-foreground/40">
                      {t.duration > 0 ? fmt(t.duration) : "--:--"}
                    </span>

                    {/* Remove button */}
                    {t.url && (
                      <button
                        onClick={e => removeTrack(i, e)}
                        className="ml-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 text-muted-foreground/40 hover:text-foreground/60 active:scale-90"
                        aria-label="Remove"
                        data-testid={`button-remove-${i}`}
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Keyboard hint ─────────────────── */}
          <p className="mt-5 text-center text-[10px] text-muted-foreground/25 select-none">
            Space · ← → · ↑ ↓ volume · M mute · L like
          </p>
        </div>
      </div>

      {/* ─── Mini Player ────────────────────────── */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 px-3 pb-3 transition-all duration-300 ${
          miniVisible ? "translate-y-0 opacity-100" : "translate-y-[110%] opacity-0 pointer-events-none"
        }`}
      >
        <div className="glass-strong mx-auto max-w-lg rounded-2xl px-4 py-3 shadow-[0_-8px_40px_rgba(0,0,0,0.6)]">
          {/* Mini progress bar (top edge) */}
          <div className="absolute top-0 left-4 right-4 h-[2px] rounded-full overflow-hidden bg-white/10">
            <div
              className="h-full progress-fill-gradient"
              style={{
                width: `${progressPct}%`,
                transition: isDragging || isRealAudio ? "none" : "width 0.25s linear",
              }}
            />
          </div>

          <div className="flex items-center gap-3">
            {/* Album thumb */}
            <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-xl shadow-lg">
              <img src={albumCover} alt="" className="h-full w-full object-cover" draggable={false} />
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <p className={`truncate text-[13px] font-semibold leading-tight transition-opacity duration-200 ${transitioning ? "opacity-0" : "opacity-100"}`}>
                {track.title}
              </p>
              <p className="truncate text-[11px] text-muted-foreground/60 mt-0.5">
                {track.artist}
              </p>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => setLiked(l => !l)}
                className="p-2 transition-all duration-150 active:scale-85"
                aria-label="Like"
              >
                <Heart size={15} className={liked ? "fill-primary text-primary" : "text-muted-foreground/50"} />
              </button>
              <button
                onClick={() => skip(-1)}
                className="p-2 text-foreground/60 hover:text-foreground transition-colors active:scale-90"
                aria-label="Previous"
                data-testid="mini-button-prev"
              >
                <SkipBack size={17} fill="currentColor" />
              </button>
              <button
                onClick={() => setIsPlaying(p => !p)}
                className="mx-1 flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-md transition-all duration-150 hover:scale-105 active:scale-95"
                aria-label={isPlaying ? "Pause" : "Play"}
                data-testid="mini-button-play-pause"
              >
                {isPlaying
                  ? <Pause size={15} fill="black" className="text-black" />
                  : <Play  size={15} fill="black" className="text-black ml-0.5" />
                }
              </button>
              <button
                onClick={() => skip(1)}
                className="p-2 text-foreground/60 hover:text-foreground transition-colors active:scale-90"
                aria-label="Next"
                data-testid="mini-button-next"
              >
                <SkipForward size={17} fill="currentColor" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MusicPlayer;
