import { useLocation, BrowserRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect, useRef } from "react";

import { PlayerProvider } from "@/context/PlayerContext";
import { BottomNav } from "@/components/BottomNav";
import { MiniPlayer } from "@/components/MiniPlayer";

import Home      from "@/pages/Home";
import Songs     from "@/pages/Songs";
import Playlists from "@/pages/Playlists";
import Search    from "@/pages/Search";
import Settings  from "@/pages/Settings";
import NotFound  from "@/pages/NotFound";

const queryClient = new QueryClient();

/* Page container with animated transition */
const PageWrapper = ({ children }: { children: React.ReactNode }) => {
  const { pathname } = useLocation();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTo({ top: 0 });
    }
  }, [pathname]);

  return (
    <div
      ref={ref}
      key={pathname}
      className="page-fade h-full overflow-y-auto"
    >
      {children}
    </div>
  );
};

const AppShell = () => (
  <>
    {/* Ambient background orbs */}
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
      <div
        className="absolute -top-32 -left-32 h-[520px] w-[520px] rounded-full opacity-[0.18] blur-[110px] animate-orb-1"
        style={{ background: "radial-gradient(circle, #FF3B3F, transparent 70%)" }}
      />
      <div
        className="absolute -bottom-40 -right-20 h-[440px] w-[440px] rounded-full opacity-[0.12] blur-[100px] animate-orb-2"
        style={{ background: "radial-gradient(circle, #FF9500, transparent 70%)" }}
      />
    </div>

    {/* Main scrollable area — leaves room for mini player + bottom nav */}
    <main
      className="player-bg relative min-h-[100dvh]"
      style={{ paddingBottom: "calc(128px + env(safe-area-inset-bottom))" }}
    >
      <PageWrapper>
        <Routes>
          <Route path="/"          element={<Home />}      />
          <Route path="/songs"     element={<Songs />}     />
          <Route path="/playlists" element={<Playlists />} />
          <Route path="/search"    element={<Search />}    />
          <Route path="/settings"  element={<Settings />}  />
          <Route path="*"          element={<NotFound />}  />
        </Routes>
      </PageWrapper>
    </main>

    {/* Persistent layers */}
    <MiniPlayer visible />
    <BottomNav />
  </>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <PlayerProvider>
          <AppShell />
        </PlayerProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
