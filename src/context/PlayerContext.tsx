import {
  createContext, useContext, useState, useEffect,
  useCallback, useRef, ReactNode,
} from "react";

/* ─── Types ──────────────────────────────────────── */
export interface Track {
  id: string;
  title: string;
  artist: string;
  duration: number;
  file?: File;
  url?: string;
}

export interface Playlist {
  id: string;
  name: string;
  trackIds: string[];
}

export const fmt = (s: number) => {
  if (!isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

const cleanFileName = (n: string) =>
  n.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");

/* ─── Default tracks ─────────────────────────────── */
export const defaultTracks: Track[] = [
  { id: "d0", title: "Midnight Drive",  artist: "Lena Voss",    duration: 237 },
  { id: "d1", title: "Golden Hour",     artist: "Theo Marcell", duration: 204 },
  { id: "d2", title: "Still Waters",    artist: "Aya Nakamura", duration: 189 },
  { id: "d3", title: "Neon Rain",       artist: "Cassie Drake", duration: 221 },
  { id: "d4", title: "Lost Signal",     artist: "Mika Sato",    duration: 195 },
  { id: "d5", title: "Glass Canvas",    artist: "Elara Moon",   duration: 213 },
];

/* ─── Context shape ──────────────────────────────── */
interface PlayerCtx {
  tracks: Track[];
  currentTrack: number;
  isPlaying: boolean;
  progress: number;
  liked: boolean;
  shuffle: boolean;
  repeat: boolean;
  volume: number;
  muted: boolean;
  transitioning: boolean;
  trackKey: number;
  recentlyPlayed: string[];     // track IDs
  playlists: Playlist[];
  theme: "dark" | "light";

  setIsPlaying: (v: boolean | ((p: boolean) => boolean)) => void;
  setLiked:     (v: boolean | ((p: boolean) => boolean)) => void;
  setShuffle:   (v: boolean | ((p: boolean) => boolean)) => void;
  setRepeat:    (v: boolean | ((p: boolean) => boolean)) => void;
  setVolume:    (v: number  | ((p: number)  => number))  => void;
  setMuted:     (v: boolean | ((p: boolean) => boolean)) => void;
  setProgress:  (v: number) => void;
  setTheme:     (t: "dark" | "light") => void;

  skip:         (dir: 1 | -1) => void;
  playTrack:    (idx: number) => void;
  removeTrack:  (idx: number) => void;
  addFiles:     (files: FileList) => void;

  createPlaylist: (name: string) => void;
  deletePlaylist: (id: string) => void;
  addToPlaylist:  (playlistId: string, trackId: string) => void;
  removeFromPlaylist: (playlistId: string, trackId: string) => void;

  seekTo:       (ratio: number) => void;
  audioRef:     React.MutableRefObject<HTMLAudioElement | null>;
  progressBarRef: React.MutableRefObject<HTMLDivElement | null>;
}

const PlayerContext = createContext<PlayerCtx | null>(null);

export const usePlayer = () => {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be inside PlayerProvider");
  return ctx;
};

/* ─── Provider ───────────────────────────────────── */
export const PlayerProvider = ({ children }: { children: ReactNode }) => {
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
  const [trackKey,      setTrackKey]      = useState(0);
  const [recentlyPlayed, setRecentlyPlayed] = useState<string[]>(["d0"]);
  const [playlists,     setPlaylists]     = useState<Playlist[]>([
    { id: "pl0", name: "Favourites", trackIds: ["d0", "d2"] },
    { id: "pl1", name: "Chill Vibes", trackIds: ["d1", "d3", "d5"] },
  ]);
  const [theme, setThemeState] = useState<"dark" | "light">("dark");

  const audioRef       = useRef<HTMLAudioElement | null>(null);
  const simTimerRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);

  const track       = tracks[currentTrack];
  const isRealAudio = !!track?.url;
  const effectiveVol = muted ? 0 : volume;

  /* ── Theme management ──────────────────────────── */
  const setTheme = useCallback((t: "dark" | "light") => {
    setThemeState(t);
    document.documentElement.classList.toggle("light", t === "light");
    localStorage.setItem("maxi-theme", t);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("maxi-theme") as "dark" | "light" | null;
    if (saved) {
      setThemeState(saved);
      document.documentElement.classList.toggle("light", saved === "light");
    }
  }, []);

  /* ── Audio engine ──────────────────────────────── */
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

    const onMeta  = () => setTracks(prev => prev.map((t, i) =>
      i === currentTrack ? { ...t, duration: audio.duration } : t
    ));
    const onTime  = () => setProgress(audio.currentTime);
    const onEnded = () => {
      if (repeat) { audio.currentTime = 0; audio.play().catch(() => {}); }
      else skip(1);
    };

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

  /* ── Simulated progress ────────────────────────── */
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

  /* ── Play/pause sync ───────────────────────────── */
  useEffect(() => {
    if (!audioRef.current || !isRealAudio) return;
    isPlaying ? audioRef.current.play().catch(() => {}) : audioRef.current.pause();
  }, [isPlaying, isRealAudio]);

  /* ── Volume sync ───────────────────────────────── */
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = effectiveVol / 100;
  }, [effectiveVol]);

  /* ── Keyboard controls ─────────────────────────── */
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      switch (e.code) {
        case "Space":      e.preventDefault(); setIsPlaying(p => !p); break;
        case "ArrowRight": e.preventDefault(); skip(1);               break;
        case "ArrowLeft":  e.preventDefault(); skip(-1);              break;
        case "ArrowUp":    e.preventDefault(); setVolume(v => Math.min(100, v + 5)); break;
        case "ArrowDown":  e.preventDefault(); setVolume(v => Math.max(0,   v - 5)); break;
        case "KeyM":       setMuted(m => !m);                         break;
        case "KeyL":       setLiked(l => !l);                         break;
        case "KeyS":       setShuffle(s => !s);                       break;
        case "KeyR":       setRepeat(r => !r);                        break;
      }
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Skip ──────────────────────────────────────── */
  const skip = useCallback((dir: 1 | -1) => {
    setTransitioning(true);
    setTimeout(() => {
      setCurrentTrack(c => {
        let next = c;
        if (shuffle) {
          while (next === c && tracks.length > 1)
            next = Math.floor(Math.random() * tracks.length);
        } else {
          next = (c + dir + tracks.length) % tracks.length;
        }
        setRecentlyPlayed(rp => {
          const id = tracks[next]?.id;
          if (!id) return rp;
          return [id, ...rp.filter(x => x !== id)].slice(0, 10);
        });
        return next;
      });
      setProgress(0);
      setIsPlaying(true);
      setTrackKey(k => k + 1);
      setTimeout(() => setTransitioning(false), 60);
    }, 200);
  }, [tracks, shuffle]);

  /* ── Play specific track ───────────────────────── */
  const playTrack = useCallback((idx: number) => {
    if (idx === currentTrack) { setIsPlaying(p => !p); return; }
    setTransitioning(true);
    setTimeout(() => {
      setCurrentTrack(idx);
      setProgress(0);
      setIsPlaying(true);
      setTrackKey(k => k + 1);
      setRecentlyPlayed(rp => {
        const id = tracks[idx]?.id;
        if (!id) return rp;
        return [id, ...rp.filter(x => x !== id)].slice(0, 10);
      });
      setTimeout(() => setTransitioning(false), 60);
    }, 200);
  }, [currentTrack, tracks]);

  /* ── Remove track ──────────────────────────────── */
  const removeTrack = useCallback((idx: number) => {
    const trackId = tracks[idx]?.id;
    if (tracks[idx]?.url) URL.revokeObjectURL(tracks[idx].url!);
    setTracks(prev => prev.filter((_, i) => i !== idx));
    if (idx === currentTrack) { setCurrentTrack(0); setProgress(0); setIsPlaying(false); }
    else if (idx < currentTrack) setCurrentTrack(c => c - 1);
    if (trackId) {
      setPlaylists(prev => prev.map(pl => ({
        ...pl, trackIds: pl.trackIds.filter(id => id !== trackId),
      })));
    }
  }, [currentTrack, tracks]);

  /* ── Add uploaded files ────────────────────────── */
  const addFiles = useCallback((files: FileList) => {
    const newTracks: Track[] = Array.from(files).map(f => ({
      id: `upload-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      title: cleanFileName(f.name),
      artist: "Local File",
      duration: 0,
      file: f,
      url: URL.createObjectURL(f),
    }));
    setTracks(prev => [...prev, ...newTracks]);
  }, []);

  /* ── Seek ──────────────────────────────────────── */
  const seekTo = useCallback((ratio: number) => {
    const t = ratio * track.duration;
    setProgress(t);
    if (audioRef.current && isRealAudio) audioRef.current.currentTime = t;
  }, [track.duration, isRealAudio]);

  /* ── Playlist management ───────────────────────── */
  const createPlaylist = useCallback((name: string) => {
    setPlaylists(prev => [...prev, {
      id: `pl-${Date.now()}`,
      name: name.trim() || "New Playlist",
      trackIds: [],
    }]);
  }, []);

  const deletePlaylist = useCallback((id: string) => {
    setPlaylists(prev => prev.filter(pl => pl.id !== id));
  }, []);

  const addToPlaylist = useCallback((playlistId: string, trackId: string) => {
    setPlaylists(prev => prev.map(pl =>
      pl.id === playlistId && !pl.trackIds.includes(trackId)
        ? { ...pl, trackIds: [...pl.trackIds, trackId] }
        : pl
    ));
  }, []);

  const removeFromPlaylist = useCallback((playlistId: string, trackId: string) => {
    setPlaylists(prev => prev.map(pl =>
      pl.id === playlistId
        ? { ...pl, trackIds: pl.trackIds.filter(id => id !== trackId) }
        : pl
    ));
  }, []);

  /* ── Cleanup ───────────────────────────────────── */
  useEffect(() => () => {
    if (simTimerRef.current) clearInterval(simTimerRef.current);
  }, []);

  return (
    <PlayerContext.Provider value={{
      tracks, currentTrack, isPlaying, progress, liked, shuffle, repeat,
      volume, muted, transitioning, trackKey, recentlyPlayed, playlists, theme,
      setIsPlaying, setLiked, setShuffle, setRepeat, setVolume, setMuted,
      setProgress, setTheme, skip, playTrack, removeTrack, addFiles,
      createPlaylist, deletePlaylist, addToPlaylist, removeFromPlaylist,
      seekTo, audioRef, progressBarRef,
    }}>
      {children}
    </PlayerContext.Provider>
  );
};
