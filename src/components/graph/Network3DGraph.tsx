import { useRef, useEffect, useState } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import { NetworkNode, NetworkLink, processNetworkData } from '@/utils/networkGraphUtils';
import { Note } from '@/types/graph';
import * as d3 from 'd3';

interface Network3DGraphProps {
  notes: Note[];
}

const defaultSettings = {
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
    if (fgRef.current && !isInitialized) {
      const distance = defaultSettings.linkDistance * 3;
      console.log('Setting link distance to:', distance);
      
      fgRef.current.d3Force('link').distance(() => distance);
      fgRef.current.controls().enableDamping = true;
      fgRef.current.controls().dampingFactor = 0.1;
      fgRef.current.controls().enableZoom = true;
      
      const { nodes } = processNetworkData(notes);
      if (nodes.length > 0) {
        console.log('Setting initial camera distance to: 5000');
        fgRef.current.camera().position.set(5000, 5000, 5000);
        fgRef.current.camera().lookAt(0, 0, 0);
      } else {
        console.log('Setting default camera distance to: 5000');
        fgRef.current.camera().position.set(5000, 5000, 5000);
        fgRef.current.camera().lookAt(0, 0, 0);
      }
      
      setIsInitialized(true);
    }
  }, [isInitialized, notes]);

  const graphData = processNetworkData(notes);
  const { nodes, links, tagUsageCount, colorScale } = graphData;

  const nodeRelSize = defaultSettings.nodeSize;
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
          linkWidth={defaultSettings.linkWidth}
          backgroundColor={defaultSettings.backgroundColor}
          enableNodeDrag={defaultSettings.enableNodeDrag}
          enableNavigationControls={defaultSettings.enableNavigationControls}
          showNavInfo={defaultSettings.showNavInfo}
          d3VelocityDecay={0.1}
          warmupTicks={50}
        />
      )}
    </div>
  );
};