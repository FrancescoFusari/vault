import { useRef, useEffect, useState } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import { NetworkNode, NetworkLink, processNetworkData } from '@/utils/networkGraphUtils';
import { Note } from '@/types/graph';
import * as d3 from 'd3';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Network3DSettings, Network3DSettingsDialog } from './Network3DSettings';
import { Json } from '@/integrations/supabase/types';

interface Network3DGraphProps {
  notes: Note[];
}

const defaultSettings: Network3DSettings = {
  nodeSize: 6,
  linkWidth: 1,
  backgroundColor: "hsl(229 19% 12%)",
  enableNodeDrag: true,
  enableNavigationControls: true,
  showNavInfo: true,
  linkLength: 120,
  enablePointerInteraction: true,
  enableNodeFixing: true,
  cameraDistance: 5000,
  rotationSpeed: 0.001,
  tiltAngle: 23
};

// Type guard to validate if the data matches Network3DSettings structure
const isValidSettings = (data: Json): data is Network3DSettings => {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) return false;
  
  const requiredKeys: (keyof Network3DSettings)[] = [
    'nodeSize',
    'linkWidth',
    'backgroundColor',
    'enableNodeDrag',
    'enableNavigationControls',
    'showNavInfo',
    'linkLength',
    'enablePointerInteraction',
    'enableNodeFixing',
    'cameraDistance',
    'rotationSpeed',
    'tiltAngle'
  ];
  
  return requiredKeys.every(key => key in data);
};

export const Network3DGraph = ({ notes }: Network3DGraphProps) => {
  const fgRef = useRef<any>();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const rotationRef = useRef(0);

  const { data: graphSettings, refetch: refetchSettings } = useQuery({
    queryKey: ['graphSettings'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('graph_settings')
        .select('settings')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') throw error;
      
      if (!data?.settings) {
        const { error: insertError } = await supabase
          .from('graph_settings')
          .insert({
            user_id: user.id,
            settings: defaultSettings as unknown as Json
          });
        
        if (insertError) throw insertError;
        return defaultSettings;
      }
      
      // Validate the settings before returning them
      if (isValidSettings(data.settings)) {
        return data.settings;
      }
      
      console.error('Invalid settings format in database, using defaults');
      return defaultSettings;
    },
    initialData: defaultSettings
  });

  const saveSettings = async (key: keyof Network3DSettings, value: any) => {
    console.log('Saving setting:', key, value);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const newSettings = { ...graphSettings, [key]: value };
    
    const { error } = await supabase
      .from('graph_settings')
      .upsert({
        user_id: user.id,
        settings: newSettings as unknown as Json
      });

    if (error) {
      console.error('Error saving graph settings:', error);
      return;
    }

    await refetchSettings();
  };

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);

    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  // Apply settings when they change
  useEffect(() => {
    if (fgRef.current && graphSettings) {
      console.log('Applying settings:', graphSettings);
      
      // Update force simulation settings
      const distance = graphSettings.linkLength * 3;
      fgRef.current.d3Force('link').distance(() => distance);
      
      // Update camera settings
      const camera = fgRef.current.camera();
      camera.position.set(
        graphSettings.cameraDistance,
        graphSettings.cameraDistance,
        graphSettings.cameraDistance
      );
      camera.lookAt(0, 0, 0);

      // Update scene rotation
      const scene = fgRef.current.scene();
      scene.rotation.x = (graphSettings.tiltAngle * Math.PI) / 180;

      // Update controls
      const controls = fgRef.current.controls();
      controls.enableDamping = true;
      controls.dampingFactor = 0.1;
      controls.enabled = graphSettings.enableNavigationControls;
      
      // Restart simulation with new settings
      fgRef.current.d3ReheatSimulation();
    }
  }, [graphSettings]);

  // Handle rotation animation
  useEffect(() => {
    let animationFrameId: number;
    
    const animate = () => {
      if (fgRef.current && graphSettings.rotationSpeed > 0) {
        rotationRef.current += graphSettings.rotationSpeed;
        fgRef.current.scene().rotation.y = rotationRef.current;
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    animate();
    
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [graphSettings.rotationSpeed]);

  const { nodes, links, tagUsageCount, colorScale } = processNetworkData(notes);

  const nodeRelSize = graphSettings.nodeSize;
  const nodeSizeScale = d3.scaleLinear()
    .domain([0, Math.max(...Array.from(tagUsageCount.values()))])
    .range([nodeRelSize, nodeRelSize * 2]);

  const getNodeSize = (node: NetworkNode) => {
    if (node.type === 'tag') {
      const usage = tagUsageCount.get(node.name) || 1;
      return nodeSizeScale(usage);
    }
    return nodeRelSize;
  };

  const getNodeColor = (node: NetworkNode) => {
    if (node.type === 'tag') {
      const usage = tagUsageCount.get(node.name) || 1;
      return colorScale(usage);
    }
    return node.type === 'note' ? '#60a5fa' : '#f59e0b';
  };

  return (
    <div ref={containerRef} className="w-full h-full">
      <Network3DSettingsDialog 
        settings={graphSettings} 
        onSettingChange={saveSettings}
      />
      {dimensions.width > 0 && dimensions.height > 0 && (
        <ForceGraph3D
          ref={fgRef}
          width={dimensions.width}
          height={dimensions.height}
          graphData={{ nodes, links }}
          nodeLabel={(node: any) => node.name}
          nodeRelSize={nodeRelSize}
          nodeVal={getNodeSize}
          nodeColor={getNodeColor}
          linkWidth={graphSettings.linkWidth}
          backgroundColor={graphSettings.backgroundColor}
          enableNodeDrag={graphSettings.enableNodeDrag}
          enableNavigationControls={graphSettings.enableNavigationControls}
          showNavInfo={graphSettings.showNavInfo}
          enablePointerInteraction={graphSettings.enablePointerInteraction}
          onNodeDragEnd={node => {
            if (graphSettings.enableNodeFixing) {
              // Fix node position after drag
              const n = node as NetworkNode;
              n.fx = n.x;
              n.fy = n.y;
              n.fz = n.z;
            }
          }}
          d3VelocityDecay={0.1}
          warmupTicks={50}
        />
      )}
    </div>
  );
};