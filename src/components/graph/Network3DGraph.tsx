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
  linkDistance: 800,
  linkCurvature: 0.2,
  cameraPosition: { x: 5000, y: 5000, z: 5000 }
};

export const Network3DGraph = ({ notes }: Network3DGraphProps) => {
  const fgRef = useRef<any>();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Set up graph configuration once when the component mounts
  useEffect(() => {
    if (fgRef.current) {
      console.log('Setting link distance to:', defaultSettings.linkDistance);
      
      // Optimize force simulation
      const fg = fgRef.current;
      fg.d3Force('link').distance(() => defaultSettings.linkDistance);
      
      // Reduce charge strength for better performance
      fg.d3Force('charge').strength(-50);
      
      // Add collision force to prevent node overlap
      fg.d3Force('collision', d3.forceCollide(10));
      
      // Optimize rendering
      fg.controls().enableDamping = true;
      fg.controls().dampingFactor = 0.1;
      fg.controls().enableZoom = true;
      
      // Reduce WebGL texture quality for better performance
      fg.renderer().setPixelRatio(Math.min(2, window.devicePixelRatio));
      
      console.log('Setting camera position to:', defaultSettings.cameraPosition);
      const { x, y, z } = defaultSettings.cameraPosition;
      fg.camera().position.set(x, y, z);
      fg.camera().lookAt(0, 0, 0);
    }
  }, []);

  const graphData = processNetworkData(notes);
  const { nodes, links, tagUsageCount, colorScale } = graphData;

  // Set fixed curvature for all links
  const linksWithFixedCurvature = links.map(link => ({
    ...link,
    curvature: defaultSettings.linkCurvature
  }));

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
          graphData={{ nodes, links: linksWithFixedCurvature }}
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
          cooldownTime={2000}
          cooldownTicks={100}
        />
      )}
    </div>
  );
};