import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { useTheme } from 'next-themes';
import * as d3 from 'd3';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { useGraphDimensions } from '@/hooks/useGraphDimensions';
import { processGraphData } from '@/utils/graphUtils';
import { GraphNode, GraphData, Note } from '@/types/graph';
import { Popover, PopoverContent } from "@/components/ui/popover";
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
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);

  // Memoize graph data processing
  const graphData = useMemo(() => {
    const data = processGraphData(notes, highlightedNoteId, theme);
    const nodeConnections = new Map();
    
    data.links.forEach(link => {
      nodeConnections.set(link.source, (nodeConnections.get(link.source) || 0) + 1);
      nodeConnections.set(link.target, (nodeConnections.get(link.target) || 0) + 1);
    });

    data.nodes = data.nodes.map(node => ({
      ...node,
      val: Math.max(2, Math.min(5, 1 + (nodeConnections.get(node.id) || 0) * 0.5))
    }));

    return data;
  }, [notes, highlightedNoteId, theme]);

  // Optimize force simulation
  useEffect(() => {
    if (!graphRef.current) return;

    const fg = graphRef.current;
    
    // Optimize force parameters
    fg.d3Force('charge')
      .strength(-100)
      .distanceMax(200);

    fg.d3Force('link')
      .distance(40)
      .strength(0.2);

    fg.d3Force('collision')
      .radius(20)
      .strength(0.7)
      .iterations(1);

    fg.d3Force('center')
      .strength(0.05);

    // Delayed zoom fit for better performance
    const timer = setTimeout(() => {
      fg.zoomToFit(250, 10);
    }, 250);

    return () => {
      clearTimeout(timer);
      fg.pauseAnimation();
    };
  }, []);

  // Memoize node click handler
  const handleNodeClick = useCallback((node: GraphNode) => {
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
  }, [graphData.links, toast]);

  // Memoize selected note getter
  const getSelectedNote = useCallback(() => {
    if (!selectedNode || selectedNode.type !== 'note') return null;
    return notes.find(note => note.id === selectedNode.id);
  }, [selectedNode, notes]);

  // Memoize node color getter
  const getNodeColor = useCallback((node: GraphNode) => {
    if (node.id === highlightedNoteId) return '#f43f5e';
    switch (node.type) {
      case 'note': return theme === 'dark' ? '#94a3b8' : '#475569';
      case 'category': return theme === 'dark' ? '#f59e0b' : '#d97706';
      case 'tag': return theme === 'dark' ? '#22c55e' : '#16a34a';
    }
  }, [highlightedNoteId, theme]);

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
        linkWidth={1}
        minZoom={0.5}
        maxZoom={8}
        enableZoomInteraction={true}
        enablePanInteraction={true}
        nodeColor={getNodeColor}
        linkColor={() => theme === 'dark' ? '#334155' : '#cbd5e1'}
        onNodeClick={handleNodeClick}
        backgroundColor={theme === 'dark' ? '#1e293b' : '#f8fafc'}
        width={dimensions.width}
        height={dimensions.height}
        cooldownTicks={50}
        cooldownTime={2000}
        onEngineStop={() => {
          graphRef.current?.zoomToFit(250, 10);
        }}
        warmupTicks={20}
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.3}
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