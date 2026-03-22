import { useState, useEffect, useCallback } from "react";
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

  const skip = useCallback(
    (dir: 1 | -1) => {
      setCurrentTrack((c) => (c + dir + tracks.length) % tracks.length);
      setProgress(0);
    },
    []
  );

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    setProgress(ratio * track.duration);
  };

  const progressPercent = (progress / track.duration) * 100;

  return (
    <div className="player-gradient flex min-h-screen items-center justify-center px-4 py-8">
      <div
        className="flex w-full max-w-[420px] flex-col items-center gap-8 opacity-0 animate-fade-up"
        style={{ animationDelay: "0.1s" }}
      >
        {/* Header */}
        <div
          className="flex w-full items-center justify-between opacity-0 animate-fade-up"
          style={{ animationDelay: "0.15s" }}
        >
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Now Playing
          </span>
          <span className="text-sm font-bold tracking-tight text-foreground">
            MAXI
          </span>
        </div>

        {/* Album Art */}
        <div
          className="opacity-0 animate-fade-up"
          style={{ animationDelay: "0.25s" }}
        >
          <div
            className={`aspect-square w-[280px] sm:w-[340px] overflow-hidden rounded-2xl shadow-2xl shadow-black/60 transition-transform duration-700 ease-out ${
              isPlaying ? "animate-album-pulse" : ""
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
          style={{ animationDelay: "0.35s" }}
        >
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold leading-tight text-foreground">
              {track.title}
            </h1>
            <p className="mt-0.5 truncate text-sm text-muted-foreground">
              {track.artist}
            </p>
          </div>
          <button
            onClick={() => setLiked(!liked)}
            className="mt-0.5 flex-shrink-0 transition-transform duration-150 active:scale-90"
            aria-label="Like"
          >
            <Heart
              size={22}
              className={`transition-colors duration-200 ${
                liked
                  ? "fill-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            />
          </button>
        </div>

        {/* Progress */}
        <div
          className="w-full space-y-2 opacity-0 animate-fade-up"
          style={{ animationDelay: "0.4s" }}
        >
          <div
            className="group relative h-1.5 w-full cursor-pointer rounded-full bg-progress-bg transition-all hover:h-2"
            onClick={handleProgressClick}
          >
            <div
              className="absolute left-0 top-0 h-full rounded-full bg-progress-fill transition-all duration-200"
              style={{ width: `${progressPercent}%` }}
            />
            <div
              className="absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full bg-foreground opacity-0 shadow-md transition-opacity duration-200 group-hover:opacity-100"
              style={{ left: `${progressPercent}%`, transform: `translateX(-50%) translateY(-50%)` }}
            />
          </div>
          <div className="flex justify-between text-[11px] tabular-nums text-muted-foreground">
            <span>{formatTime(progress)}</span>
            <span>{formatTime(track.duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div
          className="flex w-full items-center justify-center gap-6 opacity-0 animate-fade-up"
          style={{ animationDelay: "0.5s" }}
        >
          <button
            onClick={() => setShuffle(!shuffle)}
            className={`transition-colors duration-200 active:scale-90 ${
              shuffle ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
            aria-label="Shuffle"
          >
            <Shuffle size={18} />
          </button>

          <button
            onClick={() => skip(-1)}
            className="text-foreground transition-all duration-150 hover:scale-105 active:scale-90"
            aria-label="Previous"
          >
            <SkipBack size={24} fill="currentColor" />
          </button>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-foreground transition-all duration-150 hover:scale-105 active:scale-95"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause size={26} className="text-background" fill="currentColor" />
            ) : (
              <Play size={26} className="ml-1 text-background" fill="currentColor" />
            )}
          </button>

          <button
            onClick={() => skip(1)}
            className="text-foreground transition-all duration-150 hover:scale-105 active:scale-90"
            aria-label="Next"
          >
            <SkipForward size={24} fill="currentColor" />
          </button>

          <button
            onClick={() => setRepeat(!repeat)}
            className={`transition-colors duration-200 active:scale-90 ${
              repeat ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
            aria-label="Repeat"
          >
            <Repeat size={18} />
          </button>
        </div>

        {/* Volume hint */}
        <div
          className="flex items-center gap-2 text-muted-foreground opacity-0 animate-fade-up"
          style={{ animationDelay: "0.6s" }}
        >
          <Volume2 size={14} />
          <div className="h-1 w-20 rounded-full bg-progress-bg">
            <div className="h-full w-3/4 rounded-full bg-muted-foreground/60" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MusicPlayer;
