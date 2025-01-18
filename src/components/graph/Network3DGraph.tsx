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
      // Initialize forces
      const simulation = fgRef.current.d3Force();

      // Reset to default forces
      simulation
        .force('link', d3.forceLink())
        .force('charge', d3.forceManyBody())
        .force('center', d3.forceCenter())
        .force('collision', d3.forceCollide());

      // Configure link force
      const linkForce = simulation.force('link');
      if (linkForce) {
        linkForce
          .id((d: any) => d.id)
          .distance(50); // Shorter distance for tighter sphere
      }

      // Configure charge force for 3D distribution
      const chargeForce = simulation.force('charge');
      if (chargeForce) {
        chargeForce.strength(-30); // Moderate repulsion
      }

      // Configure center force to maintain spherical shape
      const centerForce = simulation.force('center');
      if (centerForce) {
        centerForce.strength(1); // Strong centering force
      }

      // Add collision force to prevent overlap
      const collisionForce = simulation.force('collision');
      if (collisionForce) {
        collisionForce.radius(5); // Fixed radius for all nodes
      }

      // Add a custom force to maintain spherical shape
      simulation.force('sphere', () => {
        nodes.forEach((node: any) => {
          // Calculate distance from center
          const distance = Math.sqrt(
            node.x * node.x + 
            node.y * node.y + 
            node.z * node.z
          );
          
          if (distance > 0) {
            // Target radius of 100 units
            const targetRadius = 100;
            const scale = targetRadius / distance;
            
            // Move nodes towards the sphere surface
            node.x *= scale;
            node.y *= scale;
            node.z *= scale;
          }
        });
      });
    }
  }, [nodes]);

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