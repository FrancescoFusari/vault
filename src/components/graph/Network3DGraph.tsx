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
  cameraPosition: { x: 4600, y: 4600, z: 4600 }
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

  // Initialize graph configuration
  useEffect(() => {
    if (fgRef.current) {
      console.log('Initializing force graph with custom settings');
      
      // Clear existing forces first
      fgRef.current.d3Force('link', null);
      fgRef.current.d3Force('charge', null);
      
      // Set up custom forces
      const forceLink = d3.forceLink()
        .distance(() => defaultSettings.linkDistance)
        .id((d: any) => d.id);
      
      const forceCharge = d3.forceManyBody()
        .strength(-500);
      
      // Apply forces
      fgRef.current.d3Force('link', forceLink);
      fgRef.current.d3Force('charge', forceCharge);
      
      // Set camera position
      const distance = Math.sqrt(
        Math.pow(defaultSettings.cameraPosition.x, 2) +
        Math.pow(defaultSettings.cameraPosition.y, 2) +
        Math.pow(defaultSettings.cameraPosition.z, 2)
      );
      
      const camera = fgRef.current.camera();
      const controls = fgRef.current.controls();
      
      if (camera) {
        const { x, y, z } = defaultSettings.cameraPosition;
        camera.position.set(x, y, z);
        camera.lookAt(0, 0, 0);
      }
      
      if (controls) {
        controls.enableDamping = true;
        controls.dampingFactor = 0.1;
        controls.enableZoom = true;
        controls.minDistance = distance * 0.5;
        controls.maxDistance = distance * 1.5;
      }

      // Force a re-render and reheat simulation
      fgRef.current.refresh();
      fgRef.current._animationCycle();
    }
  }, []);

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
          forceEngine="d3"
        />
      )}
    </div>
  );
};