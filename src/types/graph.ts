export interface GraphNode {
  id: string;
  name: string;
  val: number;
  type: 'note' | 'category' | 'tag';
  color?: string;
  x?: number;
  y?: number;
}

export interface GraphLink {
  source: string;
  target: string;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface Note {
  id: string;
  content: string;
  category: string;
  tags: string[];
  created_at: string;
  input_type?: string;  // Added this property
  source_url?: string;  // Added this for completeness
  source_image_path?: string;  // Added this for completeness
}