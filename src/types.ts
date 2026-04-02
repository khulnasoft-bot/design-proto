export interface Source {
  id: string;
  title: string;
  url: string;
  snippet?: string;
}

export type NodeType = 'query' | 'fact' | 'synthesis' | 'thought';

export type Priority = 'low' | 'medium' | 'high';

export interface ResearchNode {
  id: string;
  type: NodeType;
  content: string;
  timestamp: number;
  updatedAt?: number;
  priority?: Priority;
  sources?: Source[];
  position?: { x: number; y: number };
}

export interface Connection {
  id: string;
  fromId: string;
  toId: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  nodes: ResearchNode[];
  connections?: Connection[];
}

export interface WorkspaceState {
  projects: Project[];
  activeProjectId: string | null;
}
