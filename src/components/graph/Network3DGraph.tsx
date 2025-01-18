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

      // Optimize force parameters
      fg.d3Force('link')?.distance(25).strength(0.3);
      fg.d3Force('charge')?.strength(-8).distanceMax(150);
      fg.d3Force('center')?.strength(0.05);

      // Add collision force
      fg.d3Force('collision', d3.forceCollide()
        .radius(5)
        .strength(0.2)
        .iterations(1));

      // Initial camera position
      fg.cameraPosition({ z: 120 });

      // Optimize performance settings
      fg.nodeResolution(8);
      fg.warmupTicks(20);
      fg.cooldownTicks(50);
      fg.cooldownTime(2000);
    });

    return () => {
      // Cleanup
      if (fgRef.current) {
        fgRef.current.pauseAnimation();
      }
    };
  }, []);

  // Memoize node object creation
  const createNodeObject = useCallback((node: NetworkNode) => {
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
      
      // Fix: Use group.add and position relative to group
      group.add(sprite);
      sprite.translateX(4);
      
      return group;
    } else if (node.type === 'tag') {
      return new THREE.Mesh(
        new THREE.SphereGeometry(1.5),
        new THREE.MeshLambertMaterial({ color: '#E0E0D7' })
      );
    }
    return null;
  }, []);

  // Memoize node drag handler
  const handleNodeDragEnd = useCallback((node: NetworkNode) => {
    node.fx = node.x;
    node.fy = node.y;
    node.fz = node.z;
  }, []);

  return (
    <div className="w-full h-full">
      <ForceGraph3D
        ref={fgRef}
        graphData={{ nodes, links }}
        nodeLabel={(node: NetworkNode) => node.name}
        nodeThreeObject={createNodeObject}
        nodeColor={(node: NetworkNode) => node.type === 'note' ? '#EF7234' : '#E0E0D7'}
        backgroundColor="#1B1B1F"
        linkColor={() => "#8E9196"}
        linkWidth={0.2}
        linkDirectionalParticles={0}
        enableNavigationControls={true}
        enableNodeDrag={true}
        onNodeDragEnd={handleNodeDragEnd}
        forceEngine="d3"
        cooldownTime={2000}
        cooldownTicks={50}
        warmupTicks={20}
        nodeResolution={8}
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.3}
      />
    </div>
  );
};