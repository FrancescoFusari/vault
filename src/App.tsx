import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Toaster } from "./components/ui/toaster";
import { DesktopNav } from "./components/DesktopNav";
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

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

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
        {isAuthenticated && <DesktopNav />}
        <main className={`${isAuthenticated ? "pt-16 pb-4" : ""} px-2 md:px-8`}>
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