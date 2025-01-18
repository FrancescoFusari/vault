import { useRef } from 'react';
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

  return (
    <div className="w-full h-full">
      <ForceGraph3D
        ref={fgRef}
        graphData={{ nodes, links }}
        nodeLabel={(node: any) => node.name}
        nodeColor={(node: any) => node.type === 'note' ? '#60a5fa' : '#f59e0b'}
        backgroundColor="hsl(229 19% 12%)"
        // Increase node spacing significantly
        dagLevelDistance={500}
        // Ensure all nodes are included in layout
        dagNodeFilter={(node: any) => true}
        // Reduce link width for cleaner appearance
        linkWidth={0.5}
        // Add subtle particle effect on links
        linkDirectionalParticles={1}
        linkDirectionalParticleWidth={0.2}
        // Enable navigation and interaction
        enableNavigationControls={true}
        enableNodeDrag={true}
        // Increase force strength and cooling
        cooldownTicks={200}
        // Use d3 force engine for better control
        forceEngine="d3"
        d3Force={(force) => {
          // Increase repulsion between nodes
          force.charge().strength(-150);
          // Set larger link distance
          force.link().distance(200);
        }}
      />
    </div>
  );
};