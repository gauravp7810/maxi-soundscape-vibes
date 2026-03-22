import { useRef, useState, memo } from "react";
import { Play, Pause, SkipBack, SkipForward, Heart, X } from "lucide-react";
import { usePlayer, fmt } from "@/context/PlayerContext";
import albumCover from "@/assets/album-cover.jpg";

/* The mini player sits above the bottom nav (above 64px) */
export const MiniPlayer = memo(function MiniPlayer({ visible }: { visible?: boolean }) {
  const {
    tracks, currentTrack, isPlaying, progress, liked, transitioning,
    setIsPlaying, setLiked, skip,
  } = usePlayer();

  const [dismissed, setDismissed] = useState(false);
  const dragRef = useRef<{ startX: number; moved: boolean } | null>(null);

  const track = tracks[currentTrack];
  const progressPct =
    track && track.duration > 0 ? (progress / track.duration) * 100 : 0;

  // show when explicitly told or when a track is loaded
  const show = !dismissed && (visible !== false) && !!track;

  const onPointerDown = (e: React.PointerEvent) => {
    dragRef.current = { startX: e.clientX, moved: false };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    if (Math.abs(e.clientX - dragRef.current.startX) > 5) dragRef.current.moved = true;
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (dragRef.current && !dragRef.current.moved) {
      // tap the player itself (not a button) — do nothing special
    }
    dragRef.current = null;
  };

  return (
    <div
      className={`fixed left-0 right-0 z-40 px-3 transition-all duration-350 ease-out ${
        show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      }`}
      style={{ bottom: "calc(64px + env(safe-area-inset-bottom) + 6px)" }}
    >
      <div
        className="glass-strong mx-auto max-w-lg rounded-2xl overflow-hidden shadow-[0_4px_40px_rgba(0,0,0,0.55)]"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        {/* Progress line */}
        <div className="h-[2px] w-full bg-white/10">
          <div
            className="h-full progress-fill-gradient"
            style={{
              width: `${progressPct}%`,
              transition: "width 0.25s linear",
            }}
          />
        </div>

        <div className="flex items-center gap-3 px-4 py-3">
          {/* Album art */}
          <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-xl shadow-md">
            <img
              src={albumCover}
              alt={track?.title}
              className="h-full w-full object-cover"
              draggable={false}
            />
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1">
            <p
              className={`truncate text-[13px] font-semibold leading-tight transition-opacity duration-200 ${
                transitioning ? "opacity-0" : "opacity-100"
              }`}
            >
              {track?.title}
            </p>
            <p className="truncate text-[11px] text-muted-foreground/60 mt-0.5">
              {track?.artist} · {fmt(progress)}
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <button
              onClick={() => setLiked(l => !l)}
              className="p-2 transition-all duration-150 active:scale-85"
              aria-label="Like"
            >
              <Heart
                size={15}
                className={liked ? "fill-primary text-primary" : "text-muted-foreground/50"}
              />
            </button>
            <button
              onClick={() => skip(-1)}
              className="p-2 text-foreground/60 hover:text-foreground transition-colors active:scale-90"
              aria-label="Previous"
            >
              <SkipBack size={16} fill="currentColor" />
            </button>
            <button
              onClick={() => setIsPlaying(p => !p)}
              className="mx-1 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full btn-gradient shadow-md transition-all duration-150 hover:scale-105 active:scale-95"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying
                ? <Pause size={14} fill="white" className="text-white" />
                : <Play  size={14} fill="white" className="text-white ml-[1px]" />
              }
            </button>
            <button
              onClick={() => skip(1)}
              className="p-2 text-foreground/60 hover:text-foreground transition-colors active:scale-90"
              aria-label="Next"
            >
              <SkipForward size={16} fill="currentColor" />
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="p-2 text-muted-foreground/30 hover:text-foreground/50 transition-colors active:scale-90"
              aria-label="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
