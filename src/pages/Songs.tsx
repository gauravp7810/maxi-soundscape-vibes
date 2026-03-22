import { useRef, useState } from "react";
import { Play, Pause, Music2, Plus, X, MoreHorizontal, ListPlus } from "lucide-react";
import { usePlayer, fmt } from "@/context/PlayerContext";
import albumCover from "@/assets/album-cover.jpg";

/* Equalizer */
const EqBars = () => (
  <div className="flex items-end gap-[2px] h-3">
    <span className="w-[3px] rounded-sm bg-primary animate-eq-1 inline-block" />
    <span className="w-[3px] rounded-sm bg-primary animate-eq-2 inline-block" />
    <span className="w-[3px] rounded-sm bg-primary animate-eq-3 inline-block" />
  </div>
);

const Songs = () => {
  const {
    tracks, currentTrack, isPlaying, playlists,
    playTrack, removeTrack, addFiles, addToPlaylist,
  } = usePlayer();

  const fileInputRef  = useRef<HTMLInputElement>(null);
  const [menuOpen, setMenuOpen] = useState<number | null>(null);

  return (
    <div className="page-fade flex flex-col gap-0 pt-6 pb-2">
      {/* Header */}
      <div className="flex items-center justify-between px-4 mb-5">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-foreground">Songs</h1>
          <p className="text-[13px] text-muted-foreground/60 mt-0.5">{tracks.length} tracks</p>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 rounded-full btn-gradient px-3.5 py-2 text-[12px] font-semibold text-white transition-all duration-200 active:scale-95"
        >
          <Plus size={14} />
          Add
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          multiple
          onChange={e => { if (e.target.files) addFiles(e.target.files); e.target.value = ""; }}
          className="hidden"
        />
      </div>

      {/* Track list */}
      <div
        className="space-y-[2px] px-3"
        onClick={() => setMenuOpen(null)}
      >
        {tracks.map((t, i) => {
          const active = i === currentTrack;
          const open   = menuOpen === i;
          return (
            <div key={t.id} className="relative">
              <div
                role="row"
                className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-200 cursor-pointer ${
                  active ? "track-active-bar" : "hover:bg-white/[0.04]"
                }`}
                onClick={() => playTrack(i)}
                data-testid={`song-item-${i}`}
              >
                {/* Thumbnail */}
                <div className="relative h-11 w-11 flex-shrink-0 overflow-hidden rounded-xl">
                  <img src={albumCover} alt="" className="h-full w-full object-cover opacity-70" />
                  <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-150 ${
                    active ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  } bg-black/40`}>
                    {active && isPlaying ? <EqBars /> : (
                      active
                        ? <Pause size={13} fill="white" className="text-white" />
                        : <Play  size={13} fill="white" className="text-white ml-0.5" />
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-[14px] font-medium leading-tight ${active ? "text-primary" : "text-foreground/90"}`}>
                    {t.title}
                  </p>
                  <p className="truncate text-[12px] text-muted-foreground/55 mt-0.5">{t.artist}</p>
                </div>

                {/* Duration */}
                <span className="text-[12px] tabular-nums text-muted-foreground/45 flex-shrink-0">
                  {t.duration > 0 ? fmt(t.duration) : "--:--"}
                </span>

                {/* More button */}
                <button
                  onClick={e => { e.stopPropagation(); setMenuOpen(open ? null : i); }}
                  className="p-1.5 text-muted-foreground/30 hover:text-foreground/60 opacity-0 group-hover:opacity-100 transition-all duration-150 active:scale-90 flex-shrink-0"
                  aria-label="More options"
                >
                  <MoreHorizontal size={15} />
                </button>
              </div>

              {/* Context menu */}
              {open && (
                <div
                  className="absolute right-3 top-full z-50 mt-1 min-w-[180px] rounded-xl glass-strong shadow-xl overflow-hidden animate-scale-in"
                  onClick={e => e.stopPropagation()}
                >
                  {playlists.length > 0 && (
                    <div className="border-b border-white/[0.06] pb-1 mb-1">
                      <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40">
                        Add to playlist
                      </p>
                      {playlists.map(pl => (
                        <button
                          key={pl.id}
                          onClick={() => { addToPlaylist(pl.id, t.id); setMenuOpen(null); }}
                          className="flex w-full items-center gap-2.5 px-3 py-2 text-[13px] text-foreground/80 hover:bg-white/[0.06] transition-colors"
                        >
                          <ListPlus size={13} className="text-primary/70" />
                          {pl.name}
                        </button>
                      ))}
                    </div>
                  )}
                  {t.url && (
                    <button
                      onClick={() => { removeTrack(i); setMenuOpen(null); }}
                      className="flex w-full items-center gap-2.5 px-3 py-2.5 text-[13px] text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <X size={13} />
                      Remove
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {tracks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center px-6">
          <Music2 size={40} className="text-muted-foreground/20 mb-3" />
          <p className="text-[15px] font-semibold text-foreground/50">No tracks yet</p>
          <p className="text-[13px] text-muted-foreground/40 mt-1">Tap "Add" to import your music</p>
        </div>
      )}
    </div>
  );
};

export default Songs;
