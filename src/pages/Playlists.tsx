import { useState } from "react";
import { Plus, ListMusic, Play, Pause, Trash2, X, ChevronRight, Music2 } from "lucide-react";
import { usePlayer, fmt } from "@/context/PlayerContext";
import albumCover from "@/assets/album-cover.jpg";

type View = "list" | "detail";

const Playlists = () => {
  const {
    tracks, currentTrack, isPlaying, playlists,
    createPlaylist, deletePlaylist, removeFromPlaylist, playTrack,
  } = usePlayer();

  const [view,            setView]           = useState<View>("list");
  const [activePlaylist,  setActivePlaylist]  = useState<string | null>(null);
  const [newName,         setNewName]         = useState("");
  const [creating,        setCreating]        = useState(false);
  const [confirmDelete,   setConfirmDelete]   = useState<string | null>(null);

  const pl = playlists.find(p => p.id === activePlaylist);

  const openPlaylist = (id: string) => {
    setActivePlaylist(id);
    setView("detail");
  };

  const goBack = () => {
    setView("list");
    setActivePlaylist(null);
  };

  const handleCreate = () => {
    if (!newName.trim()) return;
    createPlaylist(newName.trim());
    setNewName("");
    setCreating(false);
  };

  /* ── Playlist list view ─────────────────────── */
  if (view === "list") return (
    <div className="page-fade flex flex-col gap-5 px-4 pt-6 pb-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-foreground">Playlists</h1>
          <p className="text-[13px] text-muted-foreground/60 mt-0.5">{playlists.length} playlists</p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-1.5 rounded-full btn-gradient px-3.5 py-2 text-[12px] font-semibold text-white transition-all duration-200 active:scale-95"
        >
          <Plus size={14} />
          New
        </button>
      </div>

      {/* Create form */}
      {creating && (
        <div className="glass rounded-2xl p-4 animate-scale-in">
          <p className="text-[13px] font-semibold text-foreground mb-3">New Playlist</p>
          <input
            autoFocus
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") handleCreate(); if (e.key === "Escape") setCreating(false); }}
            placeholder="Playlist name…"
            className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50 transition-colors"
          />
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleCreate}
              className="flex-1 rounded-xl btn-gradient py-2.5 text-[13px] font-semibold text-white transition-all active:scale-95"
            >
              Create
            </button>
            <button
              onClick={() => { setCreating(false); setNewName(""); }}
              className="flex-1 rounded-xl glass border border-white/10 py-2.5 text-[13px] font-medium text-foreground/70 transition-all hover:bg-white/8 active:scale-95"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Playlist cards */}
      <div className="space-y-2">
        {playlists.map(p => {
          const count   = p.trackIds.length;
          const preview = p.trackIds.slice(0, 3)
            .map(id => tracks.find(t => t.id === id))
            .filter(Boolean);

          return (
            <div key={p.id} className="relative">
              {confirmDelete === p.id ? (
                <div className="glass rounded-2xl p-4 border border-red-500/20 animate-scale-in">
                  <p className="text-[13px] font-semibold text-foreground mb-1">Delete "{p.name}"?</p>
                  <p className="text-[12px] text-muted-foreground/50 mb-3">This action cannot be undone.</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { deletePlaylist(p.id); setConfirmDelete(null); }}
                      className="flex-1 rounded-xl bg-red-500/80 py-2 text-[13px] font-semibold text-white hover:bg-red-500 active:scale-95 transition-all"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setConfirmDelete(null)}
                      className="flex-1 rounded-xl glass py-2 text-[13px] text-foreground/70 hover:bg-white/8 active:scale-95 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => openPlaylist(p.id)}
                  className="group flex w-full items-center gap-4 rounded-2xl glass px-4 py-3.5 text-left transition-all duration-200 hover:bg-white/8 active:scale-[0.99] cursor-pointer"
                >
                  {/* Mini art grid */}
                  <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-white/5 grid grid-cols-2 gap-[1px]">
                    {preview.length > 0
                      ? preview.slice(0, 4).map((_, i) => (
                          <img key={i} src={albumCover} alt="" className="h-full w-full object-cover" />
                        ))
                      : <div className="col-span-2 row-span-2 flex items-center justify-center"><ListMusic size={22} className="text-muted-foreground/30" /></div>
                    }
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-semibold text-foreground truncate">{p.name}</p>
                    <p className="text-[12px] text-muted-foreground/55 mt-0.5">
                      {count} {count === 1 ? "song" : "songs"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={e => { e.stopPropagation(); setConfirmDelete(p.id); }}
                      className="p-1.5 opacity-0 group-hover:opacity-100 text-muted-foreground/40 hover:text-red-400 transition-all duration-150 active:scale-90"
                    >
                      <Trash2 size={14} />
                    </button>
                    <ChevronRight size={16} className="text-muted-foreground/30" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {playlists.length === 0 && !creating && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ListMusic size={40} className="text-muted-foreground/20 mb-3" />
          <p className="text-[15px] font-semibold text-foreground/50">No playlists yet</p>
          <p className="text-[13px] text-muted-foreground/40 mt-1">Tap "New" to create one</p>
        </div>
      )}
    </div>
  );

  /* ── Playlist detail view ────────────────────── */
  return (
    <div className="page-fade flex flex-col gap-0 pt-6 pb-2">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 mb-5">
        <button
          onClick={goBack}
          className="p-2 rounded-full glass hover:bg-white/8 transition-colors active:scale-90"
        >
          <X size={16} className="text-foreground/70" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="text-[18px] font-bold text-foreground truncate">{pl?.name}</h1>
          <p className="text-[12px] text-muted-foreground/55">{pl?.trackIds.length || 0} songs</p>
        </div>
      </div>

      {/* Songs */}
      <div className="space-y-[2px] px-3">
        {(pl?.trackIds || []).map(tid => {
          const t   = tracks.find(tr => tr.id === tid);
          if (!t) return null;
          const idx    = tracks.findIndex(tr => tr.id === tid);
          const active = idx === currentTrack;
          return (
            <div key={tid} className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 hover:bg-white/[0.04]">
              <button
                onClick={() => playTrack(idx)}
                className="flex items-center gap-3 flex-1 min-w-0 text-left"
              >
                <div className="relative h-11 w-11 flex-shrink-0 overflow-hidden rounded-xl">
                  <img src={albumCover} alt="" className="h-full w-full object-cover opacity-70" />
                  <div className={`absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity ${active ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                    {active && isPlaying
                      ? <Pause size={13} fill="white" className="text-white" />
                      : <Play  size={13} fill="white" className="text-white ml-0.5" />
                    }
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-[14px] font-medium ${active ? "text-primary" : "text-foreground/90"}`}>{t.title}</p>
                  <p className="truncate text-[12px] text-muted-foreground/55 mt-0.5">{t.artist}</p>
                </div>
                <span className="text-[12px] tabular-nums text-muted-foreground/45 flex-shrink-0">
                  {t.duration > 0 ? fmt(t.duration) : "--:--"}
                </span>
              </button>
              <button
                onClick={() => removeFromPlaylist(pl!.id, tid)}
                className="p-1.5 opacity-0 group-hover:opacity-100 text-muted-foreground/40 hover:text-red-400 transition-all active:scale-90"
              >
                <X size={13} />
              </button>
            </div>
          );
        })}

        {pl?.trackIds.length === 0 && (
          <div className="flex flex-col items-center py-16 text-center">
            <Music2 size={36} className="text-muted-foreground/20 mb-3" />
            <p className="text-[14px] font-semibold text-foreground/40">Playlist is empty</p>
            <p className="text-[12px] text-muted-foreground/30 mt-1">Add songs from the Songs page</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Playlists;
