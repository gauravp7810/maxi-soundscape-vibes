import { useRef, useState } from "react";
import { Play, Pause, SkipBack, SkipForward, Heart, Shuffle, Repeat,
         Volume2, VolumeX, Plus, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { usePlayer, fmt } from "@/context/PlayerContext";
import albumCover from "@/assets/album-cover.jpg";

/* ── Equalizer bars ───────────────────────────── */
const EqBars = () => (
  <div className="flex items-end gap-[2px] h-3.5">
    <span className="w-[3px] rounded-sm bg-primary animate-eq-1 inline-block" />
    <span className="w-[3px] rounded-sm bg-primary animate-eq-2 inline-block" />
    <span className="w-[3px] rounded-sm bg-primary animate-eq-3 inline-block" />
  </div>
);

const Home = () => {
  const {
    tracks, currentTrack, isPlaying, progress, liked, shuffle, repeat,
    volume, muted, transitioning, trackKey, recentlyPlayed,
    setIsPlaying, setLiked, setShuffle, setRepeat, setVolume, setMuted,
    skip, playTrack, seekTo, addFiles, progressBarRef,
  } = usePlayer();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging,    setIsDragging]    = useState(false);
  const [isVolDragging, setIsVolDragging] = useState(false);
  const localProgressRef = useRef<HTMLDivElement>(null);
  const localVolRef      = useRef<HTMLDivElement>(null);

  const track       = tracks[currentTrack];
  const effectiveVol = muted ? 0 : volume;
  const progressPct  = track?.duration > 0 ? (progress / track.duration) * 100 : 0;

  /* Drag helpers */
  const makeDragger = (
    barRef: React.RefObject<HTMLDivElement | null>,
    onValue: (ratio: number) => void,
    setDragging: (v: boolean) => void,
  ) => (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setDragging(true);
    const seek = (cx: number) => {
      const bar = barRef.current;
      if (!bar) return;
      const r = bar.getBoundingClientRect();
      onValue(Math.max(0, Math.min(1, (cx - r.left) / r.width)));
    };
    seek("touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX);
    const mv = (ev: MouseEvent | TouchEvent) =>
      seek("touches" in ev ? ev.touches[0].clientX : (ev as MouseEvent).clientX);
    const up = () => {
      setDragging(false);
      window.removeEventListener("mousemove", mv as EventListener);
      window.removeEventListener("touchmove", mv as EventListener);
      window.removeEventListener("mouseup", up);
      window.removeEventListener("touchend", up);
    };
    window.addEventListener("mousemove", mv as EventListener);
    window.addEventListener("touchmove", mv as EventListener);
    window.addEventListener("mouseup", up);
    window.addEventListener("touchend", up);
  };

  const recentTracks = recentlyPlayed
    .map(id => tracks.find(t => t.id === id))
    .filter(Boolean) as typeof tracks;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="page-fade flex flex-col gap-6 px-4 pt-6 pb-2">

      {/* ── Greeting ─────────────────────────── */}
      <div>
        <h1 className="text-[22px] font-bold tracking-tight text-foreground">
          {greeting} 👋
        </h1>
        <p className="mt-0.5 text-[13px] text-muted-foreground/60">
          {tracks.length} tracks in your library
        </p>
      </div>

      {/* ── Now Playing Card ─────────────────── */}
      <div className="glass rounded-3xl overflow-hidden">
        {/* Album art */}
        <div key={trackKey} className="relative w-full">
          <img
            src={albumCover}
            alt="Album artwork"
            className={`h-[220px] w-full object-cover transition-all duration-700 ${
              transitioning ? "opacity-0 scale-[1.04] blur-sm" : "opacity-100 scale-100 blur-0"
            }`}
            draggable={false}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Overlay info */}
          <div className="absolute bottom-0 left-0 right-0 px-4 pb-4">
            <div className={`transition-all duration-300 ${transitioning ? "opacity-0 translate-y-2" : "opacity-100"}`}>
              <h2 className="text-[17px] font-bold leading-tight text-white">{track?.title}</h2>
              <p className="text-[13px] text-white/70 mt-0.5">{track?.artist}</p>
            </div>
          </div>

          {/* Like button */}
          <button
            onClick={() => setLiked(l => !l)}
            className="absolute top-3 right-3 p-2 rounded-full bg-black/30 backdrop-blur-sm transition-all duration-200 active:scale-85"
            aria-label="Like"
          >
            <Heart size={17} className={liked ? "fill-primary text-primary" : "text-white/70"} />
          </button>
        </div>

        <div className="px-4 pt-4 pb-5 space-y-4">
          {/* Progress */}
          <div>
            <div
              ref={localProgressRef}
              className="group relative h-[4px] w-full cursor-pointer rounded-full bg-white/10 touch-none"
              onMouseDown={makeDragger(localProgressRef, seekTo, setIsDragging)}
              onTouchStart={makeDragger(localProgressRef, seekTo, setIsDragging)}
            >
              <div className="absolute -inset-y-3 inset-x-0" />
              <div
                className="h-full rounded-full progress-fill-gradient"
                style={{
                  width: `${progressPct}%`,
                  transition: isDragging ? "none" : "width 0.25s linear",
                }}
              />
              <div
                className={`absolute top-1/2 h-3 w-3 rounded-full bg-white shadow -translate-x-1/2 -translate-y-1/2 transition-opacity duration-150 ${
                  isDragging ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                }`}
                style={{ left: `${progressPct}%`, pointerEvents: "none" }}
              />
            </div>
            <div className="mt-1.5 flex justify-between text-[10px] tabular-nums text-muted-foreground/50">
              <span>{fmt(progress)}</span>
              <span>{track?.duration > 0 ? fmt(track.duration) : "--:--"}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between px-1">
            <button
              onClick={() => setShuffle(s => !s)}
              className={`relative p-2 rounded-full transition-all duration-200 active:scale-85 ${
                shuffle ? "text-primary" : "text-muted-foreground/40 hover:text-foreground/60"
              }`}
            >
              <Shuffle size={17} />
              {shuffle && <span className="absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary" />}
            </button>

            <button
              onClick={() => skip(-1)}
              className="p-2 text-foreground/70 hover:text-foreground transition-all hover:scale-110 active:scale-90"
            >
              <SkipBack size={26} fill="currentColor" />
            </button>

            <button
              onClick={() => setIsPlaying(p => !p)}
              className={`flex items-center justify-center rounded-full bg-white shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 ${isPlaying ? "animate-pulse-ring" : ""}`}
              style={{ width: 58, height: 58 }}
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying
                ? <Pause size={22} fill="black" className="text-black" />
                : <Play  size={22} fill="black" className="text-black ml-0.5" />
              }
            </button>

            <button
              onClick={() => skip(1)}
              className="p-2 text-foreground/70 hover:text-foreground transition-all hover:scale-110 active:scale-90"
            >
              <SkipForward size={26} fill="currentColor" />
            </button>

            <button
              onClick={() => setRepeat(r => !r)}
              className={`relative p-2 rounded-full transition-all duration-200 active:scale-85 ${
                repeat ? "text-primary" : "text-muted-foreground/40 hover:text-foreground/60"
              }`}
            >
              <Repeat size={17} />
              {repeat && <span className="absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary" />}
            </button>
          </div>

          {/* Volume */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMuted(m => !m)}
              className="flex-shrink-0 text-muted-foreground/50 hover:text-foreground/60 transition-colors active:scale-90"
            >
              {muted || volume === 0 ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>
            <div
              ref={localVolRef}
              className="group relative flex-1 cursor-pointer touch-none"
              onMouseDown={makeDragger(localVolRef, (r) => { setVolume(Math.round(r * 100)); setMuted(false); }, setIsVolDragging)}
              onTouchStart={makeDragger(localVolRef, (r) => { setVolume(Math.round(r * 100)); setMuted(false); }, setIsVolDragging)}
            >
              <div className="absolute -inset-y-3 inset-x-0" />
              <div className="h-[3px] w-full rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-muted-foreground/40 group-hover:bg-foreground/50 transition-colors"
                  style={{ width: `${effectiveVol}%` }}
                />
              </div>
              <div
                className={`absolute top-1/2 h-2.5 w-2.5 rounded-full bg-white -translate-x-1/2 -translate-y-1/2 transition-opacity ${isVolDragging ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                style={{ left: `${effectiveVol}%`, pointerEvents: "none" }}
              />
            </div>
            <span className="w-6 text-right text-[10px] tabular-nums text-muted-foreground/40 flex-shrink-0">{effectiveVol}</span>
          </div>
        </div>
      </div>

      {/* ── Recently Played ────────────────────── */}
      {recentTracks.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[15px] font-semibold text-foreground">Recently Played</h2>
            <Link to="/songs" className="flex items-center gap-0.5 text-[12px] text-primary hover:text-primary/80 transition-colors">
              See all <ChevronRight size={13} />
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
            {recentTracks.slice(0, 5).map((t, i) => {
              const idx = tracks.findIndex(tr => tr.id === t.id);
              const active = idx === currentTrack;
              return (
                <button
                  key={t.id}
                  onClick={() => playTrack(idx)}
                  className="flex-shrink-0 w-[130px] rounded-2xl overflow-hidden glass transition-all duration-200 hover:bg-white/8 active:scale-95 text-left"
                >
                  <div className="relative h-[100px] bg-gradient-to-br from-primary/20 to-transparent flex items-center justify-center">
                    <img src={albumCover} alt="" className="h-full w-full object-cover opacity-60" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      {active && isPlaying ? (
                        <div className="flex items-end gap-[3px] h-5">
                          <span className="w-1 rounded-sm bg-white animate-eq-1 inline-block" />
                          <span className="w-1 rounded-sm bg-white animate-eq-2 inline-block" />
                          <span className="w-1 rounded-sm bg-white animate-eq-3 inline-block" />
                        </div>
                      ) : (
                        <div className="h-9 w-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                          {active
                            ? <Pause size={14} fill="white" className="text-white" />
                            : <Play  size={14} fill="white" className="text-white ml-0.5" />
                          }
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="p-2.5">
                    <p className={`text-[12px] font-semibold truncate ${active ? "text-primary" : "text-foreground"}`}>{t.title}</p>
                    <p className="text-[10px] text-muted-foreground/60 truncate mt-0.5">{t.artist}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Quick actions ─────────────────────── */}
      <section className="grid grid-cols-2 gap-3 pb-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-3 rounded-2xl glass px-4 py-3.5 text-left transition-all duration-200 hover:bg-white/8 active:scale-95"
        >
          <div className="h-9 w-9 rounded-xl bg-primary/20 flex items-center justify-center">
            <Plus size={18} className="text-primary" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-foreground">Add Songs</p>
            <p className="text-[11px] text-muted-foreground/50">Import audio</p>
          </div>
        </button>
        <Link
          to="/playlists"
          className="flex items-center gap-3 rounded-2xl glass px-4 py-3.5 transition-all duration-200 hover:bg-white/8 active:scale-95"
        >
          <div className="h-9 w-9 rounded-xl bg-primary/20 flex items-center justify-center">
            <ChevronRight size={18} className="text-primary" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-foreground">Playlists</p>
            <p className="text-[11px] text-muted-foreground/50">Manage yours</p>
          </div>
        </Link>
      </section>

      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        multiple
        onChange={e => { if (e.target.files) addFiles(e.target.files); e.target.value = ""; }}
        className="hidden"
      />
    </div>
  );
};

export default Home;
