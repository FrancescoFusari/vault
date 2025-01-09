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

interface MobileNoteGraphProps {
  notes: Note[];
  highlightedNoteId?: string;
}

export const MobileNoteGraph = ({ notes, highlightedNoteId }: MobileNoteGraphProps) => {
  const graphRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const { toast } = useToast();
  const dimensions = useGraphDimensions(containerRef, true);
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);

  useEffect(() => {
    const data = processGraphData(notes, highlightedNoteId, theme, true);
    
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
  }, [notes, highlightedNoteId, theme]);

  useEffect(() => {
    if (graphRef.current) {
      graphRef.current.d3Force('charge').strength(-150);
      graphRef.current.d3Force('link').distance(60);
      graphRef.current.d3Force('collision', d3.forceCollide(25));
      
      setTimeout(() => {
        graphRef.current.zoomToFit(400, 10);
      }, 100);
    }
  }, []);

  const handleNodeClick = (node: GraphNode) => {
    if (node.type === 'note') {
      setSelectedNode(node);
      setPopoverOpen(true);
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

  const getSelectedNote = () => {
    if (!selectedNode || selectedNode.type !== 'note') return null;
    return notes.find(note => note.id === selectedNode.id);
  };

  return (
    <div 
      ref={containerRef} 
      className="w-full border rounded-lg overflow-hidden bg-background relative touch-pan-y touch-pinch-zoom"
      style={{ height: dimensions.height }}
    >
      <ForceGraph2D
        ref={graphRef}
        graphData={graphData}
        nodeLabel="name"
        nodeRelSize={6}
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
        cooldownTicks={50}
        onEngineStop={() => {
          graphRef.current?.zoomToFit(400, 10);
        }}
      />
      {selectedNode && selectedNode.type === 'note' && (
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          {(() => {
            const note = getSelectedNote();
            if (!note) return null;
            return (
              <NotePopover 
                note={note} 
                onClose={() => setPopoverOpen(false)} 
              />
            );
          })()}
        </Popover>
      )}
    </div>
  );
};