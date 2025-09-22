
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
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
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

// --- New Graph-based Pipeline Structure ---

export interface PipelineNode {
  id: string; // Unique ID for the node instance in the pipeline
  agentId: string;
  position: { x: number; y: number };
}

export interface PipelineEdge {
  id: string;
  source: string; // ID of the source PipelineNode
  target: string; // ID of the target PipelineNode
}

export interface Pipeline {
  id: string;
  name: string;
  description: string;
  nodes: PipelineNode[];
  edges: PipelineEdge[];
  predefinedQuestions?: string[];
}

// For AI-generated pipeline structure
export interface GeneratedPipeline {
  name?: string;
  description?: string;
  steps?: { agentId: string; includePreviousOutput: boolean; }[];
}


// --- Execution State Types for Background Tasks ---

export interface AgentExecutionState {
  id: string; // Corresponds to agent.id
  type: 'agent';
  status: 'running' | 'success' | 'error' | 'cancelled';
  userInput: string;
  history: Message[];
  finalOutput?: string;
  error?: string;
}

export interface PipelineExecutionState {
  id: string; // Corresponds to pipeline.id
  type: 'pipeline';
  status: 'running' | 'success' | 'error' | 'cancelled';
  userInput: string;
  history: PipelineMessage[];
  finalOutput?: string;
  error?: string;
}

export type ExecutionState = AgentExecutionState | PipelineExecutionState;


// --- Pipeline Execution Result Types ---

export interface PipelineStep {
  nodeId: string; // The ID of the node that was executed
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
