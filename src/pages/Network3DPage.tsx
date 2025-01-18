import { Network3DGraph } from "@/components/graph/Network3DGraph";
import { Network3DSettingsDialog } from "@/components/graph/Network3DSettings";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Network3DPage = () => {
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

  const { data: settings, mutate: mutateSettings } = useQuery({
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
      return data?.settings;
    }
  });

  const handleSettingChange = async (key: string, value: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const newSettings = { ...settings, [key]: value };
    
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

    mutateSettings();
  };

  return (
    <div className="fixed inset-0 flex flex-col h-screen w-screen">
      <div className="flex-1 relative w-full h-full">
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