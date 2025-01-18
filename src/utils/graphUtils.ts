import { GraphData, GraphNode, GraphLink, Note } from "@/types/graph";

export const processGraphData = (
  notes: Note[], 
  highlightedNoteId?: string,
  theme?: string
): GraphData => {
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];
  const nodeSet = new Set<string>();
  const nodeMap = new Map<string, GraphNode>();

  // Process notes in a single pass
  notes.forEach(note => {
    if (!nodeSet.has(note.id)) {
      const noteNode: GraphNode = {
        id: note.id,
        name: note.tags[0] || note.content.substring(0, 30) + '...',
        val: 2,
        type: 'note',
      };
      nodes.push(noteNode);
      nodeSet.add(note.id);
      nodeMap.set(note.id, noteNode);
    }

    // Process tags in the same loop
    note.tags.forEach(tag => {
      if (!nodeSet.has(tag)) {
        const tagNode: GraphNode = {
          id: tag,
          name: tag,
          val: 1.5,
          type: 'tag',
        };
        nodes.push(tagNode);
        nodeSet.add(tag);
        nodeMap.set(tag, tagNode);
      }
      links.push({ source: note.id, target: tag });
    });
  });

  return { nodes, links };
};