import { List, Tag, FileText, Square, Settings } from "lucide-react";
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
    <div className="hidden md:flex fixed top-4 left-8 right-8 bg-background/60 backdrop-blur-xl border border-border/20 rounded-2xl px-6 py-3 z-50 shadow-lg">
      <div className="flex-1 flex items-center gap-6">
        <button
          onClick={() => navigate('/')}
          className={`flex items-center gap-2 ${isActive('/') ? 'text-primary' : 'text-muted-foreground'} hover:text-primary transition-colors rounded-lg px-3 py-2 hover:bg-secondary/50`}
        >
          <List className="h-5 w-5" />
          <span>Home</span>
        </button>
        <button
          onClick={() => navigate('/notes')}
          className={`flex items-center gap-2 ${isActive('/notes') ? 'text-primary' : 'text-muted-foreground'} hover:text-primary transition-colors rounded-lg px-3 py-2 hover:bg-secondary/50`}
        >
          <FileText className="h-5 w-5" />
          <span>Vault</span>
        </button>
        <button
          onClick={() => navigate('/tags')}
          className={`flex items-center gap-2 ${isActive('/tags') ? 'text-primary' : 'text-muted-foreground'} hover:text-primary transition-colors rounded-lg px-3 py-2 hover:bg-secondary/50`}
        >
          <Tag className="h-5 w-5" />
          <span>Tags</span>
        </button>
        <button
          onClick={() => navigate('/network3d')}
          className={`flex items-center gap-2 ${isActive('/network3d') ? 'text-primary' : 'text-muted-foreground'} hover:text-primary transition-colors rounded-lg px-3 py-2 hover:bg-secondary/50`}
        >
          <Square className="h-5 w-5" />
          <span>Network 3D</span>
        </button>
        <button
          onClick={() => navigate('/settings')}
          className={`flex items-center gap-2 ${isActive('/settings') ? 'text-primary' : 'text-muted-foreground'} hover:text-primary transition-colors rounded-lg px-3 py-2 hover:bg-secondary/50`}
        >
          <Settings className="h-5 w-5" />
          <span>Settings</span>
        </button>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(theme === "light" ? "dark" : "light")}
        className="rounded-xl"
      >
        <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    </div>
  );
};