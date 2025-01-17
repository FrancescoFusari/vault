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

export const Network3DGraph = ({ notes }: Network3DGraphProps) => {
  const fgRef = useRef<any>();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: graphSettings } = useQuery({
    queryKey: ['graphSettings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('graph_settings')
        .select('*')
        .single();
      
      if (error) throw error;
      return data?.settings;
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
    if (fgRef.current) {
      // Add zoom controls
      fgRef.current.controls().enableDamping = true;
      fgRef.current.controls().dampingFactor = 0.1;
      fgRef.current.controls().enableZoom = true;
      
      // Add camera positioning
      fgRef.current.camera().position.set(200, 200, 200);
      fgRef.current.camera().lookAt(0, 0, 0);
    }
  }, []);

  const { nodes, links, tagUsageCount, colorScale } = processNetworkData(notes);

  // Node size based on connections
  const nodeRelSize = graphSettings?.nodeSize || 6;
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
          linkWidth={graphSettings?.linkWidth || 1}
          backgroundColor={graphSettings?.backgroundColor || "hsl(229 19% 12%)"}
          enableNodeDrag={graphSettings?.enableNodeDrag ?? true}
          enableNavigationControls={graphSettings?.enableNavigationControls ?? true}
          showNavInfo={graphSettings?.showNavInfo ?? true}
          linkDistance={graphSettings?.linkDistance || 120}
          warmupTicks={50}
        />
      )}
    </div>
  );
};