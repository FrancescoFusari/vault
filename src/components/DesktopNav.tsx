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
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 hidden md:block">
      <nav className="flex h-14 items-center justify-between px-6 border border-border/10 rounded-2xl bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
        <div className="flex items-center">
          <span className="text-lg font-semibold text-secondary mr-8">SecondBrain</span>
          <div className="flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex items-center rounded-lg px-4 py-2 text-sm font-medium transition-colors hover:bg-muted hover:text-secondary",
                    isActive 
                      ? "bg-muted text-primary" 
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