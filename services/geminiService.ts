
import { GoogleGenAI } from '@google/genai';
import type { Agent, ReActStep, ToolName, KnowledgeFile, Pipeline, PipelineStep } from '../types';

if (!process.env.API_KEY) {
  alert("API_KEY environment variable not set. Please set it to use the Gemini API.");
  throw new Error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const model = 'gemini-2.5-flash';
const MAX_STEPS = 10; 

// A simplified Part type for building multimodal requests
interface Part {
  text?: string;
  inlineData?: {
    mimeType?: string;
    // FIX: The type from the Gemini API response has 'data' as an optional property, which conflicted with the local type that required it. Making it optional resolves the type error.
    data?: string;
  };
}

// A simplified Content type for managing chat history
interface Content {
  role: string;
  parts: Part[];
}


// --- Tool Implementations ---

async function runGoogleSearch(query: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: `Search for: ${query}`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (groundingChunks && groundingChunks.length > 0) {
      return "Found sources:\n" + groundingChunks
        .map((chunk: any) => `- Title: ${chunk.web?.title || 'N/A'}\n  URI: ${chunk.web?.uri || 'N/A'}`)
        .slice(0, 5) // Get top 5 results
        .join('\n\n');
    }

    if (response.text.trim()) {
      return response.text;
    }

    return "No relevant information found from Google Search.";
  } catch (error) {
    console.error("Error executing Google Search:", error);
    return `Error during search: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

async function runHttpRequest(url: string): Promise<string> {
  try {
    // A real application would typically use a server-side proxy for this.
    const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
    if (!response.ok) {
      return `Error: Received status ${response.status} from ${url}`;
    }
    const data = await response.json();
    const text = data.contents || '';
    return text.length > 3000 ? text.substring(0, 3000) + '... (truncated)' : text;
  } catch (error) {
    console.error("Error with HttpRequest:", error);
    return `Error: Failed to fetch from URL ${url}. It might be a CORS issue or network problem.`;
  }
}

async function runCodeInterpreter(code: string): Promise<string> {
  try {
    // This is a simplified and sandboxed interpreter. It's not a full Node.js environment.
    const result = await (new Function(`"use strict"; return (async () => { ${code} })()`))();
    return `Execution result: ${JSON.stringify(result, null, 2)}`;
  } catch (error) {
    console.error("Error executing code:", error);
    return `Error during execution: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

async function runWebBrowser(url: string): Promise<string> {
  try {
    // Using a CORS proxy to fetch client-side. A real-world app should use a backend for this.
    const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
    if (!response.ok) {
        return `Error: Failed to fetch the webpage. Status: ${response.status}`;
    }
    const data = await response.json();
    let content = data.contents || 'No content found.';

    // Basic HTML stripping to get cleaner text for the model
    content = content
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s\s+/g, ' ')
      .trim();
      
    return content.substring(0, 4000) + '... (content truncated)';
  } catch (error) {
    console.error('Error in WebBrowser tool:', error);
    return `Error: Could not retrieve content from ${url}. Check if the correct and accessible.`;
  }
}


async function executeTool(toolName: ToolName, args: string): Promise<string> {
  switch (toolName) {
    case 'GoogleSearch':
      return runGoogleSearch(args);
    case 'HttpRequest':
      return runHttpRequest(args);
    case 'CodeInterpreter':
      return runCodeInterpreter(args);
    case 'WebBrowser':
      return runWebBrowser(args);
    default:
      return `Error: Unknown tool '${toolName}'.`;
  }
}

function parseAction(text: string): { tool: string; args: string } | null {
  const actionRegex = /Action:\s*([\w_]+)\(([\s\S]*)\)/s;
  const match = text.match(actionRegex);
  if (match) {
    let args = match[2].trim();
    
    if ((args.startsWith('"') && args.endsWith('"')) || (args.startsWith("'") && args.endsWith("'")) || (args.startsWith("`") && args.endsWith("`"))) {
      args = args.substring(1, args.length - 1);
    }
    
    return { tool: match[1].trim(), args };
  }
  return null;
}

// --- Main Agent Runner ---

export const runAgent = async (
  agent: Agent,
  prompt: string,
  allAgents: Agent[],
  onStep: (step: { thought: string; action?: string; observation?: string; finalAnswer?: string }, isFinal: boolean) => void
) => {
  const history: Content[] = [];
  const today = new Date().toISOString().split('T')[0];
  let systemPrompt = agent.systemPrompt;
  
  if (agent.isMeta && agent.subAgentIds && agent.subAgentIds.length > 0) {
    const callableAgents = allAgents.filter(a => agent.subAgentIds?.includes(a.id));
    if (callableAgents.length > 0) {
      const agentToolDescriptions = callableAgents.map(a => `- Agent_${a.name.replace(/\s+/g, '_')}(task_description): ${a.description}`).join('\n');
      systemPrompt += `\n\nYou can also use the following specialized agents as tools:\n${agentToolDescriptions}`;
    }
  }

  const initialUserParts: Part[] = [];
  const textContentParts: string[] = [];

  if (agent.files && agent.files.length > 0) {
    const textFilesContents = agent.files.filter(f => f.content).map(f => `--- START FILE: ${f.name} ---\n${f.content}\n--- END FILE: ${f.name} ---`);
    agent.files.forEach(f => {
      if (f.base64Content && f.mimeType) {
        initialUserParts.push({ inlineData: { mimeType: f.mimeType, data: f.base64Content } });
      }
    });
    if (textFilesContents.length > 0) {
      textContentParts.push(`Use the following documents as your primary source of information:\n\n${textFilesContents.join('\n\n')}`);
    }
  }

  textContentParts.push(`Current date is ${today}.`);
  textContentParts.push(`User's request:\n${prompt}`);
  initialUserParts.push({ text: textContentParts.join('\n\n') });
  history.push({ role: 'user', parts: initialUserParts });

  let stepCount = 0;
  const enabledTools = agent.tools.filter(t => t.enabled).map(t => t.name);

  while (stepCount < MAX_STEPS) {
    stepCount++;
    
    const result = await ai.models.generateContent({ model, contents: history, config: { systemInstruction: systemPrompt } });

    if (result.candidates?.[0]?.content) {
      const modelContent = result.candidates[0].content;
      history.push({ role: modelContent.role || 'model', parts: modelContent.parts });
    }

    const responseText = result.text ?? '';
    
    const thoughtMatch = responseText.match(/Thought:\s*([\s\S]*?)(?=Action:|Final Answer:|$)/);
    const thought = thoughtMatch ? thoughtMatch[1].trim() : "I need to determine the next step.";

    const finalAnswerMatch = responseText.match(/Final Answer:\s*([\s\S]*)/);
    if (finalAnswerMatch) {
      onStep({ thought, finalAnswer: finalAnswerMatch[1].trim() }, true);
      return;
    }

    const action = parseAction(responseText);
    let observation = '';

    if (action) {
      const formattedAction = `${action.tool}(${JSON.stringify(action.args)})`;
      
      if (enabledTools.includes(action.tool as ToolName)) {
        observation = await executeTool(action.tool as ToolName, action.args);
      } else if (agent.isMeta && action.tool.startsWith('Agent_')) {
        const agentName = action.tool.replace('Agent_', '').replace(/_/g, ' ');
        const subAgent = allAgents.find(a => a.name === agentName);
        
        if (subAgent && agent.subAgentIds?.includes(subAgent.id)) {
           observation = await new Promise<string>((resolve, reject) => {
             runAgent(subAgent, action.args, allAgents, (step, isFinal) => {
                if(isFinal) resolve(step.finalAnswer || "Sub-agent finished without a final answer.");
             }).catch(reject);
           });
        } else {
          observation = `Error: Sub-agent '${agentName}' not found or not callable.`;
        }
      } else {
        observation = `Error: Unknown or disabled tool '${action.tool}'.`;
      }
      onStep({ thought, action: formattedAction, observation }, false);
      history.push({ role: 'user', parts: [{ text: `Observation: ${observation}` }] });
    } else {
      const correctiveFeedback = "Invalid format. You must use 'Action: ToolName(args)' or 'Final Answer: [your answer]'.";
      onStep({ thought: responseText.trim() || thought, observation: correctiveFeedback }, false);
      history.push({ role: 'user', parts: [{ text: `Observation: ${correctiveFeedback}` }] });
    }
  }
  
  onStep({ thought: "Max steps reached.", finalAnswer: "I have reached the maximum number of steps and could not find a conclusive answer." }, true);
};


// --- Pipeline Runner ---

// Helper to adapt callback-based runAgent to a promise for pipeline execution
function runAgentForPipeline(
    agent: Agent,
    prompt: string,
    allAgents: Agent[],
    onThinking: (step: ReActStep) => void
): Promise<string> {
    return new Promise((resolve, reject) => {
        try {
            runAgent(agent, prompt, allAgents, (step, isFinal) => {
                if (!isFinal) {
                    onThinking({ thought: step.thought, action: step.action, observation: step.observation });
                } else {
                    resolve(step.finalAnswer ?? "Agent finished without providing a final answer.");
                }
            });
        } catch (error) {
            reject(error);
        }
    });
}

export const runPipeline = async (
  pipeline: Pipeline,
  initialPrompt: string,
  allAgents: Agent[],
  onStep: (step: PipelineStep) => void
): Promise<string> => {
  let currentInput = initialPrompt;

  for (const agentId of pipeline.agentIds) {
    const agent = allAgents.find(a => a.id === agentId);
    if (!agent) {
      throw new Error(`Agent with ID ${agentId} not found in pipeline "${pipeline.name}".`);
    }
    
    const thinkingSteps: ReActStep[] = [];
    const onThinking = (step: ReActStep) => {
        thinkingSteps.push(step);
    };

    const output = await runAgentForPipeline(agent, currentInput, allAgents, onThinking);
    
    onStep({
      agentId: agent.id,
      agentName: agent.name,
      input: currentInput,
      output: output,
      thinkingSteps: thinkingSteps
    });

    currentInput = output; // The output of one agent is the input for the next
  }

  return currentInput; // The final output of the pipeline
};
