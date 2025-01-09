import { useEffect, useRef, useState, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { useTheme } from 'next-themes';
import * as d3 from 'd3';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { useGraphDimensions } from '@/hooks/useGraphDimensions';
import { processGraphData, getNodeColor, getLinkColor, getLinkWidth } from '@/utils/graphUtils';
import { GraphNode, GraphData, Note } from '@/types/graph';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "@radix-ui/react-icons";
import { Badge } from "@/components/ui/badge";

interface NoteGraphProps {
  notes: Note[];
  highlightedNoteId?: string;
}

export const NoteGraph = ({ notes, highlightedNoteId }: NoteGraphProps) => {
  const graphRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { toast } = useToast();
  const dimensions = useGraphDimensions(containerRef, isMobile);
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);

  const handleNodeClick = useCallback((node: GraphNode) => {
    if (isMobile) {
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
          } nodes`,
        });
      }
    } else {
      if (node.type === 'note') {
        navigate(`/note/${node.id}`);
      } else {
        toast({
          title: `${node.type === 'category' ? 'Category' : 'Tag'}: ${node.name}`,
          description: `Connected to ${
            graphData.links.filter(link => 
              link.source === node.id || link.target === node.id
            ).length
          } nodes`,
        });
      }
    }
  }, [navigate, toast, graphData.links, isMobile]);

  useEffect(() => {
    if (graphRef.current) {
      graphRef.current.d3Force('charge').strength(isMobile ? -200 : -300);
      graphRef.current.d3Force('link').distance(isMobile ? 80 : 120);
      graphRef.current.d3Force('collision', d3.forceCollide(isMobile ? 20 : 30));
    }
  }, [isMobile]);

  useEffect(() => {
    setGraphData(processGraphData(notes, highlightedNoteId, theme, isMobile));
  }, [notes, highlightedNoteId, theme, isMobile]);

  useEffect(() => {
    if (highlightedNoteId && graphRef.current) {
      const node = graphData.nodes.find((n: GraphNode) => n.id === highlightedNoteId);
      if (node) {
        graphRef.current.centerAt(node.x, node.y, 1000);
        graphRef.current.zoom(isMobile ? 2 : 2.5, 1000);
      }
    }
  }, [highlightedNoteId, graphData, isMobile]);

  const getSelectedNote = () => {
    if (!selectedNode || selectedNode.type !== 'note') return null;
    return notes.find(note => note.id === selectedNode.id);
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
        nodeColor={node => getNodeColor(node as GraphNode, hoveredNode, graphData, theme)}
        nodeRelSize={isMobile ? 8 : 6}
        linkColor={link => getLinkColor(link, hoveredNode, theme)}
        linkWidth={link => getLinkWidth(link, hoveredNode)}
        onNodeClick={handleNodeClick}
        onNodeHover={setHoveredNode}
        backgroundColor={theme === 'dark' ? '#1e293b' : '#f8fafc'}
        width={dimensions.width}
        height={dimensions.height}
        cooldownTicks={isMobile ? 50 : 100}
        onEngineStop={() => {
          graphRef.current?.zoomToFit(400, 50);
        }}
        minZoom={isMobile ? 1 : 0.5}
        maxZoom={isMobile ? 4 : 8}
      />
      {isMobile && selectedNode && selectedNode.type === 'note' && (
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverContent className="w-80">
            {(() => {
              const note = getSelectedNote();
              if (!note) return null;
              return (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-medium">
                      {note.tags[0] || note.content.split('\n')[0].substring(0, 50) + (note.content.length > 50 ? '...' : '')}
                    </h3>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <CalendarIcon className="mr-1 h-4 w-4" />
                      {new Date(note.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {note.tags.slice(1).map(tag => (
                      <Badge 
                        key={tag}
                        variant="outline"
                        className="text-xs"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <Button 
                    className="w-full"
                    onClick={() => {
                      setPopoverOpen(false);
                      navigate(`/note/${note.id}`);
                    }}
                  >
                    View Note
                  </Button>
                </div>
              );
            })()}
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
};