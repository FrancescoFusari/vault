import { useEffect, useRef, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { useTheme } from 'next-themes';
import * as d3 from 'd3';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { useGraphDimensions } from '@/hooks/useGraphDimensions';
import { processGraphData } from '@/utils/graphUtils';
import { GraphNode, GraphData, Note } from '@/types/graph';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "@radix-ui/react-icons";
import { Badge } from "@/components/ui/badge";

interface MobileNoteGraphProps {
  notes: Note[];
  highlightedNoteId?: string;
}

export const MobileNoteGraph = ({ notes, highlightedNoteId }: MobileNoteGraphProps) => {
  const graphRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { toast } = useToast();
  const dimensions = useGraphDimensions(containerRef, true);
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);

  // Process graph data with emphasis on frequently connected nodes
  useEffect(() => {
    const data = processGraphData(notes, highlightedNoteId, theme, true);
    
    // Adjust node sizes based on connection count
    data.nodes = data.nodes.map(node => {
      const connectionCount = data.links.filter(
        link => link.source === node.id || link.target === node.id
      ).length;
      return {
        ...node,
        val: Math.max(2, Math.min(5, 1 + connectionCount * 0.5)) // Scale node size based on connections
      };
    });

    setGraphData(data);
  }, [notes, highlightedNoteId, theme]);

  // Initialize and configure the force graph
  useEffect(() => {
    if (graphRef.current) {
      // Optimize force simulation for mobile
      graphRef.current.d3Force('charge').strength(-150);
      graphRef.current.d3Force('link').distance(60);
      graphRef.current.d3Force('collision', d3.forceCollide(25));
      
      // Center the graph initially
      graphRef.current.zoomToFit(400, 50);
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
        minZoom={1}
        maxZoom={5}
        zoom={2}
        nodeColor={(node: any) => {
          const n = node as GraphNode;
          if (n.id === highlightedNoteId) return '#f43f5e';
          switch (n.type) {
            case 'note': return theme === 'dark' ? '#94a3b8' : '#475569';
            case 'category': return theme === 'dark' ? '#f59e0b' : '#d97706';
            case 'tag': return theme === 'dark' ? '#22c55e' : '#16a34a';
          }
        }}
        linkColor={() => theme === 'dark' ? '#334155' : '#cbd5e1'}
        onNodeClick={handleNodeClick}
        backgroundColor={theme === 'dark' ? '#1e293b' : '#f8fafc'}
        width={dimensions.width}
        height={dimensions.height}
        cooldownTicks={50}
        onEngineStop={() => {
          graphRef.current?.zoomToFit(400, 50);
        }}
      />
      {selectedNode && selectedNode.type === 'note' && (
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