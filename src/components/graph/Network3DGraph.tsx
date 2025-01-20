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

  // Initialize graph with mobile-optimized settings
  useEffect(() => {
    const fg = fgRef.current;
    if (!fg) return;

    // Reset camera and controls
    fg.pauseAnimation();
    fg.cameraPosition({ x: 0, y: 0, z: isMobile ? 200 : 150 });
    
    // Mobile-optimized force parameters
    const forceStrength = isMobile ? -20 : -30;
    const distanceMax = isMobile ? 150 : 200;
    const linkDistance = isMobile ? 30 : 40;
    
    fg.d3Force('link')?.distance(linkDistance).strength(0.2);
    fg.d3Force('charge')?.strength(forceStrength).distanceMax(distanceMax);
    fg.d3Force('center')?.strength(0.1);
    
    fg.d3Force('collision', d3.forceCollide()
      .radius(isMobile ? 3 : 5)
      .strength(0.7)
      .iterations(isMobile ? 1 : 2)
    );

    // Resume animation after settings are applied
    setTimeout(() => {
      fg.resumeAnimation();
    }, 100);

    return () => {
      if (fg) {
        fg.pauseAnimation();
      }
    };
  }, [isMobile]);

  // Memoize node object creation
  const createNodeObject = useCallback((node: NetworkNode) => {
    if (node.type === 'note') {
      const group = new THREE.Group();
      
      const sphereGeometry = new THREE.SphiteGeometry(isMobile ? 2 : 3);
      const sphere = new THREE.Mesh(
        sphereGeometry,
        new THREE.MeshLambertMaterial({ 
          color: '#EF7234',
          transparent: true,
          opacity: 0.8
        })
      );
      group.add(sphere);
      
      // Add text sprites for both mobile and desktop
      const sprite = new SpriteText(node.name);
      sprite.color = '#ffffff';
      sprite.textHeight = isMobile ? 1.5 : 2;
      sprite.backgroundColor = 'rgba(0,0,0,0.5)';
      sprite.padding = isMobile ? 0.5 : 1;
      sprite.borderRadius = 2;
      
      // Create a new Vector3 for position
      const spritePosition = new THREE.Vector3(4, 0, 0);
      sprite.position.copy(spritePosition);
      
      group.add(sprite);
      
      return group;
    } else if (node.type === 'tag') {
      const group = new THREE.Group();
      
      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(isMobile ? 1.2 : 1.5),
        new THREE.MeshLambertMaterial({ 
          color: '#E0E0D7',
          transparent: true,
          opacity: 0.6
        })
      );
      group.add(sphere);
      
      // Add smaller text sprites for tags
      const sprite = new SpriteText(node.name);
      sprite.color = '#E0E0D7';
      sprite.textHeight = isMobile ? 1 : 1.5;
      sprite.backgroundColor = 'rgba(0,0,0,0.3)';
      sprite.padding = isMobile ? 0.3 : 0.5;
      sprite.borderRadius = 1;
      
      // Create a new Vector3 for position
      const spritePosition = new THREE.Vector3(3, 0, 0);
      sprite.position.copy(spritePosition);
      
      group.add(sprite);
      
      return group;
    }
    return null;
  }, [isMobile]);

  // Handle node drag
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
          antialias: !isMobile,
          alpha: true,
          powerPreference: 'high-performance'
        }}
      />
    </div>
  );
};