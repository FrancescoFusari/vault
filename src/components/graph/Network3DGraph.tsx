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
        // Increase distance between graph levels for better spacing
        dagLevelDistance={800}
        // Increase node spacing
        nodeRelSize={8}
        // Reduce link width
        linkWidth={0.3}
        // Customize link appearance
        linkOpacity={0.4}
        // Enable navigation controls
        enableNavigationControls={true}
        // Enable node dragging
        enableNodeDrag={true}
        // Increase cooldown ticks for better stabilization
        cooldownTicks={200}
        // Increase link particle effect but make them smaller
        linkDirectionalParticles={2}
        linkDirectionalParticleWidth={0.2}
        linkDirectionalParticleSpeed={0.006}
      />
    </div>
  );
};