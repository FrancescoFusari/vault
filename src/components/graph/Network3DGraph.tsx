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

      // Optimize force parameters for smoother movement
      fg.d3Force('link')?.distance(40).strength(0.2);
      fg.d3Force('charge')?.strength(-30).distanceMax(200);
      fg.d3Force('center')?.strength(0.02);

      // Add collision force with optimized parameters
      fg.d3Force('collision', d3.forceCollide()
        .radius(8)
        .strength(0.5)
        .iterations(2));

      // Set initial camera position with smoother transition
      fg.cameraPosition({ z: 150 }, { x: 0, y: 0, z: 0 }, 1000);
    });

    return () => {
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
        new THREE.MeshLambertMaterial({ 
          color: '#EF7234',
          transparent: true,
          opacity: 0.8
        })
      );
      group.add(sphere);
      
      const sprite = new SpriteText(node.name);
      sprite.color = '#ffffff';
      sprite.textHeight = 2;
      sprite.backgroundColor = 'rgba(0,0,0,0.5)';
      sprite.padding = 1;
      sprite.borderRadius = 2;
      
      group.add(sprite);
      sprite.translateX(4);
      
      return group;
    } else if (node.type === 'tag') {
      return new THREE.Mesh(
        new THREE.SphereGeometry(1.5),
        new THREE.MeshLambertMaterial({ 
          color: '#E0E0D7',
          transparent: true,
          opacity: 0.6
        })
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
        cooldownTime={1000}
        cooldownTicks={100}
        warmupTicks={50}
        nodeResolution={16}
        d3AlphaDecay={0.01}
        d3VelocityDecay={0.2}
        rendererConfig={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance'
        }}
      />
    </div>
  );
};