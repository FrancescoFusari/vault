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
}

const defaultSettings: GraphSettings = {
  nodeSize: 6,
  linkWidth: 1,
  backgroundColor: "hsl(229 19% 12%)",
  enableNodeDrag: true,
  enableNavigationControls: true,
  showNavInfo: true,
  linkDistance: 120
};

export const Network3DGraph = ({ notes }: Network3DGraphProps) => {
  const fgRef = useRef<any>();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const { data: graphSettings } = useQuery({
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
      
      // Safely type cast the settings
      const settings = data?.settings as Record<keyof GraphSettings, any>;
      return settings ? {
        nodeSize: Number(settings.nodeSize) || defaultSettings.nodeSize,
        linkWidth: Number(settings.linkWidth) || defaultSettings.linkWidth,
        backgroundColor: String(settings.backgroundColor) || defaultSettings.backgroundColor,
        enableNodeDrag: Boolean(settings.enableNodeDrag ?? defaultSettings.enableNodeDrag),
        enableNavigationControls: Boolean(settings.enableNavigationControls ?? defaultSettings.enableNavigationControls),
        showNavInfo: Boolean(settings.showNavInfo ?? defaultSettings.showNavInfo),
        linkDistance: Number(settings.linkDistance) || defaultSettings.linkDistance
      } : defaultSettings;
    }
  });

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

  useEffect(() => {
    if (fgRef.current && graphSettings && !isInitialized) {
      // Configure the force simulation
      const distance = (graphSettings.linkDistance || defaultSettings.linkDistance) * 3;
      console.log('Setting link distance to:', distance);
      
      fgRef.current.d3Force('link').distance(() => distance);
      fgRef.current.controls().enableDamping = true;
      fgRef.current.controls().dampingFactor = 0.1;
      fgRef.current.controls().enableZoom = true;
      
      // Set initial camera position to show all nodes
      const { nodes } = processNetworkData(notes);
      if (nodes.length > 0) {
        console.log('Setting initial camera distance to: 2400');
        fgRef.current.camera().position.set(2400, 2400, 2400);
        fgRef.current.camera().lookAt(0, 0, 0);
      } else {
        console.log('Setting default camera distance to: 2400');
        fgRef.current.camera().position.set(2400, 2400, 2400);
        fgRef.current.camera().lookAt(0, 0, 0);
      }
      
      setIsInitialized(true);
    }
  }, [graphSettings, isInitialized, notes]);

  // Reset force simulation when settings change
  useEffect(() => {
    if (fgRef.current && graphSettings && isInitialized) {
      const distance = (graphSettings.linkDistance || defaultSettings.linkDistance) * 3;
      console.log('Updating link distance to:', distance);
      fgRef.current.d3Force('link').distance(() => distance);
      // Get the current graph data directly from the component's props
      const currentData = { nodes, links };
      fgRef.current.d3Force('link').initialize(currentData.links);
    }
  }, [graphSettings?.linkDistance]);

  const { nodes, links, tagUsageCount, colorScale } = processNetworkData(notes);

  const nodeRelSize = graphSettings?.nodeSize || defaultSettings.nodeSize;
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
          nodeRelSize={nodeRelSize}
          nodeVal={getNodeSize}
          nodeColor={getNodeColor}
          linkWidth={graphSettings?.linkWidth || defaultSettings.linkWidth}
          backgroundColor={graphSettings?.backgroundColor || defaultSettings.backgroundColor}
          enableNodeDrag={graphSettings?.enableNodeDrag ?? defaultSettings.enableNodeDrag}
          enableNavigationControls={graphSettings?.enableNavigationControls ?? defaultSettings.enableNavigationControls}
          showNavInfo={graphSettings?.showNavInfo ?? defaultSettings.showNavInfo}
          d3VelocityDecay={0.1}
          warmupTicks={50}
        />
      )}
    </div>
  );
};