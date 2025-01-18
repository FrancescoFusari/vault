import { useRef, useEffect } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import { NetworkNode, NetworkLink, processNetworkData } from '@/utils/networkGraphUtils';
import { Note } from '@/types/graph';
import * as d3 from 'd3';

interface Network3DGraphProps {
  notes: Note[];
}

export const Network3DGraph = ({ notes }: Network3DGraphProps) => {
  const fgRef = useRef<any>();
  const graphData = processNetworkData(notes);
  const { nodes, links } = graphData;

  // Configure force simulation using useEffect
  useEffect(() => {
    if (fgRef.current) {
      // Initialize forces first
      fgRef.current.d3Force('link', d3.forceLink());
      fgRef.current.d3Force('charge', d3.forceManyBody());
      fgRef.current.d3Force('center', d3.forceCenter());
      fgRef.current.d3Force('collision', d3.forceCollide());

      // Then configure them
      const linkForce = fgRef.current.d3Force('link');
      if (linkForce) {
        linkForce
          .distance(100) // Reduced distance for tighter clustering
          .strength(0.2); // Reduced strength for smoother movement
      }

      const chargeForce = fgRef.current.d3Force('charge');
      if (chargeForce) {
        chargeForce
          .strength(-80) // Reduced repulsion for less shaking
          .distanceMax(250) // Increased maximum distance
          .theta(0.9); // Higher theta for smoother approximation
      }

      const centerForce = fgRef.current.d3Force('center');
      if (centerForce) {
        centerForce.strength(0.1); // Reduced center pull for more stability
      }

      const collisionForce = fgRef.current.d3Force('collision');
      if (collisionForce) {
        collisionForce
          .radius((node: NetworkNode) => Math.sqrt(node.value || 1) * 8) // Adjusted node spacing
          .strength(0.9); // Increased collision strength for better separation
      }
    }
  }, []);

  return (
    <div className="w-full h-full">
      <ForceGraph3D
        ref={fgRef}
        graphData={{ nodes, links }}
        nodeLabel={(node: any) => node.name}
        nodeColor={(node: any) => node.type === 'note' ? '#60a5fa' : '#f59e0b'}
        backgroundColor="hsl(229 19% 12%)"
        linkWidth={0.3}
        linkDirectionalParticles={1}
        linkDirectionalParticleWidth={0.2}
        enableNavigationControls={true}
        enableNodeDrag={true}
        forceEngine="d3"
        cooldownTime={Infinity}
        nodeResolution={32}
      />
    </div>
  );
};