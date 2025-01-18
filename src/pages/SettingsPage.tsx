import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { LogOut, Moon, Sun } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { Slider } from "@/components/ui/slider";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface GraphSettings {
  nodeSize: number;
  linkWidth: number;
  backgroundColor: string;
  enableNodeDrag: boolean;
  enableNavigationControls: boolean;
  showNavInfo: boolean;
  linkDistance: number;
  cameraPosition: {
    x: number;
    y: number;
    z: number;
  };
}

const defaultSettings: GraphSettings = {
  nodeSize: 6,
  linkWidth: 1,
  backgroundColor: "hsl(229 19% 12%)",
  enableNodeDrag: true,
  enableNavigationControls: true,
  showNavInfo: true,
  linkDistance: 800,
  cameraPosition: { x: 4600, y: 4600, z: 4600 }
};

const SettingsPage = () => {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const queryClient = useQueryClient();

  const { data: graphSettings } = useQuery({
    queryKey: ['graphSettings'],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('graph_settings')
        .select('settings')
        .eq('user_id', userData.user.id)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching graph settings:', error);
        return defaultSettings;
      }
      
      // Validate and transform the settings
      const settings = data?.settings as Record<string, any>;
      if (!settings) return defaultSettings;

      // Ensure all required properties exist with correct types
      const validatedSettings: GraphSettings = {
        nodeSize: typeof settings.nodeSize === 'number' ? settings.nodeSize : defaultSettings.nodeSize,
        linkWidth: typeof settings.linkWidth === 'number' ? settings.linkWidth : defaultSettings.linkWidth,
        backgroundColor: typeof settings.backgroundColor === 'string' ? settings.backgroundColor : defaultSettings.backgroundColor,
        enableNodeDrag: typeof settings.enableNodeDrag === 'boolean' ? settings.enableNodeDrag : defaultSettings.enableNodeDrag,
        enableNavigationControls: typeof settings.enableNavigationControls === 'boolean' ? settings.enableNavigationControls : defaultSettings.enableNavigationControls,
        showNavInfo: typeof settings.showNavInfo === 'boolean' ? settings.showNavInfo : defaultSettings.showNavInfo,
        linkDistance: typeof settings.linkDistance === 'number' ? settings.linkDistance : defaultSettings.linkDistance,
        cameraPosition: {
          x: typeof settings.cameraPosition?.x === 'number' ? settings.cameraPosition.x : defaultSettings.cameraPosition.x,
          y: typeof settings.cameraPosition?.y === 'number' ? settings.cameraPosition.y : defaultSettings.cameraPosition.y,
          z: typeof settings.cameraPosition?.z === 'number' ? settings.cameraPosition.z : defaultSettings.cameraPosition.z,
        }
      };

      return validatedSettings;
    }
  });

  const form = useForm<GraphSettings>({
    defaultValues: graphSettings || defaultSettings
  });

  useEffect(() => {
    if (graphSettings) {
      form.reset(graphSettings);
    }
  }, [graphSettings, form]);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Failed to log out');
    }
  };

  const onSubmit = async (data: GraphSettings) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('No user found');

      const { error } = await supabase
        .from('graph_settings')
        .upsert({ 
          user_id: userData.user.id,
          settings: data as unknown as Json
        });

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['graphSettings'] });
      toast.success('Graph settings updated successfully');
    } catch (error) {
      console.error('Error updating graph settings:', error);
      toast.error('Failed to update graph settings');
    }
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <div className="container max-w-2xl py-4 space-y-8">
      <h1 className="text-2xl font-semibold">Settings</h1>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-card rounded-lg border">
          <div className="flex items-center gap-3">
            {theme === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            <span>Dark Mode</span>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="p-4 bg-card rounded-lg border space-y-4">
              <h2 className="text-lg font-semibold">Graph Settings</h2>

              <FormField
                control={form.control}
                name="linkDistance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Link Distance</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        <Slider
                          min={100}
                          max={2000}
                          step={100}
                          value={[field.value]}
                          onValueChange={(value) => field.onChange(value[0])}
                        />
                        <div className="text-sm text-muted-foreground text-right">
                          {field.value}
                        </div>
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cameraPosition.x"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Camera Position X</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        <Slider
                          min={1000}
                          max={10000}
                          step={100}
                          value={[field.value]}
                          onValueChange={(value) => field.onChange(value[0])}
                        />
                        <div className="text-sm text-muted-foreground text-right">
                          {field.value}
                        </div>
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cameraPosition.y"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Camera Position Y</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        <Slider
                          min={1000}
                          max={10000}
                          step={100}
                          value={[field.value]}
                          onValueChange={(value) => field.onChange(value[0])}
                        />
                        <div className="text-sm text-muted-foreground text-right">
                          {field.value}
                        </div>
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cameraPosition.z"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Camera Position Z</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        <Slider
                          min={1000}
                          max={10000}
                          step={100}
                          value={[field.value]}
                          onValueChange={(value) => field.onChange(value[0])}
                        />
                        <div className="text-sm text-muted-foreground text-right">
                          {field.value}
                        </div>
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />

              <Button type="submit">Save Graph Settings</Button>
            </div>
          </form>
        </Form>

        <Button
          variant="destructive"
          className="w-full flex items-center gap-2 justify-center"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5" />
          Log Out
        </Button>
      </div>
    </div>
  );
};

export default SettingsPage;