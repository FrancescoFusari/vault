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
        linkWidth={0.3}
        linkDirectionalParticles={1}
        linkDirectionalParticleWidth={0.2}
        enableNavigationControls={true}
        enableNodeDrag={true}
        forceEngine="d3"
        d3Force={(force) => {
          force.link()
            .distance(200)
            .strength(0.7);

          force.charge()
            .strength(-120)
            .distanceMax(300);

          force.center()
            .strength(0.05);

          force.force('collision', d3.forceCollide()
            .radius(10)
            .strength(0.7)
          );

          force.force('x', d3.forceX()
            .strength(0.02)
          );
          force.force('y', d3.forceY()
            .strength(0.02)
          );
        }}
        warmupTicks={100}
        cooldownTicks={50}
        cooldownTime={3000}
      />
    </div>
  );
};
