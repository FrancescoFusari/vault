import { useEffect, useRef, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { useTheme } from 'next-themes';
import { useIsMobile } from '@/hooks/use-mobile';

interface Node {
  id: string;
  name: string;
  val: number;
  type: 'note' | 'category' | 'tag';
  color?: string;
}

interface Link {
  source: string;
  target: string;
}

interface GraphData {
  nodes: Node[];
  links: Link[];
}

interface NoteGraphProps {
  notes: Array<{
    id: string;
    content: string;
    category: string;
    tags: string[];
  }>;
}

export const NoteGraph = ({ notes }: NoteGraphProps) => {
  const graphRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const isMobile = useIsMobile();
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  const processDataForGraph = (): GraphData => {
    const nodes: Node[] = [];
    const links: Link[] = [];
    const nodeSet = new Set<string>();

    notes.forEach(note => {
      if (!nodeSet.has(note.id)) {
        nodes.push({
          id: note.id,
          name: note.content.substring(0, isMobile ? 20 : 30) + '...',
          val: isMobile ? 1.5 : 2,
          type: 'note',
          color: theme === 'dark' ? '#94a3b8' : '#475569'
        });
        nodeSet.add(note.id);
      }

      if (!nodeSet.has(note.category)) {
        nodes.push({
          id: note.category,
          name: note.category,
          val: isMobile ? 2 : 3,
          type: 'category',
          color: theme === 'dark' ? '#f59e0b' : '#d97706'
        });
        nodeSet.add(note.category);
      }
      links.push({ source: note.id, target: note.category });

      note.tags.forEach(tag => {
        if (!nodeSet.has(tag)) {
          nodes.push({
            id: tag,
            name: tag,
            val: isMobile ? 1.2 : 1.5,
            type: 'tag',
            color: theme === 'dark' ? '#22c55e' : '#16a34a'
          });
          nodeSet.add(tag);
        }
        links.push({ source: note.id, target: tag });
      });
    });

    return { nodes, links };
  };

  useEffect(() => {
    if (graphRef.current) {
      // Adjust force parameters based on device
      graphRef.current.d3Force('charge').strength(isMobile ? -100 : -150);
      graphRef.current.d3Force('link').distance(isMobile ? 60 : 100);
    }
  }, [isMobile]);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width } = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: width,
          height: isMobile ? 400 : 600
        });
      }
    };

    // Initial dimensions
    updateDimensions();

    // Update dimensions on resize
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [isMobile]);

  const graphData = processDataForGraph();

  return (
    <div 
      ref={containerRef} 
      className="w-full border rounded-lg overflow-hidden bg-background"
      style={{ height: dimensions.height }}
    >
      <ForceGraph2D
        ref={graphRef}
        graphData={graphData}
        nodeLabel="name"
        nodeColor={node => (node as Node).color || '#666'}
        nodeRelSize={isMobile ? 4 : 6}
        linkColor={() => theme === 'dark' ? '#334155' : '#cbd5e1'}
        backgroundColor={theme === 'dark' ? '#1e293b' : '#f8fafc'}
        width={dimensions.width}
        height={dimensions.height}
        cooldownTicks={isMobile ? 50 : 100}
        onEngineStop={() => {
          // Ensure graph is centered after initial render
          graphRef.current?.zoomToFit(400, 50);
        }}
      />
    </div>
  );
};