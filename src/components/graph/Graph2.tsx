import { useEffect, useRef, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { useTheme } from 'next-themes';
import * as d3 from 'd3';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { useGraphDimensions } from '@/hooks/useGraphDimensions';
import { processGraphData } from '@/utils/graphUtils';
import { getNodeColor, calculateNodeSize } from '@/utils/graphNodeUtils';
import { GraphNode, GraphData, Note } from '@/types/graph';

interface Graph2Props {
  notes: Note[];
  highlightedNoteId?: string;
}

export const Graph2 = ({ notes, highlightedNoteId }: Graph2Props) => {
  const graphRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { toast } = useToast();
  const dimensions = useGraphDimensions(containerRef, false);
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const data = processGraphData(notes, highlightedNoteId, theme, false);
    
    // Enhanced node sizing based on connections
    data.nodes = data.nodes.map(node => {
      const connectionCount = data.links.filter(
        link => link.source === node.id || link.target === node.id
      ).length;
      return {
        ...node,
        val: calculateNodeSize(connectionCount)
      };
    });

    setGraphData(data);

    // Initial layout setup
    if (graphRef.current && data.nodes.length > 0 && !isInitialized) {
      const fg = graphRef.current;
      
      // Create a radial layout
      const radius = Math.min(dimensions.width, dimensions.height) / 3;
      const angleStep = (2 * Math.PI) / data.nodes.length;
      
      // Position nodes in a circle
      data.nodes.forEach((node, i) => {
        const angle = i * angleStep;
        const x = radius * Math.cos(angle);
        const y = radius * Math.sin(angle);
        node.x = x;
        node.y = y;
      });

      // Custom force simulation
      fg.d3Force('charge').strength(-200);
      fg.d3Force('link').distance(100);
      fg.d3Force('center').strength(0.2);
      
      // Add radial force
      fg.d3Force('radial', d3.forceRadial(radius, dimensions.width / 2, dimensions.height / 2).strength(0.1));

      setTimeout(() => {
        fg.zoomToFit(400, 10);
        setIsInitialized(true);
      }, 300);
    }
  }, [notes, highlightedNoteId, theme, dimensions.width, dimensions.height, isInitialized]);

  const handleNodeClick = (node: GraphNode) => {
    if (node.type === 'note') {
      navigate(`/note/${node.id}`);
    } else {
      toast({
        title: `${node.type === 'category' ? 'Category' : 'Tag'}: ${node.name}`,
        description: `Connected to ${
          graphData.links.filter(link => 
            link.source === node.id || link.target === node.id
          ).length
        } notes`,
      });
    }
  };

  return (
    <div 
      ref={containerRef} 
      className="w-full border rounded-lg overflow-hidden bg-background relative"
      style={{ height: dimensions.height }}
    >
      <ForceGraph2D
        ref={graphRef}
        graphData={graphData}
        nodeLabel="name"
        nodeRelSize={8}
        linkWidth={2}
        minZoom={0.5}
        maxZoom={8}
        enableZoomInteraction={true}
        enablePanInteraction={true}
        nodeColor={(node: any) => getNodeColor(node as GraphNode, highlightedNoteId, theme)}
        linkColor={() => theme === 'dark' ? '#334155' : '#cbd5e1'}
        onNodeClick={handleNodeClick}
        backgroundColor={theme === 'dark' ? '#1e293b' : '#f8fafc'}
        width={dimensions.width}
        height={dimensions.height}
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.3}
        cooldownTime={2000}
        onEngineStop={() => {
          if (!isInitialized) {
            graphRef.current?.zoomToFit(400);
          }
        }}
        linkDirectionalParticles={2}
        linkDirectionalParticleWidth={2}
        linkDirectionalParticleSpeed={0.005}
      />
    </div>
  );
};