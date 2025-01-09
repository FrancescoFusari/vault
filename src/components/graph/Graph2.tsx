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
import { Popover } from "@/components/ui/popover";
import { NotePopover } from './NotePopover';

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
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const data = processGraphData(notes, highlightedNoteId, theme, false);
    
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

    if (graphRef.current && data.nodes.length > 0 && !isInitialized) {
      setTimeout(() => {
        graphRef.current.zoomToFit(400, 10);
        setIsInitialized(true);
      }, 300);
    }
  }, [notes, highlightedNoteId, theme, isInitialized]);

  useEffect(() => {
    if (graphRef.current) {
      graphRef.current.d3Force('charge').strength(-150);
      graphRef.current.d3Force('link').distance(80);
      graphRef.current.d3Force('collision', d3.forceCollide(30));
    }
  }, []);

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
        linkWidth={1.5}
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
        d3AlphaDecay={0.01}
        d3VelocityDecay={0.4}
      />
    </div>
  );
};