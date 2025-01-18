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
  const handleEngineStop = useCallback(() => {
    fgRef.current.zoomToFit(400);
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
        onEngineStop={handleEngineStop}
        // Force simulation configuration
        forceEngine="d3"
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.3}
        warmupTicks={100}
        cooldownTicks={1000}
        // Configure forces using onEngineInitialized
        onEngineInitialized={force => {
          // Link force for connection strength
          force.d3Force('link')
            .distance(() => 100);
          
          // Charge force for node repulsion
          force.d3Force('charge')
            .strength(-120)
            .distanceMax(250);
          
          // Center force to keep graph centered
          force.d3Force('center')
            .strength(0.3);
          
          // Add collision force to prevent node overlap
          force.d3Force('collision')
            .radius(() => 20)
            .strength(0.7);

          // X and Y forces for better spread
          force.d3Force('x').strength(0.1);
          force.d3Force('y').strength(0.1);
        }}
      />
    </div>
  );
};
