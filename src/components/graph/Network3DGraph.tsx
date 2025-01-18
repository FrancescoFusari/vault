import { useRef, useEffect, useState } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import { NetworkNode, NetworkLink, processNetworkData } from '@/utils/networkGraphUtils';
import { Note } from '@/types/graph';
import * as d3 from 'd3';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Network3DGraphProps {
  notes: Note[];
}

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

export const Network3DGraph = ({ notes }: Network3DGraphProps) => {
  const fgRef = useRef<any>();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch user's graph settings
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

  const settings = graphSettings || defaultSettings;

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

  // Set up graph configuration when settings change
  useEffect(() => {
    if (fgRef.current) {
      console.log('Setting link distance to:', settings.linkDistance);
      fgRef.current.d3Force('link').distance(() => settings.linkDistance);
      
      fgRef.current.controls().enableDamping = true;
      fgRef.current.controls().dampingFactor = 0.1;
      fgRef.current.controls().enableZoom = true;
      
      console.log('Setting camera position to:', settings.cameraPosition);
      const { x, y, z } = settings.cameraPosition;
      fgRef.current.camera().position.set(x, y, z);
      fgRef.current.camera().lookAt(0, 0, 0);
    }
  }, [settings]);

  const graphData = processNetworkData(notes);
  const { nodes, links, tagUsageCount, colorScale } = graphData;

  const nodeRelSize = settings.nodeSize;
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
      {dimensions.width > 0 && dimensions.height > 0 && (
        <ForceGraph3D
          ref={fgRef}
          width={dimensions.width}
          height={dimensions.height}
          graphData={{ nodes, links }}
          nodeLabel={(node: any) => node.name}
          nodeRelSize={settings.nodeSize}
          nodeVal={getNodeSize}
          nodeColor={getNodeColor}
          linkWidth={settings.linkWidth}
          backgroundColor={settings.backgroundColor}
          enableNodeDrag={settings.enableNodeDrag}
          enableNavigationControls={settings.enableNavigationControls}
          showNavInfo={settings.showNavInfo}
          d3VelocityDecay={0.1}
          warmupTicks={50}
        />
      )}
    </div>
  );
};