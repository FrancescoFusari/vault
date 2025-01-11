import { List, Tag, FileText, Settings, Square } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

export const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;
  
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-background/80 backdrop-blur-lg rounded-full border shadow-lg px-6 py-3 flex items-center gap-6 md:hidden">
      <button
        onClick={() => navigate('/')}
        className={`flex flex-col items-center ${isActive('/') ? 'text-primary' : 'text-muted-foreground'}`}
      >
        <List className="h-5 w-5" />
        <span className="text-xs mt-1">Home</span>
      </button>
      <button
        onClick={() => navigate('/notes')}
        className={`flex flex-col items-center ${isActive('/notes') ? 'text-primary' : 'text-muted-foreground'}`}
      >
        <FileText className="h-5 w-5" />
        <span className="text-xs mt-1">Vault</span>
      </button>
      <button
        onClick={() => navigate('/tags')}
        className={`flex flex-col items-center ${isActive('/tags') ? 'text-primary' : 'text-muted-foreground'}`}
      >
        <Tag className="h-5 w-5" />
        <span className="text-xs mt-1">Tags</span>
      </button>
      <button
        onClick={() => navigate('/network3d')}
        className={`flex flex-col items-center ${isActive('/network3d') ? 'text-primary' : 'text-muted-foreground'}`}
      >
        <Square className="h-5 w-5" />
        <span className="text-xs mt-1">3D</span>
      </button>
      <button
        onClick={() => navigate('/settings')}
        className={`flex flex-col items-center ${isActive('/settings') ? 'text-primary' : 'text-muted-foreground'}`}
      >
        <Settings className="h-5 w-5" />
        <span className="text-xs mt-1">Settings</span>
      </button>
    </div>
  );
};