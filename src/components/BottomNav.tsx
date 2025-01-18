import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
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

export function BottomNav() {
  const location = useLocation();
  const isMobile = useIsMobile();

  if (!isMobile) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-muted bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="flex h-16 items-center px-4">
        <div className="flex w-full justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex flex-col items-center justify-center rounded-lg p-2 transition-colors",
                  isActive 
                    ? "text-primary" 
                    : "text-muted-foreground hover:text-secondary"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="mt-1 text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}