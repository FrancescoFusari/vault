import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Settings } from "lucide-react";

export interface Network3DSettings {
  nodeSize: number;
  linkWidth: number;
  linkDistance: number;  // Added this setting
  enableNodeDrag: boolean;
  enableNavigationControls: boolean;
  showNavInfo: boolean;
  enablePointerInteraction: boolean;
  backgroundColor: string;
  enableNodeFixing: boolean;
}

interface Network3DSettingsProps {
  settings: Network3DSettings;
  onSettingChange: (key: keyof Network3DSettings, value: any) => void;
}

export const Network3DSettingsDialog = ({ settings, onSettingChange }: Network3DSettingsProps) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="absolute top-4 right-4 z-10">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Graph Settings</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="nodeSize">Node Size</Label>
            <Slider
              id="nodeSize"
              min={1}
              max={20}
              step={1}
              value={[settings.nodeSize]}
              onValueChange={([value]) => onSettingChange('nodeSize', value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="linkWidth">Link Width</Label>
            <Slider
              id="linkWidth"
              min={0.1}
              max={5}
              step={0.1}
              value={[settings.linkWidth]}
              onValueChange={([value]) => onSettingChange('linkWidth', value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="linkDistance">Link Distance</Label>
            <Slider
              id="linkDistance"
              min={30}
              max={300}
              step={10}
              value={[settings.linkDistance]}
              onValueChange={([value]) => onSettingChange('linkDistance', value)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="nodeDrag">Enable Node Drag</Label>
            <Switch
              id="nodeDrag"
              checked={settings.enableNodeDrag}
              onCheckedChange={(checked) => onSettingChange('enableNodeDrag', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="nodeFixing">Fix Nodes After Drag</Label>
            <Switch
              id="nodeFixing"
              checked={settings.enableNodeFixing}
              onCheckedChange={(checked) => onSettingChange('enableNodeFixing', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="navigationControls">Navigation Controls</Label>
            <Switch
              id="navigationControls"
              checked={settings.enableNavigationControls}
              onCheckedChange={(checked) => onSettingChange('enableNavigationControls', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="navInfo">Show Navigation Info</Label>
            <Switch
              id="navInfo"
              checked={settings.showNavInfo}
              onCheckedChange={(checked) => onSettingChange('showNavInfo', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="pointerInteraction">Enable Pointer Interaction</Label>
            <Switch
              id="pointerInteraction"
              checked={settings.enablePointerInteraction}
              onCheckedChange={(checked) => onSettingChange('enablePointerInteraction', checked)}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};