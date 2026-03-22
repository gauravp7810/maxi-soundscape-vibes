import { useState, useEffect, useCallback, useRef } from "react";
import { Play, Pause, SkipBack, SkipForward, Heart, Shuffle, Repeat, Volume2, Plus, Music, X } from "lucide-react";
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
];

const formatTime = (s: number) => {
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
  const [showPlaylist, setShowPlaylist] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const track = tracks[currentTrack];
  const isRealAudio = !!track?.url;

  // Sync audio element with current track
  useEffect(() => {
    if (!track?.url) return;
    if (audioRef.current) {
      audioRef.current.pause();
      URL.revokeObjectURL(audioRef.current.src);
    }
    const audio = new Audio(track.url);
    audio.volume = volume / 100;
    audioRef.current = audio;

    audio.addEventListener("loadedmetadata", () => {
      setTracks((prev) =>
        prev.map((t, i) =>
          i === currentTrack ? { ...t, duration: audio.duration } : t
        )
      );
    });

    audio.addEventListener("timeupdate", () => {
      setProgress(audio.currentTime);
    });

    audio.addEventListener("ended", () => {
      if (repeat) {
        audio.currentTime = 0;
        audio.play();
      } else {
        skip(1);
      }
    });

    if (isPlaying) audio.play().catch(() => {});

    return () => {
      audio.pause();
      audio.removeEventListener("loadedmetadata", () => {});
      audio.removeEventListener("timeupdate", () => {});
      audio.removeEventListener("ended", () => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack, track?.url]);

  // Simulated progress for default tracks
  useEffect(() => {
    if (isRealAudio || !isPlaying) return;
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
  }, [isPlaying, track.duration, isRealAudio]);

  // Sync play/pause state
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

  const skip = useCallback(
    (dir: 1 | -1) => {
      setTransitioning(true);
      setTimeout(() => {
        setCurrentTrack((c) => (c + dir + tracks.length) % tracks.length);
        setProgress(0);
        setTimeout(() => setTransitioning(false), 50);
      }, 200);
    },
    [tracks.length]
  );

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newTime = ratio * track.duration;
    setProgress(newTime);
    if (audioRef.current && isRealAudio) {
      audioRef.current.currentTime = newTime;
    }
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
    }, 200);
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

  const progressPercent = track.duration > 0 ? (progress / track.duration) * 100 : 0;

  return (
    <div className="player-gradient flex min-h-[100dvh] items-center justify-center px-5 py-10">
      <div className="flex w-full max-w-[420px] flex-col items-center gap-0">
        {/* Player Section */}
        <div
          className={`flex w-full max-w-[380px] flex-col items-center gap-7 transition-all duration-300 ${
            transitioning ? "opacity-0 scale-[0.98]" : "opacity-100 scale-100"
          }`}
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
              className="group relative h-1 w-full cursor-pointer rounded-full bg-progress-bg transition-[height] duration-200 hover:h-1.5"
              onClick={handleProgressClick}
            >
              <div
                className="absolute left-0 top-0 h-full rounded-full bg-progress-fill"
                style={{
                  width: `${progressPercent}%`,
                  transition: isRealAudio ? "none" : "width 0.25s linear",
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
              <span>{track.duration > 0 ? formatTime(track.duration) : "--:--"}</span>
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

        {/* Playlist Section */}
        <div
          className="mt-8 w-full opacity-0 animate-fade-up"
          style={{ animationDelay: "0.5s" }}
        >
          {/* Add Songs + Toggle */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setShowPlaylist(!showPlaylist)}
              className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground/70 transition-colors duration-200"
            >
              Playlist · {tracks.length}
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-[11px] font-medium text-foreground/80 transition-all duration-200 hover:bg-secondary/80 active:scale-[0.97]"
            >
              <Plus size={13} />
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

          {/* Track List */}
          <div
            className={`overflow-hidden transition-all duration-300 ease-out ${
              showPlaylist ? "max-h-[300px] opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <div className="space-y-0.5 overflow-y-auto max-h-[280px] scrollbar-thin pr-1">
              {tracks.map((t, i) => (
                <button
                  key={`${t.title}-${i}`}
                  onClick={() => playTrack(i)}
                  className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-150 ${
                    i === currentTrack
                      ? "bg-secondary/80 text-foreground"
                      : "text-foreground/70 hover:bg-secondary/40 hover:text-foreground/90"
                  }`}
                >
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-secondary">
                    {i === currentTrack && isPlaying ? (
                      <Pause size={13} className="text-primary" />
                    ) : (
                      <Music size={13} className={i === currentTrack ? "text-primary" : "text-muted-foreground"} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-[13px] font-medium leading-tight ${
                      i === currentTrack ? "text-primary" : ""
                    }`}>
                      {t.title}
                    </p>
                    <p className="truncate text-[11px] text-muted-foreground mt-0.5">
                      {t.artist}
                    </p>
                  </div>
                  <span className="text-[10px] tabular-nums text-muted-foreground/60 mr-1">
                    {t.duration > 0 ? formatTime(t.duration) : "--:--"}
                  </span>
                  {t.url && (
                    <button
                      onClick={(e) => removeTrack(i, e)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 text-muted-foreground hover:text-foreground/70"
                      aria-label="Remove track"
                    >
                      <X size={14} />
                    </button>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MusicPlayer;
