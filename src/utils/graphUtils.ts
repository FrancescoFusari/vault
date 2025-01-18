import { GraphData, GraphNode, GraphLink, Note } from "@/types/graph";

export const processGraphData = (
  notes: Note[], 
  highlightedNoteId?: string,
  theme?: string
): GraphData => {
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];
  const nodeSet = new Set<string>();

  // Create nodes for notes and their tags
  notes.forEach(note => {
    // Add note node if it doesn't exist
    if (!nodeSet.has(note.id)) {
      nodes.push({
        id: note.id,
        name: note.tags[0] || note.content.substring(0, 30) + '...',
        val: 2,
        type: 'note',
      });
      nodeSet.add(note.id);
    }

    // Add tag nodes and create links
    note.tags.forEach(tag => {
      if (!nodeSet.has(tag)) {
        nodes.push({
          id: tag,
          name: tag,
          val: 1.5,
          type: 'tag',
        });
        nodeSet.add(tag);
      }
      links.push({ source: note.id, target: tag });
    });
  });

  return { nodes, links };
};

export const getNodeColor = (node: GraphNode, theme: string): string => {
  if (node.type === 'note') {
    return theme === 'dark' ? '#94a3b8' : '#475569';
  }
  return theme === 'dark' ? '#22c55e' : '#16a34a';
};