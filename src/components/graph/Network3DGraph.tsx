import { useRef, useCallback } from 'react';
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

  // Configure force simulation
  const handleEngineInitialized = useCallback((engine: any) => {
    // Add forces similar to the D3 example
    engine
      .d3Force('link')
      .distance(link => 30 + 20 * Math.sqrt(link.value || 1))
      .strength(1);

    engine
      .d3Force('charge')
      .strength(-100)
      .distanceMax(200);

    engine
      .d3Force('center')
      .strength(0.1);

    engine
      .d3Force('collision')
      .radius(node => Math.sqrt((node as NetworkNode).value || 1) * 5)
      .strength(0.7);

    // Add X and Y positioning forces
    engine
      .d3Force('x', d3.forceX())
      .strength(0.05);

    engine
      .d3Force('y', d3.forceY())
      .strength(0.05);

    // Set alpha target for continuous simulation
    engine.d3AlphaTarget(0);
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
        onEngineInitialized={handleEngineInitialized}
        cooldownTime={Infinity}
        nodeResolution={32}
      />
    </div>
  );
};