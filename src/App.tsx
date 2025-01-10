import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { DesktopNav } from "@/components/DesktopNav";
import Index from "@/pages/Index";
import NotesListPage from "@/pages/NotesListPage";
import NotePage from "@/pages/NotePage";
import TagsPage from "@/pages/TagsPage";
import NetworkPage from "@/pages/NetworkPage";
import Network3DPage from "@/pages/Network3DPage";

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <DesktopNav />
      <div className="container mx-auto px-4 pt-20 pb-16">
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/notes" element={<NotesListPage />} />
          <Route path="/note/:id" element={<NotePage />} />
          <Route path="/tags" element={<TagsPage />} />
          <Route path="/network" element={<NetworkPage />} />
          <Route path="/network3d" element={<Network3DPage />} />
        </Routes>
      </div>
      <Toaster />
    </div>
  );
}

export default App;
