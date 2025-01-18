import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Toaster } from "./components/ui/toaster";
import { NavBar } from "./components/ui/tubelight-navbar";
import { useIsMobile } from "@/hooks/use-mobile";
import { Home, StickyNote, Tags, Network, Settings, Timer } from "lucide-react";
import { cn } from "@/lib/utils";
import Auth from "./pages/Auth";
import Index from "./pages/Index";
import NotesListPage from "./pages/NotesListPage";
import NotePage from "./pages/NotePage";
import TagsPage from "./pages/TagsPage";
import Network3DPage from "./pages/Network3DPage";
import SettingsPage from "./pages/SettingsPage";
import GmailCallback from "./pages/GmailCallback";
import QueuePage from "./pages/QueuePage";
import EmailDetailsPage from "./pages/EmailDetailsPage";
import { supabase } from "./integrations/supabase/client";
import "./App.css";

const navItems = [
  { name: "Home", url: "/", icon: Home },
  { name: "Notes", url: "/notes", icon: StickyNote },
  { name: "Tags", url: "/tags", icon: Tags },
  { name: "Network", url: "/network3d", icon: Network },
  { name: "Queue", url: "/queue", icon: Timer },
  { name: "Settings", url: "/settings", icon: Settings },
];

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    // Check initial auth state
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Show nothing while checking auth state
  if (isAuthenticated === null) {
    return null;
  }

  return (
    <>
      <div className="min-h-screen bg-background w-full">
        {isAuthenticated && (
          <div className={cn(
            "fixed z-50 w-full",
            isMobile ? "bottom-0 left-0" : "top-0 left-0"
          )}>
            <NavBar items={navItems} />
          </div>
        )}
        <main className={cn(
          isAuthenticated && (isMobile ? "pb-20" : "pt-16 pb-4"),
          "px-2 md:px-8"
        )}>
          <Routes>
            <Route
              path="/auth"
              element={isAuthenticated ? <Navigate to="/" /> : <Auth />}
            />
            <Route
              path="/"
              element={isAuthenticated ? <Index /> : <Navigate to="/auth" />}
            />
            <Route
              path="/notes"
              element={isAuthenticated ? <NotesListPage /> : <Navigate to="/auth" />}
            />
            <Route
              path="/note/:id"
              element={isAuthenticated ? <NotePage /> : <Navigate to="/auth" />}
            />
            <Route
              path="/tags"
              element={isAuthenticated ? <TagsPage /> : <Navigate to="/auth" />}
            />
            <Route
              path="/network3d"
              element={isAuthenticated ? <Network3DPage /> : <Navigate to="/auth" />}
            />
            <Route
              path="/settings"
              element={isAuthenticated ? <SettingsPage /> : <Navigate to="/auth" />}
            />
            <Route
              path="/gmail-callback"
              element={isAuthenticated ? <GmailCallback /> : <Navigate to="/auth" />}
            />
            <Route
              path="/queue"
              element={isAuthenticated ? <QueuePage /> : <Navigate to="/auth" />}
            />
            <Route
              path="/email/:id"
              element={isAuthenticated ? <EmailDetailsPage /> : <Navigate to="/auth" />}
            />
          </Routes>
        </main>
      </div>
      <Toaster />
    </>
  );
}

export default App;