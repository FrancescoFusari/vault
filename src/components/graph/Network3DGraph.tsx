import { useRef, useEffect } from 'react';
import ForceGraph3D, { ForceGraphMethods } from 'react-force-graph-3d';
import { NetworkNode, NetworkLink, processNetworkData } from '@/utils/networkGraphUtils';
import { Note } from '@/types/graph';
import * as d3 from 'd3';

interface Network3DGraphProps {
  notes: Note[];
}

export const Network3DGraph = ({ notes }: Network3DGraphProps) => {
  const fgRef = useRef<ForceGraphMethods>();
  const graphData = processNetworkData(notes);
  const { nodes, links } = graphData;

  useEffect(() => {
    requestAnimationFrame(() => {
      const fg = fgRef.current;
      if (!fg) return;

      const simulation = fg.d3Force('simulation');
      if (!simulation) return;

      simulation
        .force('link', d3.forceLink())
        .force('charge', d3.forceManyBody())
        .force('center', d3.forceCenter())
        .force('collision', d3.forceCollide());

      const linkForce = simulation.force('link');
      if (linkForce) {
        linkForce
          .id((d: any) => d.id)
          .distance(15)
          .strength(1.5)
          .iterations(10);
      }

      const chargeForce = simulation.force('charge');
      if (chargeForce) {
        chargeForce.strength(-20);
      }

      const centerForce = simulation.force('center');
      if (centerForce) {
        centerForce.strength(1.2);
      }

      const collisionForce = simulation.force('collision');
      if (collisionForce) {
        collisionForce.radius(3);
      }

      simulation.force('sphere', () => {
        nodes.forEach((node: any) => {
          const distance = Math.sqrt(
            node.x * node.x + 
            node.y * node.y + 
            node.z * node.z
          );
          
          if (distance > 0) {
            const targetRadius = 50;
            const scale = targetRadius / distance;
            
            node.x *= scale;
            node.y *= scale;
            node.z *= scale;
          }
        });
      });
    });
  }, [nodes]);

  return (
    <div className="w-full h-full">
      <ForceGraph3D
        ref={fgRef}
        graphData={{ nodes, links }}
        nodeLabel={(node: any) => node.name}
        nodeThreeObject={(node: any) => {
          if (node.type === 'note') {
            const sprite = new SpriteText(node.name);
            sprite.color = '#ffffff';
            sprite.textHeight = 3;
            sprite.backgroundColor = 'rgba(0,0,0,0.5)';
            sprite.padding = 2;
            sprite.borderRadius = 3;
            return sprite;
          }
          return null;
        }}
        nodeColor={(node: any) => node.type === 'note' ? '#EF7234' : '#E0E0D7'}
        backgroundColor="#1B1B1F"
        linkColor={() => "#8E9196"}
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