import { Network3DGraph } from "@/components/graph/Network3DGraph";
import { Network3DSettings, Network3DSettingsDialog } from "@/components/graph/Network3DSettings";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Network3DPage = () => {
  const queryClient = useQueryClient();
  
  const { data: notes = [] } = useQuery({
    queryKey: ['notes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const { data: settings } = useQuery({
    queryKey: ['graphSettings'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('graph_settings')
        .select('settings')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      
      // Ensure we return a properly typed settings object with defaults
      const defaultSettings: Network3DSettings = {
        nodeSize: 6,
        linkWidth: 1,
        linkLength: 120,
        enableNodeDrag: true,
        enableNavigationControls: true,
        showNavInfo: true,
        enablePointerInteraction: true,
        backgroundColor: "hsl(229 19% 12%)",
        enableNodeFixing: true
      };

      return data?.settings ? {
        ...defaultSettings,
        ...data.settings as Partial<Network3DSettings>
      } : defaultSettings;
    }
  });

  const handleSettingChange = async (key: keyof Network3DSettings, value: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const newSettings = settings ? {
      ...settings,
      [key]: value
    } : {};
    
    const { error } = await supabase
      .from('graph_settings')
      .upsert({
        user_id: user.id,
        settings: newSettings
      });

    if (error) {
      console.error('Error updating settings:', error);
      return;
    }

    // Invalidate the query to trigger a refetch
    queryClient.invalidateQueries({ queryKey: ['graphSettings'] });
  };

  return (
    <div className="fixed inset-0 flex flex-col h-screen w-screen">
      <div className="flex-1 relative w-full h-full mt-16"> {/* Added mt-16 to account for navbar height */}
        <Network3DGraph notes={notes} />
        {settings && (
          <Network3DSettingsDialog
            settings={settings}
            onSettingChange={handleSettingChange}
          />
        )}
      </div>
    </div>
  );
};

export default Network3DPage;