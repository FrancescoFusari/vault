import { useState, useRef, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNavigate } from 'react-router-dom';
import { useGraphDimensions } from '@/hooks/useGraphDimensions';
import ForceGraph3D from 'react-force-graph-3d';
import { NotePopupWindow } from './NotePopupWindow';
import { processNetworkData, NetworkNode } from '@/utils/networkGraphUtils';
import { Note } from '@/types/graph';
import { Network3DSettingsDialog, Network3DSettings } from './Network3DSettings';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Json } from '@/integrations/supabase/types';

interface Network3DGraphProps {
  notes: Note[];
}

interface NetworkLink {
  source: NetworkNode;
  target: NetworkNode;
  value: number;
}

export const Network3DGraph = ({ notes }: Network3DGraphProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<any>(null);
  const { theme } = useTheme();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const dimensions = useGraphDimensions(containerRef, isMobile);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const highlightedNodeRef = useRef<NetworkNode | null>(null);
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
    backgroundColor: theme === 'dark' ? 'hsl(229 19% 12%)' : 'hsl(40 33% 98%)',
    enableNodeFixing: true
  };

  // Fetch user settings
  const { data: userSettings } = useQuery({
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

      const parsedSettings = settings?.settings as unknown as Network3DSettings;
      return parsedSettings || defaultSettings;
    }
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: Network3DSettings) => {
      const { data, error } = await supabase
        .from('graph_settings')
        .upsert({ 
          settings: newSettings as unknown as Json,
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

  const [settings, setSettings] = useState<Network3DSettings>(defaultSettings);

  // Update local settings when user settings are loaded
  useEffect(() => {
    if (userSettings) {
      setSettings(userSettings);
    }
  }, [userSettings]);

  const handleSettingChange = (key: keyof Network3DSettings, value: any) => {
    const newSettings = {
      ...settings,
      [key]: value
    };
    setSettings(newSettings);
    updateSettingsMutation.mutate(newSettings);

    // Update force engine parameters when link distance changes
    if (key === 'linkDistance' && graphRef.current) {
      graphRef.current.d3Force('link').distance(value);
    }
  };

  const { nodes, links, tagUsageCount, colorScale } = processNetworkData(notes);

  const handleNodeDragEnd = (node: NetworkNode) => {
    if (settings.enableNodeFixing) {
      node.fx = node.x;
      node.fy = node.y;
      node.fz = node.z;
    }
  };

  const handleNodeClick = (node: NetworkNode) => {
    highlightedNodeRef.current = node;
    if (graphRef.current) {
      graphRef.current.refresh();
    }
    
    const distance = 40;
    const distRatio = 1 + distance/Math.hypot(node.x || 0, node.y || 0, node.z || 0);

    const newPos = node.x || node.y || node.z
      ? { 
          x: (node.x || 0) * distRatio, 
          y: (node.y || 0) * distRatio, 
          z: (node.z || 0) * distRatio 
        }
      : { x: 0, y: 0, z: distance };

    graphRef.current.cameraPosition(
      newPos,
      node,
      3000
    );

    setTimeout(() => {
      if (node.type === 'note' && node.originalNote) {
        if (isMobile) {
          setSelectedNote(node.originalNote);
        } else {
          navigate(`/note/${node.originalNote.id}`);
        }
      }
    }, 3000);
  };

  const getLinkColor = (link: NetworkLink) => {
    if (highlightedNodeRef.current && 
       (link.source.id === highlightedNodeRef.current.id || 
        link.target.id === highlightedNodeRef.current.id)) {
      return '#ea384c';
    }
    
    if (!link.source || !link.target) return theme === 'dark' ? '#475569' : '#94a3b8';
    
    const isUrlLink = 
      (link.source as NetworkNode).originalNote?.input_type === 'url' || 
      (link.target as NetworkNode).originalNote?.input_type === 'url';
    
    return isUrlLink 
      ? theme === 'dark' ? '#60a5fa' : '#3b82f6'
      : theme === 'dark' ? '#475569' : '#94a3b8';
  };

  const getNodeColor = (node: NetworkNode) => {
    if (node.type === 'tag') {
      const usageCount = tagUsageCount.get(node.name) ?? 1;
      return colorScale(usageCount);
    }
    
    if (node.type === 'note' && node.originalNote?.input_type === 'url') {
      return theme === 'dark' ? '#60a5fa' : '#3b82f6';
    }
    
    return theme === 'dark' ? '#6366f1' : '#818cf8';
  };

  return (
    <div 
      ref={containerRef} 
      className="absolute inset-0 w-full h-full"
    >
      <Network3DSettingsDialog
        settings={settings}
        onSettingChange={handleSettingChange}
      />
      <ForceGraph3D
        ref={graphRef}
        width={dimensions.width}
        height={dimensions.height}
        graphData={{ nodes, links }}
        nodeLabel={(node: any) => {
          const n = node as NetworkNode;
          if (n.type === 'note' && n.originalNote?.input_type === 'url') {
            return `🔗 ${n.name}`;
          }
          return n.name;
        }}
        nodeColor={getNodeColor}
        linkColor={getLinkColor}
        backgroundColor={settings.backgroundColor}
        onNodeClick={handleNodeClick}
        onNodeDragEnd={handleNodeDragEnd}
        nodeRelSize={settings.nodeSize}
        linkWidth={settings.linkWidth}
        enableNodeDrag={settings.enableNodeDrag}
        enableNavigationControls={settings.enableNavigationControls}
        showNavInfo={settings.showNavInfo}
        enablePointerInteraction={settings.enablePointerInteraction}
        controlType="orbit"
        forceEngine={isMobile ? "d3" : undefined}
        cooldownTime={isMobile ? 3000 : undefined}
        warmupTicks={isMobile ? 20 : undefined}
        d3Force={(force: string) => {
          if (force === 'link') {
            return {
              distance: settings.linkDistance
            };
          }
          return undefined;
        }}
      />
      {selectedNote && (
        <NotePopupWindow
          note={selectedNote}
          onClose={() => setSelectedNote(null)}
        />
      )}
    </div>
  );
};