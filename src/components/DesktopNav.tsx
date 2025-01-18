import { Home, StickyNote, Tags, Network, Settings, Timer } from "lucide-react";
import { NavBar } from "@/components/ui/tubelight-navbar";

const navItems = [
  { name: "Home", url: "/", icon: Home },
  { name: "Notes", url: "/notes", icon: StickyNote },
  { name: "Tags", url: "/tags", icon: Tags },
  { name: "Network", url: "/network3d", icon: Network },
  { name: "Queue", url: "/queue", icon: Timer },
  { name: "Settings", url: "/settings", icon: Settings },
];

export function DesktopNav() {
  return (
    <NavBar items={navItems} />
  );
}