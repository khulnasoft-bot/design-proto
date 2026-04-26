export interface Source {
  id: string;
  title: string;
  url: string;
  snippet?: string;
}

export type NodeType = 'query' | 'fact' | 'synthesis' | 'thought' | 'business_memory' | 'site_page';

export type Priority = 'low' | 'medium' | 'high';

export interface BusinessMemory {
  businessName: string;
  industry: string;
  targetAudience: string;
  coreValues: string[];
  keyOfferings: string[];
  brandVoice: string;
  internalLegacy: string; // Long-term context strings
}

export interface SitePage {
  id: string;
  type: 'home' | 'about' | 'pricing' | 'dashboard' | 'other';
  title: string;
  content: string; // Markdown or HTML structure
  status: 'draft' | 'published';
}

export interface ResearchNode {
  id: string;
  type: NodeType;
  content: string;
  timestamp: number;
  updatedAt?: number;
  priority?: Priority;
  sources?: Source[];
  position?: { x: number; y: number };
  metadata?: any; // For storing page-specific or business-specific bits
}

export interface Connection {
  id: string;
  fromId: string;
  toId: string;
  label?: string;
  style?: 'solid' | 'dashed' | 'dotted';
  color?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: Priority;
  createdAt: number;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  nodes: ResearchNode[];
  connections?: Connection[];
  businessMemory?: BusinessMemory;
  sitePages?: SitePage[];
  tasks?: Task[];
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  nodes: Partial<ResearchNode>[];
  connections?: Partial<Connection>[];
  tasks?: Partial<Task>[];
  businessMemory?: Partial<BusinessMemory>;
}

export interface WorkspaceState {
  projects: Project[];
  activeProjectId: string | null;
}
