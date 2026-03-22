import { useState, useEffect, useCallback, useRef } from "react";
import { Play, Pause, SkipBack, SkipForward, Heart, Shuffle, Repeat, Volume2 } from "lucide-react";
import albumCover from "@/assets/album-cover.jpg";

const tracks = [
  { title: "Midnight Drive", artist: "Lena Voss", duration: 237 },
  { title: "Golden Hour", artist: "Theo Marcell", duration: 204 },
  { title: "Still Waters", artist: "Aya Nakamura", duration: 189 },
];

const formatTime = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

const MusicPlayer = () => {
  const [currentTrack, setCurrentTrack] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [liked, setLiked] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [volume, setVolume] = useState(75);
  const [transitioning, setTransitioning] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);

  const track = tracks[currentTrack];

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= track.duration) {
          setIsPlaying(false);
          return 0;
        }
        return p + 0.25;
      });
    }, 250);
    return () => clearInterval(interval);
  }, [isPlaying, track.duration]);

  const skip = useCallback((dir: 1 | -1) => {
    setTransitioning(true);
    setTimeout(() => {
      setCurrentTrack((c) => (c + dir + tracks.length) % tracks.length);
      setProgress(0);
      setTimeout(() => setTransitioning(false), 50);
    }, 200);
  }, []);

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setProgress(ratio * track.duration);
  };

  const handleVolumeClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setVolume(Math.round(ratio * 100));
  };

  const progressPercent = (progress / track.duration) * 100;

  return (
    <div className="player-gradient flex min-h-[100dvh] items-center justify-center px-5 py-10">
      <div
        className={`flex w-full max-w-[380px] flex-col items-center gap-7 transition-opacity duration-300 ${
          transitioning ? "opacity-0 scale-[0.98]" : "opacity-100 scale-100"
        }`}
        style={{ transitionProperty: "opacity, transform" }}
      >
        {/* Header */}
        <div
          className="flex w-full items-center justify-between opacity-0 animate-fade-up"
          style={{ animationDelay: "0.1s" }}
        >
          <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Now Playing
          </span>
          <span className="text-[13px] font-semibold tracking-tight text-foreground/80">
            MAXI
          </span>
        </div>

        {/* Album Art */}
        <div
          className="opacity-0 animate-fade-up"
          style={{ animationDelay: "0.2s" }}
        >
          <div
            className={`aspect-square w-[260px] sm:w-[320px] overflow-hidden rounded-xl shadow-[0_8px_40px_rgba(0,0,0,0.5)] transition-transform duration-[2s] ease-out ${
              isPlaying ? "scale-[1.01]" : "scale-100"
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

        {/* Track Info */}
        <div
          className="flex w-full items-start justify-between gap-4 opacity-0 animate-fade-up"
          style={{ animationDelay: "0.3s" }}
        >
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold leading-snug text-foreground tracking-[-0.01em]">
              {track.title}
            </h1>
            <p className="mt-0.5 truncate text-[13px] text-muted-foreground">
              {track.artist}
            </p>
          </div>
          <button
            onClick={() => setLiked(!liked)}
            className="mt-1 flex-shrink-0 transition-all duration-200 active:scale-90"
            aria-label="Like"
          >
            <Heart
              size={20}
              className={`transition-colors duration-200 ${
                liked
                  ? "fill-primary text-primary"
                  : "text-muted-foreground hover:text-foreground/70"
              }`}
            />
          </button>
        </div>

        {/* Progress */}
        <div
          className="w-full space-y-1.5 opacity-0 animate-fade-up"
          style={{ animationDelay: "0.35s" }}
        >
          <div
            ref={progressRef}
            className="group relative h-1 w-full cursor-pointer rounded-full bg-progress-bg transition-[height] duration-200 hover:h-1.5"
            onClick={handleProgressClick}
          >
            <div
              className="absolute left-0 top-0 h-full rounded-full bg-progress-fill"
              style={{
                width: `${progressPercent}%`,
                transition: "width 0.25s linear",
              }}
            />
            <div
              className="absolute top-1/2 h-3 w-3 rounded-full bg-foreground opacity-0 shadow-sm transition-opacity duration-150 group-hover:opacity-100"
              style={{
                left: `${progressPercent}%`,
                transform: "translateX(-50%) translateY(-50%)",
              }}
            />
          </div>
          <div className="flex justify-between text-[10px] tabular-nums text-muted-foreground/70">
            <span>{formatTime(progress)}</span>
            <span>{formatTime(track.duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div
          className="flex w-full items-center justify-center gap-7 opacity-0 animate-fade-up"
          style={{ animationDelay: "0.4s" }}
        >
          <button
            onClick={() => setShuffle(!shuffle)}
            className={`transition-colors duration-200 active:scale-95 ${
              shuffle ? "text-primary" : "text-muted-foreground hover:text-foreground/70"
            }`}
            aria-label="Shuffle"
          >
            <Shuffle size={16} />
          </button>

          <button
            onClick={() => skip(-1)}
            className="text-foreground/90 transition-all duration-150 hover:text-foreground active:scale-95"
            aria-label="Previous"
          >
            <SkipBack size={22} fill="currentColor" />
          </button>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-foreground transition-all duration-150 hover:scale-[1.04] active:scale-[0.96]"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause size={22} className="text-background" fill="currentColor" />
            ) : (
              <Play size={22} className="ml-0.5 text-background" fill="currentColor" />
            )}
          </button>

          <button
            onClick={() => skip(1)}
            className="text-foreground/90 transition-all duration-150 hover:text-foreground active:scale-95"
            aria-label="Next"
          >
            <SkipForward size={22} fill="currentColor" />
          </button>

          <button
            onClick={() => setRepeat(!repeat)}
            className={`transition-colors duration-200 active:scale-95 ${
              repeat ? "text-primary" : "text-muted-foreground hover:text-foreground/70"
            }`}
            aria-label="Repeat"
          >
            <Repeat size={16} />
          </button>
        </div>

        {/* Volume */}
        <div
          className="flex items-center gap-2 opacity-0 animate-fade-up"
          style={{ animationDelay: "0.45s" }}
        >
          <Volume2 size={13} className="text-muted-foreground/60" />
          <div
            className="group h-[3px] w-20 cursor-pointer rounded-full bg-progress-bg transition-[height] duration-200 hover:h-1"
            onClick={handleVolumeClick}
          >
            <div
              className="h-full rounded-full bg-muted-foreground/50 transition-colors duration-200 group-hover:bg-foreground/60"
              style={{ width: `${volume}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MusicPlayer;
