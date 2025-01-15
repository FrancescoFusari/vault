import { Note } from '@/types/graph';

export interface NetworkNode {
  id: string;
  name: string;
  type: 'note' | 'tag';
  value: number;
  originalNote?: Note;
  x?: number;
  y?: number;
  z?: number;
  fx?: number | null;
  fy?: number | null;
  fz?: number | null;
}

export interface NetworkLink {
  source: NetworkNode;
  target: NetworkNode;
  value: number;
}