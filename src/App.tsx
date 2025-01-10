import { Routes, Route } from "react-router-dom";
import { Toaster } from "./components/ui/toaster";
import { BottomNav } from "./components/BottomNav";
import { DesktopNav } from "./components/DesktopNav";
import Index from "./pages/Index";
import NotesListPage from "./pages/NotesListPage";
import NotePage from "./pages/NotePage";
import TagsPage from "./pages/TagsPage";
import Network3DPage from "./pages/Network3DPage";
import SettingsPage from "./pages/SettingsPage";
import "./App.css";

function App() {
  return (
    <>
      <div className="min-h-screen bg-background">
        <DesktopNav />
        <main className="pb-24 md:ml-64 md:pb-4">
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/notes" element={<NotesListPage />} />
            <Route path="/note/:id" element={<NotePage />} />
            <Route path="/tags" element={<TagsPage />} />
            <Route path="/network3d" element={<Network3DPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
        <BottomNav />
      </div>
      <Toaster />
    </>
  );
}

export default App;