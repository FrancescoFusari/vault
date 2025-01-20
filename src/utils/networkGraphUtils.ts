import { Note } from '@/types/graph';
import * as d3 from 'd3';

export interface NetworkNode {
  id: string;
  name: string;
  type: 'note' | 'tag';
  value: number;
  originalNote?: Note;
  connections?: string[];  // Add this line
  x?: number;
  y?: number;
  z?: number;
  fx?: number;
  fy?: number;
  fz?: number;
}

export interface NetworkLink {
  source: string;
  target: string;
  value: number;
}

export interface NetworkData {
  nodes: NetworkNode[];
  links: NetworkLink[];
  tagUsageCount: Map<string, number>;
  colorScale: d3.ScaleLinear<string, string>;
}

export const processNetworkData = (notes: Note[]): NetworkData => {
  const nodes: NetworkNode[] = [];
  const links: NetworkLink[] = [];
  const nodeMap = new Map<string, NetworkNode>();
  const tagUsageCount = new Map<string, number>();

  // Process notes in a single pass
  notes.forEach(note => {
    const noteNode: NetworkNode = {
      id: `note-${note.id}`,
      name: note.tags[0] || note.content.split('\n')[0].substring(0, 30) + '...',
      type: 'note',
      value: 2,
      originalNote: note,
      connections: note.tags.map(tag => `tag-${tag}`) // Add connections for notes
    };
    nodes.push(noteNode);
    nodeMap.set(noteNode.id, noteNode);

    // Process tags in the same loop
    note.tags.forEach(tag => {
      const tagId = `tag-${tag}`;
      const currentCount = (tagUsageCount.get(tag) || 0) + 1;
      tagUsageCount.set(tag, currentCount);
      
      let tagNode = nodeMap.get(tagId);
      if (!tagNode) {
        tagNode = {
          id: tagId,
          name: tag,
          type: 'tag',
          value: 1,
          connections: [] // Initialize connections array for tags
        };
        nodes.push(tagNode);
        nodeMap.set(tagId, tagNode);
      }
      
      // Add note ID to tag's connections
      if (tagNode.connections) {
        tagNode.connections.push(noteNode.id);
      }

      links.push({
        source: noteNode.id,
        target: tagId,
        value: 1
      });
    });
  });

  const maxUsage = Math.max(...Array.from(tagUsageCount.values()));
  const colorScale = d3.scaleLinear<string>()
    .domain([0, maxUsage])
    .range(['#60a5fa', '#f59e0b'])
    .interpolate(d3.interpolateHcl);

  return { nodes, links, tagUsageCount, colorScale };
};