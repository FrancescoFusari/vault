import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import TagsPage from "./pages/TagsPage";
import NetworkPage from "./pages/NetworkPage";
import Auth from "./pages/Auth";
import NotePage from "./pages/NotePage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/tags" element={<TagsPage />} />
        <Route path="/network" element={<NetworkPage />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/note/:id" element={<NotePage />} />
      </Routes>
    </Router>
  );
}

export default App;