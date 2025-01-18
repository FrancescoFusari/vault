import { useRef, useEffect, useCallback, useMemo } from 'react';
import ForceGraph3D, { ForceGraphMethods } from 'react-force-graph-3d';
import { NetworkNode, NetworkLink, processNetworkData } from '@/utils/networkGraphUtils';
import { Note } from '@/types/graph';
import * as d3 from 'd3';
import SpriteText from 'three-spritetext';
import * as THREE from 'three';

interface Network3DGraphProps {
  notes: Note[];
}

export const Network3DGraph = ({ notes }: Network3DGraphProps) => {
  const fgRef = useRef<ForceGraphMethods>();
  
  // Memoize graph data processing
  const graphData = useMemo(() => processNetworkData(notes), [notes]);
  const { nodes, links } = graphData;

  // Optimize force simulation
  useEffect(() => {
    requestAnimationFrame(() => {
      const fg = fgRef.current;
      if (!fg) return;

      const simulation = fg.d3Force('simulation');
      if (!simulation) return;

      // Optimize force parameters
      simulation
        .force('link', d3.forceLink().id((d: any) => d.id)
          .distance(25)
          .strength(0.3))
        .force('charge', d3.forceManyBody()
          .strength(-8)
          .distanceMax(150))
        .force('center', d3.forceCenter()
          .strength(0.05))
        .force('collision', d3.forceCollide()
          .radius(5)
          .strength(0.2)
          .iterations(1));

      // Add optimized sphere boundary force
      simulation.force('sphere', () => {
        const targetRadius = 50;
        nodes.forEach((node: any) => {
          const distSq = node.x * node.x + node.y * node.y + node.z * node.z;
          if (distSq === 0) return;
          
          const dist = Math.sqrt(distSq);
          const scale = targetRadius / dist;
          
          node.x *= scale;
          node.y *= scale;
          node.z *= scale;
        });
      });

      // Reduce initial movement
      simulation.alpha(0.3).alphaDecay(0.02);
    });
  }, [nodes]);

  // Memoize node drag handler
  const handleNodeDragEnd = useCallback((node: any) => {
    node.fx = node.x;
    node.fy = node.y;
    node.fz = node.z;
  }, []);

  // Memoize node object creation
  const createNodeObject = useCallback((node: any) => {
    if (node.type === 'note') {
      const group = new THREE.Group();
      
      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(3),
        new THREE.MeshLambertMaterial({ color: '#EF7234' })
      );
      group.add(sphere);
      
      const sprite = new SpriteText(node.name);
      sprite.color = '#ffffff';
      sprite.textHeight = 2;
      sprite.backgroundColor = 'rgba(0,0,0,0.5)';
      sprite.padding = 1;
      sprite.borderRadius = 2;
      
      sprite.position.set(4, 0, 0);
      group.add(sprite);
      
      return group;
    } else if (node.type === 'tag') {
      return new THREE.Mesh(
        new THREE.SphereGeometry(1.5),
        new THREE.MeshLambertMaterial({ color: '#E0E0D7' })
      );
    }
    return null;
  }, []);

  return (
    <div className="w-full h-full">
      <ForceGraph3D
        ref={fgRef}
        graphData={{ nodes, links }}
        nodeLabel={(node: any) => node.name}
        nodeThreeObject={createNodeObject}
        nodeColor={(node: any) => node.type === 'note' ? '#EF7234' : '#E0E0D7'}
        backgroundColor="#1B1B1F"
        linkColor={() => "#8E9196"}
        linkWidth={0.2}
        linkDirectionalParticles={0}
        enableNavigationControls={true}
        enableNodeDrag={true}
        onNodeDragEnd={handleNodeDragEnd}
        forceEngine="d3"
        cooldownTime={2000}
        cooldownTicks={100}
        warmupTicks={50}
        nodeResolution={16}
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.3}
      />
    </div>
  );
};