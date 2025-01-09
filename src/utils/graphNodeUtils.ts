import { GraphNode } from "@/types/graph";

export const getNodeColor = (node: GraphNode, highlightedNoteId: string | undefined, theme: string): string => {
  if (node.id === highlightedNoteId) return '#f43f5e';
  switch (node.type) {
    case 'note': return theme === 'dark' ? '#94a3b8' : '#475569';
    case 'category': return theme === 'dark' ? '#f59e0b' : '#d97706';
    case 'tag': return theme === 'dark' ? '#22c55e' : '#16a34a';
    default: return theme === 'dark' ? '#94a3b8' : '#475569';
  }
};

export const calculateNodeSize = (connectionCount: number): number => {
  return Math.max(2, Math.min(5, 1 + connectionCount * 0.5));
};