import { Note } from '@/types/graph';

export interface NetworkNode {
  id: string;
  name: string;
  type: 'note' | 'tag';
  value: number;
  originalNote?: Note;
}

export interface NetworkLink {
  source: NetworkNode;
  target: NetworkNode;
  value: number;
}

export const processNetworkData = (notes: Note[]) => {
  const nodes: NetworkNode[] = [];
  const links: NetworkLink[] = [];
  const nodeMap = new Map<string, NetworkNode>();

  // Process notes and create nodes
  notes.forEach(note => {
    const noteNode: NetworkNode = {
      id: `note-${note.id}`,
      name: note.tags[0] || note.content.split('\n')[0].substring(0, 30) + '...',
      type: 'note',
      value: 2,
      originalNote: note
    };
    nodes.push(noteNode);
    nodeMap.set(noteNode.id, noteNode);

    // Create tag nodes and links
    note.tags.forEach(tag => {
      const tagId = `tag-${tag}`;
      let tagNode = nodeMap.get(tagId);
      
      if (!tagNode) {
        tagNode = {
          id: tagId,
          name: tag,
          type: 'tag',
          value: 1
        };
        nodes.push(tagNode);
        nodeMap.set(tagId, tagNode);
      }

      links.push({
        source: noteNode,
        target: tagNode,
        value: 1
      });
    });
  });

  return { nodes, links };
};