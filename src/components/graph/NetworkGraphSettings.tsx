import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

interface NetworkGraphSettingsProps {
  settings: {
    linkDistance: number;
    chargeStrength: number;
    collisionRadius: number;
  };
  onSettingChange: (setting: string, value: number) => void;
}

export const NetworkGraphSettings = ({
  settings,
  onSettingChange,
}: NetworkGraphSettingsProps) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-24 right-4 z-50 rounded-full md:bottom-8"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Graph Settings</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="link-distance">Link Distance</Label>
            <Slider
              id="link-distance"
              min={30}
              max={200}
              step={10}
              value={[settings.linkDistance]}
              onValueChange={([value]) => onSettingChange('linkDistance', value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="charge-strength">Force Strength</Label>
            <Slider
              id="charge-strength"
              min={-400}
              max={-50}
              step={10}
              value={[settings.chargeStrength]}
              onValueChange={([value]) => onSettingChange('chargeStrength', value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="collision-radius">Node Size</Label>
            <Slider
              id="collision-radius"
              min={2}
              max={10}
              step={1}
              value={[settings.collisionRadius]}
              onValueChange={([value]) => onSettingChange('collisionRadius', value)}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};