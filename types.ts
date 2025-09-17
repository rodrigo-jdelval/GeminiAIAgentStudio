
export type ToolName = 'GoogleSearch' | 'HttpRequest' | 'CodeInterpreter' | 'WebBrowser';

export interface Tool {
  name: ToolName;
  enabled: boolean;
  description: string;
  warning?: string;
}

export interface KnowledgeFile {
  id: string;
  name:string;
  content: string; // Used for text-based files
  base64Content?: string; // Used for binary files like PDFs
  mimeType: string;
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  avatar: string;
  systemPrompt: string;
  tools: Tool[];
  files?: KnowledgeFile[];
  tags?: string[];
  isPredefined?: boolean;
  isMeta?: boolean;
  subAgentIds?: string[];
  predefinedQuestions?: string[];
}

export interface Message {
  id: string;
  role: 'user' | 'agent';
  content: string;
  thinkingSteps?: ReActStep[];
}

export interface ReActStep {
  thought: string;
  action?: string;
  observation?: string;
}

export interface Pipeline {
  id: string;
  name: string;
  description: string;
  agentIds: string[];
}

export interface PipelineStep {
  agentId: string;
  agentName: string;
  input: string;
  output: string;
  thinkingSteps?: ReActStep[];
}

export interface PipelineMessage {
  id: string;
  role: 'user' | 'pipeline';
  input: string;
  steps: PipelineStep[];
  error?: string;
}