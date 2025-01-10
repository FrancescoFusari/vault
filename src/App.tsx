import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import Index from "./pages/Index";
import TagsPage from "./pages/TagsPage";
import NetworkPage from "./pages/NetworkPage";
import Auth from "./pages/Auth";
import NotePage from "./pages/NotePage";
import NotesListPage from "./pages/NotesListPage";
import { DesktopNav } from "./components/DesktopNav";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <Router>
          <DesktopNav />
          <div className="pt-16"> {/* Add padding to account for fixed navbar */}
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/tags" element={<TagsPage />} />
              <Route path="/network" element={<NetworkPage />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/note/:id" element={<NotePage />} />
              <Route path="/notes" element={<NotesListPage />} />
            </Routes>
          </div>
        </Router>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;