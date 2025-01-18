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
          .distance(150) // Increased distance for more spread
          .strength(0.15); // Reduced strength for more freedom of movement
      }

      const chargeForce = fgRef.current.d3Force('charge');
      if (chargeForce) {
        chargeForce
          .strength(-120) // Increased repulsion to push nodes apart
          .distanceMax(300) // Increased maximum distance
          .theta(0.8); // Slightly reduced theta for more accurate force calculations
      }

      const centerForce = fgRef.current.d3Force('center');
      if (centerForce) {
        centerForce.strength(0.3); // Increased center pull for better 3D distribution
      }

      const collisionForce = fgRef.current.d3Force('collision');
      if (collisionForce) {
        collisionForce
          .radius((node: NetworkNode) => Math.sqrt(node.value || 1) * 12) // Increased node spacing
          .strength(0.8); // Strong collision force to prevent overlapping
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