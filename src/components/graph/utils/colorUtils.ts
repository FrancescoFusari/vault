import { NetworkNode, NetworkLink } from '../types';

export const getNodeColor = (
  node: NetworkNode,
  highlightedNode: NetworkNode | null,
  tagUsageCount: Map<string, number>,
  colorScale: (value: number) => string,
  theme: string
) => {
  if (node.type === 'tag') {
    const usageCount = tagUsageCount.get(node.name) ?? 1;
    return colorScale(usageCount);
  }
  
  if (node.type === 'note' && node.originalNote?.input_type === 'url') {
    return theme === 'dark' ? '#60a5fa' : '#3b82f6';
  }
  
  return theme === 'dark' ? '#6366f1' : '#818cf8';
};

export const getLinkColor = (
  link: NetworkLink,
  highlightedNode: NetworkNode | null,
  theme: string
) => {
  if (highlightedNode && 
     (link.source.id === highlightedNode.id || 
      link.target.id === highlightedNode.id)) {
    return '#ea384c';
  }
  
  if (!link.source || !link.target) return theme === 'dark' ? '#475569' : '#94a3b8';
  
  const isUrlLink = 
    (link.source as NetworkNode).originalNote?.input_type === 'url' || 
    (link.target as NetworkNode).originalNote?.input_type === 'url';
  
  return isUrlLink 
    ? theme === 'dark' ? '#60a5fa' : '#3b82f6'
    : theme === 'dark' ? '#475569' : '#94a3b8';
};