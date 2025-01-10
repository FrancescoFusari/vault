import { List, Tag, Network, FileText, Square } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "next-themes";
import { Button } from "./ui/button";
import { Moon, Sun } from "lucide-react";

export const DesktopNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  
  const isActive = (path: string) => location.pathname === path;
  
  return (
    <div className="hidden md:flex fixed top-0 left-0 right-0 bg-background/80 backdrop-blur-lg border-b px-6 py-3 z-50">
      <div className="flex-1 flex items-center gap-6">
        <button
          onClick={() => navigate('/')}
          className={`flex items-center gap-2 ${isActive('/') ? 'text-primary' : 'text-muted-foreground'} hover:text-primary transition-colors`}
        >
          <List className="h-5 w-5" />
          <span>Home</span>
        </button>
        <button
          onClick={() => navigate('/notes')}
          className={`flex items-center gap-2 ${isActive('/notes') ? 'text-primary' : 'text-muted-foreground'} hover:text-primary transition-colors`}
        >
          <FileText className="h-5 w-5" />
          <span>Notes</span>
        </button>
        <button
          onClick={() => navigate('/tags')}
          className={`flex items-center gap-2 ${isActive('/tags') ? 'text-primary' : 'text-muted-foreground'} hover:text-primary transition-colors`}
        >
          <Tag className="h-5 w-5" />
          <span>Tags</span>
        </button>
        <button
          onClick={() => navigate('/network')}
          className={`flex items-center gap-2 ${isActive('/network') ? 'text-primary' : 'text-muted-foreground'} hover:text-primary transition-colors`}
        >
          <Network className="h-5 w-5" />
          <span>Network</span>
        </button>
        <button
          onClick={() => navigate('/network3d')}
          className={`flex items-center gap-2 ${isActive('/network3d') ? 'text-primary' : 'text-muted-foreground'} hover:text-primary transition-colors`}
        >
          <Square className="h-5 w-5" />
          <span>Network 3D</span>
        </button>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      >
        <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    </div>
  );
};