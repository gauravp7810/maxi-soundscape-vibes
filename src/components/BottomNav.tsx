import { memo } from "react";
import { Link, useLocation } from "react-router-dom";
import { Chrome as Home, Music2, ListMusic, Search, Settings } from "lucide-react";

const tabs = [
  { to: "/",          label: "Home",     Icon: Home      },
  { to: "/songs",     label: "Songs",    Icon: Music2    },
  { to: "/playlists", label: "Playlists",Icon: ListMusic },
  { to: "/search",    label: "Search",   Icon: Search    },
  { to: "/settings",  label: "Settings", Icon: Settings  },
];

export const BottomNav = memo(function BottomNav() {
  const { pathname } = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 safe-area-bottom"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {/* blur bg */}
      <div className="glass-strong border-t border-white/[0.06] shadow-[0_-4px_32px_rgba(0,0,0,0.45)]">
        <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-2">
          {tabs.map(({ to, label, Icon }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`flex flex-col items-center gap-[3px] px-3 py-1.5 rounded-xl transition-all duration-200 active:scale-90 ${
                  active ? "text-primary" : "text-muted-foreground/50 hover:text-foreground/60"
                }`}
                data-testid={`nav-${label.toLowerCase()}`}
              >
                <div className="relative">
                  <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
                  {active && (
                    <span className="absolute -bottom-1.5 left-1/2 h-[3px] w-[3px] -translate-x-1/2 rounded-full bg-primary" />
                  )}
                </div>
                <span
                  className={`text-[10px] font-medium transition-all duration-200 ${
                    active ? "text-primary" : "text-muted-foreground/40"
                  }`}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
});
