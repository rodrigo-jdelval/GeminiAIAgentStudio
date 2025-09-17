
export type ToolName = 'GoogleSearch' | 'HttpRequest' | 'CodeInterpreter' | 'WebBrowser';

export interface Tool {
  name: ToolName;
  enabled: boolean;
  description: string;
  warning?: string;
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  avatar: string;
  systemPrompt: string;
  tools: Tool[];
  isPredefined?: boolean;
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
