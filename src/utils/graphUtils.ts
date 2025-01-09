import { GraphData, GraphNode, GraphLink, Note } from "@/types/graph";

export const processGraphData = (
  notes: Note[], 
  highlightedNoteId?: string,
  theme?: string,
  isMobile?: boolean
): GraphData => {
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];
  const nodeSet = new Set<string>();

  notes.forEach(note => {
    if (!nodeSet.has(note.id)) {
      nodes.push({
        id: note.id,
        name: note.tags[0] || note.content.substring(0, isMobile ? 20 : 30) + '...',
        val: isMobile ? 1.5 : 2,
        type: 'note',
        color: note.id === highlightedNoteId 
          ? '#f43f5e' 
          : theme === 'dark' ? '#94a3b8' : '#475569'
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

export const getNodeColor = (
  node: GraphNode,
  hoveredNode: GraphNode | null,
  graphData: GraphData,
  theme: string
): string => {
  if (hoveredNode) {
    const isConnected = graphData.links.some(
      link => 
        (link.source === hoveredNode.id && link.target === node.id) ||
        (link.target === hoveredNode.id && link.source === node.id)
    );
    if (node.id === hoveredNode.id) return node.color || '';
    return isConnected ? node.color || '' : theme === 'dark' ? '#1e293b' : '#f8fafc';
  }
  return node.color || '';
};

export const getLinkColor = (
  link: GraphLink,
  hoveredNode: GraphNode | null,
  theme: string
): string => {
  if (hoveredNode) {
    const isConnected = 
      link.source === hoveredNode.id || 
      link.target === hoveredNode.id;
    return isConnected 
      ? theme === 'dark' ? '#94a3b8' : '#475569'
      : theme === 'dark' ? '#334155' : '#cbd5e1';
  }
  return theme === 'dark' ? '#334155' : '#cbd5e1';
};

export const getLinkWidth = (
  link: GraphLink,
  hoveredNode: GraphNode | null
): number => {
  if (hoveredNode) {
    const isConnected = 
      link.source === hoveredNode.id || 
      link.target === hoveredNode.id;
    return isConnected ? 2 : 1;
  }
  return 1;
};
