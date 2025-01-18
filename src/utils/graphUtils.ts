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
      // Add value property to match Link interface
      links.push({ 
        source: note.id, 
        target: tag,
        value: 1 // Default link value
      });
    });
  });

  return { nodes, links };
};