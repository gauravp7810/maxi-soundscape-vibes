import { useState } from "react";
import {
  Moon, Sun, Volume2, Repeat, Shuffle, Info, ChevronRight,
  Music2, Keyboard
} from "lucide-react";
import { usePlayer } from "@/context/PlayerContext";

const Toggle = ({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) => (
  <button
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full transition-colors duration-300 focus:outline-none ${
      checked ? "bg-primary" : "bg-white/15"
    }`}
  >
    <span
      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 mt-0.5 ${
        checked ? "translate-x-5.5" : "translate-x-0.5"
      }`}
      style={{ transform: checked ? "translateX(22px)" : "translateX(2px)" }}
    />
  </button>
);

const Row = ({
  icon: Icon,
  label,
  desc,
  right,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  desc?: string;
  right?: React.ReactNode;
  onClick?: () => void;
}) => (
  <div
    onClick={onClick}
    role={onClick ? "button" : undefined}
    tabIndex={onClick ? 0 : undefined}
    onKeyDown={onClick ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } } : undefined}
    className={`flex w-full items-center gap-4 rounded-2xl glass px-4 py-3.5 text-left transition-all duration-200 ${
      onClick ? "hover:bg-white/8 active:scale-[0.99] cursor-pointer" : "cursor-default"
    }`}
  >
    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-primary/15">
      <Icon size={17} className="text-primary" />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[14px] font-medium text-foreground">{label}</p>
      {desc && <p className="text-[12px] text-muted-foreground/55 mt-0.5">{desc}</p>}
    </div>
    {right}
  </div>
);

const Settings = () => {
  const {
    shuffle, setShuffle, repeat, setRepeat, volume, theme, setTheme,
  } = usePlayer();

  const [autoplay,   setAutoplay]   = useState(true);
  const [normalize,  setNormalize]  = useState(false);
  const [crossfade,  setCrossfade]  = useState(false);
  const [showKbHint, setShowKbHint] = useState(false);

  return (
    <div className="page-fade flex flex-col gap-6 px-4 pt-6 pb-2">
      {/* Header */}
      <div>
        <h1 className="text-[22px] font-bold tracking-tight text-foreground">Settings</h1>
        <p className="text-[13px] text-muted-foreground/60 mt-0.5">Customize your experience</p>
      </div>

      {/* Appearance */}
      <section className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/40 mb-3 px-1">
          Appearance
        </p>
        <Row
          icon={theme === "dark" ? Moon : Sun}
          label="Theme"
          desc={theme === "dark" ? "Dark mode" : "Light mode"}
          right={
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTheme("light")}
                className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200 ${
                  theme === "light" ? "bg-primary/20 text-primary" : "text-muted-foreground/40 hover:text-foreground/60"
                }`}
              >
                <Sun size={16} />
              </button>
              <button
                onClick={() => setTheme("dark")}
                className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200 ${
                  theme === "dark" ? "bg-primary/20 text-primary" : "text-muted-foreground/40 hover:text-foreground/60"
                }`}
              >
                <Moon size={16} />
              </button>
            </div>
          }
        />
      </section>

      {/* Playback */}
      <section className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/40 mb-3 px-1">
          Playback
        </p>
        <Row
          icon={Repeat}
          label="Repeat"
          desc="Loop current track"
          right={<Toggle checked={repeat} onChange={v => setRepeat(v)} />}
        />
        <Row
          icon={Shuffle}
          label="Shuffle"
          desc="Play in random order"
          right={<Toggle checked={shuffle} onChange={v => setShuffle(v)} />}
        />
        <Row
          icon={Music2}
          label="Autoplay"
          desc="Continue to next track"
          right={<Toggle checked={autoplay} onChange={setAutoplay} />}
        />
        <Row
          icon={Volume2}
          label="Normalize volume"
          desc="Match loudness across tracks"
          right={<Toggle checked={normalize} onChange={setNormalize} />}
        />
        <Row
          icon={Volume2}
          label="Crossfade"
          desc="Smooth transition between songs"
          right={<Toggle checked={crossfade} onChange={setCrossfade} />}
        />
      </section>

      {/* Audio quality (cosmetic) */}
      <section className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/40 mb-3 px-1">
          Audio
        </p>
        <div className="glass rounded-2xl px-4 py-4 space-y-3">
          <p className="text-[13px] font-medium text-foreground">Streaming Quality</p>
          {["Normal", "High", "Very High", "Lossless"].map(q => (
            <button
              key={q}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-[13px] transition-all duration-150 ${
                q === "High"
                  ? "bg-primary/15 text-primary font-medium"
                  : "text-foreground/60 hover:bg-white/5"
              }`}
            >
              <span>{q}</span>
              {q === "High" && (
                <span className="text-[10px] font-semibold bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                  Active
                </span>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Keyboard shortcuts */}
      <section className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/40 mb-3 px-1">
          Controls
        </p>
        <Row
          icon={Keyboard}
          label="Keyboard Shortcuts"
          desc="View hotkeys"
          onClick={() => setShowKbHint(h => !h)}
          right={<ChevronRight size={15} className={`text-muted-foreground/30 transition-transform duration-200 ${showKbHint ? "rotate-90" : ""}`} />}
        />
        {showKbHint && (
          <div className="glass rounded-2xl px-4 py-4 space-y-2.5 animate-scale-in">
            {[
              ["Space",   "Play / Pause"],
              ["← →",     "Previous / Next"],
              ["↑ ↓",     "Volume Up / Down"],
              ["M",       "Mute"],
              ["L",       "Like / Unlike"],
              ["S",       "Toggle Shuffle"],
              ["R",       "Toggle Repeat"],
            ].map(([key, action]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-[13px] text-foreground/70">{action}</span>
                <kbd className="rounded-lg bg-white/8 px-2.5 py-1 text-[11px] font-mono font-semibold text-foreground/60">
                  {key}
                </kbd>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* About */}
      <section className="space-y-2 pb-2">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/40 mb-3 px-1">
          About
        </p>
        <Row
          icon={Info}
          label="MAXI Player"
          desc="Version 2.0 · Ultra Premium"
        />
      </section>
    </div>
  );
};

export default Settings;
