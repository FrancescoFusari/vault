import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Network3DSettings } from '../Network3DSettings';

export const useGraphSettings = (isMobile: boolean) => {
  const queryClient = useQueryClient();
  
  // Default settings
  const defaultSettings: Network3DSettings = {
    nodeSize: 6,
    linkWidth: 1,
    linkDistance: isMobile ? 60 : 120,
    enableNodeDrag: true,
    enableNavigationControls: true,
    showNavInfo: true,
    enablePointerInteraction: true,
    backgroundColor: 'hsl(229 19% 12%)',
    enableNodeFixing: true
  };

  // Fetch user settings
  const { data: settings = defaultSettings } = useQuery({
    queryKey: ['graphSettings'],
    queryFn: async () => {
      const { data: settings, error } = await supabase
        .from('graph_settings')
        .select('settings')
        .maybeSingle();

      if (error) {
        toast.error('Failed to load graph settings');
        return defaultSettings;
      }

      return settings?.settings as Network3DSettings || defaultSettings;
    }
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: Network3DSettings) => {
      const { data, error } = await supabase
        .from('graph_settings')
        .upsert({ 
          settings: newSettings,
          user_id: (await supabase.auth.getUser()).data.user?.id 
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onError: () => {
      toast.error('Failed to save graph settings');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['graphSettings'] });
      toast.success('Graph settings saved');
    }
  });

  return {
    settings,
    updateSettings: updateSettingsMutation.mutate
  };
};