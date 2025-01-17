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
      <nav className="flex h-16 items-center">
        <div className="hidden md:block w-full">
          <div className="fixed top-16 bottom-0 left-0 w-64 overflow-y-auto border-r border-border/10 py-6 px-4">
            <div className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      "group flex items-center rounded-lg px-4 py-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                      isActive 
                        ? "bg-accent/50 text-accent-foreground" 
                        : "text-muted-foreground"
                    )}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
}