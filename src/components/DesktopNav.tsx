import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Home,
  StickyNote,
  Tags,
  Network,
  Settings,
  Timer,
} from "lucide-react";

const navItems = [
  { icon: Home, label: "Home", href: "/" },
  { icon: StickyNote, label: "Notes", href: "/notes" },
  { icon: Tags, label: "Tags", href: "/tags" },
  { icon: Network, label: "Network", href: "/network3d" },
  { icon: Timer, label: "Queue", href: "/queue" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

export function DesktopNav() {
  const location = useLocation();

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="flex h-16 items-center justify-between px-8 border-b border-border/10">
        <div className="flex items-center">
          <span className="text-lg font-semibold mr-8">Lovable</span>
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex items-center rounded-lg px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                    isActive 
                      ? "bg-accent/50 text-accent-foreground" 
                      : "text-muted-foreground"
                  )}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}