import { Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Toaster } from "./components/ui/toaster";
import { BottomNav } from "./components/BottomNav";
import { DesktopNav } from "./components/DesktopNav";
import NotesListPage from "./pages/NotesListPage";
import NotePage from "./pages/NotePage";
import TagsPage from "./pages/TagsPage";
import NetworkPage from "./pages/NetworkPage";
import Network3DPage from "./pages/Network3DPage";
import SettingsPage from "./pages/SettingsPage";
import Auth from "./pages/Auth";
import { useEffect, useState } from "react";
import { supabase } from "./integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Toaster as SonnerToaster } from "sonner";

function App() {
  const [session, setSession] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        navigate("/");
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (!session) {
    return <Auth />;
  }

  return (
    <ThemeProvider defaultTheme="system" enableSystem>
      <div className="min-h-screen bg-background">
        <DesktopNav />
        <main className="pb-24 md:ml-64 md:pb-4">
          <Routes>
            <Route path="/" element={<NotesListPage />} />
            <Route path="/note/:id" element={<NotePage />} />
            <Route path="/tags" element={<TagsPage />} />
            <Route path="/network" element={<NetworkPage />} />
            <Route path="/network3d" element={<Network3DPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
        <BottomNav />
      </div>
      <Toaster />
      <SonnerToaster position="top-center" />
    </ThemeProvider>
  );
}

export default App;