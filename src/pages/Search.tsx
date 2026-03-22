import { useState, useMemo } from "react";
import { Search as SearchIcon, Play, Pause, X, Music2 } from "lucide-react";
import { usePlayer, fmt } from "@/context/PlayerContext";
import albumCover from "@/assets/album-cover.jpg";

const EqBars = () => (
  <div className="flex items-end gap-[2px] h-3">
    <span className="w-[3px] rounded-sm bg-primary animate-eq-1 inline-block" />
    <span className="w-[3px] rounded-sm bg-primary animate-eq-2 inline-block" />
    <span className="w-[3px] rounded-sm bg-primary animate-eq-3 inline-block" />
  </div>
);

const Search = () => {
  const { tracks, currentTrack, isPlaying, playTrack } = usePlayer();
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tracks;
    return tracks.filter(
      t =>
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q)
    );
  }, [query, tracks]);

  return (
    <div className="page-fade flex flex-col gap-5 px-4 pt-6 pb-2">
      {/* Header */}
      <div>
        <h1 className="text-[22px] font-bold tracking-tight text-foreground mb-4">Search</h1>

        {/* Search bar */}
        <div className="relative">
          <SearchIcon
            size={16}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50"
          />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Songs, artists…"
            className="w-full rounded-2xl glass border border-white/[0.08] bg-transparent py-3.5 pl-11 pr-10 text-[14px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all duration-200"
            autoComplete="off"
            spellCheck={false}
            data-testid="search-input"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-foreground/60 transition-colors active:scale-90"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/40 mb-3">
          {query ? `${results.length} result${results.length !== 1 ? "s" : ""}` : "All songs"}
        </p>

        {results.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <Music2 size={38} className="text-muted-foreground/20 mb-3" />
            <p className="text-[15px] font-semibold text-foreground/40">No results</p>
            <p className="text-[13px] text-muted-foreground/30 mt-1">Try a different search</p>
          </div>
        ) : (
          <div className="space-y-[2px]">
            {results.map(t => {
              const idx    = tracks.findIndex(tr => tr.id === t.id);
              const active = idx === currentTrack;
              return (
                <button
                  key={t.id}
                  onClick={() => playTrack(idx)}
                  className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-200 ${
                    active ? "track-active-bar" : "hover:bg-white/[0.04]"
                  }`}
                  data-testid={`search-result-${t.id}`}
                >
                  {/* Thumb */}
                  <div className="relative h-11 w-11 flex-shrink-0 overflow-hidden rounded-xl">
                    <img src={albumCover} alt="" className="h-full w-full object-cover opacity-70" />
                    <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-150 bg-black/40 ${
                      active ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    }`}>
                      {active && isPlaying
                        ? <EqBars />
                        : active
                          ? <Pause size={13} fill="white" className="text-white" />
                          : <Play  size={13} fill="white" className="text-white ml-0.5" />
                      }
                    </div>
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-[14px] font-medium ${active ? "text-primary" : "text-foreground/90"}`}>
                      {/* Highlight matching part */}
                      {query
                        ? <HighlightText text={t.title} query={query} />
                        : t.title
                      }
                    </p>
                    <p className="truncate text-[12px] text-muted-foreground/55 mt-0.5">
                      {query
                        ? <HighlightText text={t.artist} query={query} />
                        : t.artist
                      }
                    </p>
                  </div>

                  <span className="text-[12px] tabular-nums text-muted-foreground/45 flex-shrink-0">
                    {t.duration > 0 ? fmt(t.duration) : "--:--"}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

/* Highlight matching text */
const HighlightText = ({ text, query }: { text: string; query: string }) => {
  const q = query.toLowerCase();
  const idx = text.toLowerCase().indexOf(q);
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <span className="text-primary">{text.slice(idx, idx + query.length)}</span>
      {text.slice(idx + query.length)}
    </>
  );
};

export default Search;
