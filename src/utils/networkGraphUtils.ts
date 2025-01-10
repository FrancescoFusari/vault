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
  source: string;
  target: string;
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
    const noteTags = note.tags || [];
    noteTags.forEach(tag => {
      if (tag && typeof tag === 'string') {
        allTags.add(tag);
        tagUsageCount.set(tag, (tagUsageCount.get(tag) || 0) + 1);
      }
    });
  });

  // Find the maximum tag usage (with a minimum of 8 for scaling)
  const maxTagUsage = Math.max(8, ...Array.from(tagUsageCount.values()));

  // Create color scale for tags
  const colorScale = d3.scaleLinear<string>()
    .domain([1, maxTagUsage])
    .range(['#94a3b8', '#ef4444'])
    .interpolate(d3.interpolateHcl);

  // Add tag nodes
  Array.from(allTags).forEach(tag => {
    if (tag && typeof tag === 'string') {
      const tagId = `tag-${tag}`;
      const tagNode: NetworkNode = {
        id: tagId,
        name: tag,
        type: 'tag',
        value: 2
      };
      nodes.push(tagNode);
      nodeMap.set(tagId, tagNode);
    }
  });

  // Add note nodes and links
  notes.forEach(note => {
    if (note && note.id) {
      const noteId = `note-${note.id}`;
      const noteNode: NetworkNode = {
        id: noteId,
        name: note.tags?.[0] || note.content.substring(0, 30) + '...',
        type: 'note',
        value: 2,
        originalNote: note
      };
      nodes.push(noteNode);
      nodeMap.set(noteId, noteNode);

      // Create links between notes and their tags
      const noteTags = note.tags || [];
      noteTags.forEach(tag => {
        if (tag && typeof tag === 'string') {
          const tagId = `tag-${tag}`;
          if (nodeMap.has(tagId)) {
            links.push({
              source: noteId,
              target: tagId,
              value: 1
            });
          }
        }
      });
    }
  });

  return { nodes, links, tagUsageCount, colorScale };
};