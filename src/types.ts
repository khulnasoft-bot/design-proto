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
  priority?: Priority;
  sources?: Source[];
}

export interface Project {
  id: string;
  name: string;
  createdAt: number;
  nodes: ResearchNode[];
}

export interface WorkspaceState {
  projects: Project[];
  activeProjectId: string | null;
}
