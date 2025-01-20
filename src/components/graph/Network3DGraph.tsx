import { useRef, useEffect, useCallback, useMemo } from 'react';
import ForceGraph3D, { ForceGraphMethods } from 'react-force-graph-3d';
import { NetworkNode, NetworkLink, processNetworkData } from '@/utils/networkGraphUtils';
import { Note } from '@/types/graph';
import * as d3 from 'd3';
import SpriteText from 'three-spritetext';
import * as THREE from 'three';
import { useIsMobile } from '@/hooks/use-mobile';

interface Network3DGraphProps {
  notes: Note[];
}

export const Network3DGraph = ({ notes }: Network3DGraphProps) => {
  const fgRef = useRef<ForceGraphMethods>();
  const isMobile = useIsMobile();
  
  // Memoize graph data processing
  const graphData = useMemo(() => processNetworkData(notes), [notes]);
  const { nodes, links } = graphData;

  // Optimize force simulation
  useEffect(() => {
    requestAnimationFrame(() => {
      const fg = fgRef.current;
      if (!fg) return;

      // Mobile-optimized force parameters
      const forceStrength = isMobile ? -20 : -30;
      const distanceMax = isMobile ? 150 : 200;
      const linkDistance = isMobile ? 30 : 40;
      
      fg.d3Force('link')?.distance(linkDistance).strength(0.2);
      fg.d3Force('charge')?.strength(forceStrength).distanceMax(distanceMax);
      fg.d3Force('center')?.strength(0.02);

      // Optimized collision detection for mobile
      fg.d3Force('collision', d3.forceCollide()
        .radius(isMobile ? 6 : 8)
        .strength(0.5)
        .iterations(isMobile ? 1 : 2));

      // Smoother camera transition
      fg.cameraPosition({ z: isMobile ? 120 : 150 }, { x: 0, y: 0, z: 0 }, 1000);
    });

    return () => {
      if (fgRef.current) {
        fgRef.current.pauseAnimation();
      }
    };
  }, [isMobile]);

  // Memoize node object creation with mobile optimizations
  const createNodeObject = useCallback((node: NetworkNode) => {
    if (node.type === 'note') {
      const group = new THREE.Group();
      
      // Simplified geometry for mobile
      const sphereGeometry = new THREE.SphereGeometry(isMobile ? 2 : 3);
      const sphere = new THREE.Mesh(
        sphereGeometry,
        new THREE.MeshLambertMaterial({ 
          color: '#EF7234',
          transparent: true,
          opacity: 0.8
        })
      );
      group.add(sphere);
      
      // Only add text sprites on non-mobile or for hovered nodes
      if (!isMobile) {
        const sprite = new SpriteText(node.name);
        sprite.color = '#ffffff';
        sprite.textHeight = 2;
        sprite.backgroundColor = 'rgba(0,0,0,0.5)';
        sprite.padding = 1;
        sprite.borderRadius = 2;
        group.add(sprite);
        (sprite as any).position.x = 4;
      }
      
      return group;
    } else if (node.type === 'tag') {
      return new THREE.Mesh(
        new THREE.SphereGeometry(isMobile ? 1 : 1.5),
        new THREE.MeshLambertMaterial({ 
          color: '#E0E0D7',
          transparent: true,
          opacity: 0.6
        })
      );
    }
    return null;
  }, [isMobile]);

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
        cooldownTime={isMobile ? 2000 : 1000}
        cooldownTicks={isMobile ? 200 : 100}
        warmupTicks={isMobile ? 100 : 50}
        d3AlphaDecay={isMobile ? 0.02 : 0.01}
        d3VelocityDecay={isMobile ? 0.3 : 0.2}
        rendererConfig={{
          antialias: !isMobile, // Disable antialiasing on mobile
          alpha: true,
          powerPreference: 'high-performance'
        }}
      />
    </div>
  );
};