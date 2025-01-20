import { useEffect, useCallback, useMemo } from 'react';
import ForceGraph3D, { ForceGraphMethods } from 'react-force-graph-3d';
import { NetworkNode, NetworkLink, processNetworkData } from '@/utils/networkGraphUtils';
import { Note } from '@/types/graph';
import * as d3 from 'd3';
import SpriteText from 'three-spritetext';
import * as THREE from 'three';
import { useIsMobile } from '@/hooks/use-mobile';
import { MutableRefObject } from 'react';

interface Network3DGraphProps {
  notes: Note[];
  graphRef: MutableRefObject<ForceGraphMethods | undefined>;
}

export const Network3DGraph = ({ notes, graphRef }: Network3DGraphProps) => {
  const isMobile = useIsMobile();
  
  // Memoize graph data processing
  const graphData = useMemo(() => processNetworkData(notes), [notes]);
  const { nodes, links } = graphData;

  // Initialize graph with mobile-optimized settings
  useEffect(() => {
    const fg = graphRef.current;
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
  }, [isMobile, graphRef]);

  // Memoize node object creation
  const createNodeObject = useCallback((node: NetworkNode) => {
    const sprite = new SpriteText(node.name);
    sprite.color = '#ffffff';
    sprite.textHeight = isMobile ? 3 : 2;
    sprite.backgroundColor = node.type === 'note' ? 'rgba(239,114,52,0.8)' : 'rgba(224,224,215,0.6)';
    sprite.padding = 1;
    sprite.borderRadius = 2;

    return sprite;
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
        ref={graphRef}
        graphData={{ nodes, links }}
        nodeLabel={(node: NetworkNode) => node.name}
        nodeThreeObject={createNodeObject}
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