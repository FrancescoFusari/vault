import { Note } from '@/types/graph';
import * as d3 from 'd3';

export interface NetworkNode {
  id: string;
  name: string;
  type: 'note' | 'tag';
  value: number;
  originalNote?: Note;
  x?: number;
  y?: number;
}

export interface NetworkLink {
  source: NetworkNode;
  target: NetworkNode;
  value: number;
}

export const processNetworkData = (notes: Note[]) => {
  const nodes: NetworkNode[] = [];
  const links: NetworkLink[] = [];
  const allTags = new Set<string>();
  const nodeMap = new Map<string, NetworkNode>();
  const tagUsageCount = new Map<string, number>();

  // First collect all tags and count their usage
  notes.forEach(note => {
    note.tags.forEach(tag => {
      allTags.add(tag);
      tagUsageCount.set(tag, (tagUsageCount.get(tag) || 0) + 1);
    });
  });

  // Find the maximum tag usage (with a minimum of 8 for scaling)
  const maxTagUsage = Math.max(8, ...Array.from(tagUsageCount.values()));
  console.log('Max tag usage:', maxTagUsage);

  // Create color scale for tags
  const colorScale = d3.scaleLinear<string>()
    .domain([1, maxTagUsage])
    .range(['#94a3b8', '#ef4444'])
    .interpolate(d3.interpolateHcl);

  // Add tag nodes
  Array.from(allTags).forEach(tag => {
    const tagNode: NetworkNode = {
      id: `tag-${tag}`,
      name: tag,
      type: 'tag',
      value: 2
    };
    nodes.push(tagNode);
    nodeMap.set(tagNode.id, tagNode);
  });

  // Add note nodes and links
  notes.forEach(note => {
    const noteId = `note-${note.id}`;
    const noteNode: NetworkNode = {
      id: noteId,
      name: note.tags[0] || note.content.split('\n')[0].substring(0, 30) + '...',
      type: 'note',
      value: 2,
      originalNote: note
    };
    nodes.push(noteNode);
    nodeMap.set(noteId, noteNode);

    // Create links between notes and their tags
    note.tags.forEach(tag => {
      const tagNode = nodeMap.get(`tag-${tag}`);
      if (tagNode) {
        links.push({
          source: noteNode,
          target: tagNode,
          value: 1
        });
      }
    });
  });

  return { nodes, links, tagUsageCount, colorScale };
};