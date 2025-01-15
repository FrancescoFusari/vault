import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Network3DSettings } from '../Network3DSettings';

// Helper function to validate settings
const validateSettings = (data: any): Network3DSettings => {
  const defaultSettings: Network3DSettings = {
    nodeSize: 6,
    linkWidth: 1,
    linkDistance: 120,
    enableNodeDrag: true,
    enableNavigationControls: true,
    showNavInfo: true,
    enablePointerInteraction: true,
    backgroundColor: 'hsl(229 19% 12%)',
    enableNodeFixing: true
  };

  if (!data || typeof data !== 'object') {
    return defaultSettings;
  }

  return {
    nodeSize: typeof data.nodeSize === 'number' ? data.nodeSize : defaultSettings.nodeSize,
    linkWidth: typeof data.linkWidth === 'number' ? data.linkWidth : defaultSettings.linkWidth,
    linkDistance: typeof data.linkDistance === 'number' ? data.linkDistance : defaultSettings.linkDistance,
    enableNodeDrag: typeof data.enableNodeDrag === 'boolean' ? data.enableNodeDrag : defaultSettings.enableNodeDrag,
    enableNavigationControls: typeof data.enableNavigationControls === 'boolean' ? data.enableNavigationControls : defaultSettings.enableNavigationControls,
    showNavInfo: typeof data.showNavInfo === 'boolean' ? data.showNavInfo : defaultSettings.showNavInfo,
    enablePointerInteraction: typeof data.enablePointerInteraction === 'boolean' ? data.enablePointerInteraction : defaultSettings.enablePointerInteraction,
    backgroundColor: typeof data.backgroundColor === 'string' ? data.backgroundColor : defaultSettings.backgroundColor,
    enableNodeFixing: typeof data.enableNodeFixing === 'boolean' ? data.enableNodeFixing : defaultSettings.enableNodeFixing,
  };
};

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
      const { data: settingsData, error } = await supabase
        .from('graph_settings')
        .select('settings')
        .maybeSingle();

      if (error) {
        toast.error('Failed to load graph settings');
        return defaultSettings;
      }

      return validateSettings(settingsData?.settings);
    }
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: Network3DSettings) => {
      const { data, error } = await supabase
        .from('graph_settings')
        .upsert({ 
          settings: newSettings as any, // Type assertion needed for Supabase
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