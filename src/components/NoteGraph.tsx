import { useEffect, useRef } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { useTheme } from 'next-themes';

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
  const { theme } = useTheme();

  const processDataForGraph = (): GraphData => {
    const nodes: Node[] = [];
    const links: Link[] = [];
    const nodeSet = new Set<string>();

    // Add notes as nodes
    notes.forEach(note => {
      if (!nodeSet.has(note.id)) {
        nodes.push({
          id: note.id,
          name: note.content.substring(0, 30) + '...',
          val: 2,
          type: 'note',
          color: theme === 'dark' ? '#94a3b8' : '#475569'
        });
        nodeSet.add(note.id);
      }

      // Add category and create link
      if (!nodeSet.has(note.category)) {
        nodes.push({
          id: note.category,
          name: note.category,
          val: 3,
          type: 'category',
          color: theme === 'dark' ? '#f59e0b' : '#d97706'
        });
        nodeSet.add(note.category);
      }
      links.push({ source: note.id, target: note.category });

      // Add tags and create links
      note.tags.forEach(tag => {
        if (!nodeSet.has(tag)) {
          nodes.push({
            id: tag,
            name: tag,
            val: 1.5,
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
      graphRef.current.d3Force('charge').strength(-150);
      graphRef.current.d3Force('link').distance(100);
    }
  }, []);

  const graphData = processDataForGraph();

  return (
    <div className="w-full h-[600px] border rounded-lg overflow-hidden bg-background">
      <ForceGraph2D
        ref={graphRef}
        graphData={graphData}
        nodeLabel="name"
        nodeColor={node => (node as Node).color || '#666'}
        nodeRelSize={6}
        linkColor={() => theme === 'dark' ? '#334155' : '#cbd5e1'}
        backgroundColor={theme === 'dark' ? '#1e293b' : '#f8fafc'}
        width={800}
        height={600}
      />
    </div>
  );
};