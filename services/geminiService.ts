
import { GoogleGenAI, Type } from '@google/genai';
// Fix: Import GeneratedPipeline type
import type { Agent, ReActStep, ToolName, Pipeline, PipelineStep, Tool, PipelineNode, GeneratedPipeline } from '../types';

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
    const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
    if (!response.ok) {
      return `Error: Received status ${response.status} from proxy for ${url}`;
    }

    const rawText = await response.text();
    if (!rawText) {
        return "Error: Proxy returned an empty response.";
    }

    try {
        const data = JSON.parse(rawText);
        const textContent = data.contents || '';
        return textContent.length > 3000 ? textContent.substring(0, 3000) + '... (truncated)' : textContent;
    } catch (jsonError) {
        console.warn(`HttpRequest: Could not parse JSON from proxy for URL: ${url}.`, jsonError);
        return `Error: Proxy returned a non-JSON response. This could be an error page from the proxy itself. Raw response snippet: ${rawText.substring(0, 500)}`;
    }
  } catch (error) {
    console.error("Error with HttpRequest:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown fetch error';
    return `Error: Failed to fetch from URL ${url}. It might be a CORS issue, a network problem, or the proxy service is down. Details: ${errorMessage}`;
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
    const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
    if (!response.ok) {
        return `Error: Failed to fetch the webpage via proxy. Status: ${response.status}`;
    }
    
    const rawText = await response.text();
    if (!rawText) {
        return "Error: Proxy returned an empty response.";
    }

    let content = '';
    try {
        const data = JSON.parse(rawText);
        content = data.contents || 'No content found from proxy.';
    } catch (jsonError) {
        console.warn(`WebBrowser: Could not parse JSON from proxy for URL: ${url}.`, jsonError);
        return `Error: Proxy returned a non-JSON response. This is likely an error from the proxy service or the target site is blocking it. Raw response snippet: ${rawText.substring(0, 500)}`;
    }
    
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown fetch error';
    return `Error: Could not retrieve content from ${url}. This might be a network issue or the proxy service is down. Details: ${errorMessage}`;
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
    
    // Handle cases like "query=\"...\"" or "uri=\"...\""
    const keyValuePairMatch = args.match(/^\s*\w+\s*=\s*(".*"|'.*'|`.*`)\s*$/);
    if (keyValuePairMatch && keyValuePairMatch[1]) {
        args = keyValuePairMatch[1];
    }

    // Remove quotes from the beginning and end of the arguments string
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
  onStep: (step: { thought: string; action?: string; observation?: string; finalAnswer?: string }, isFinal: boolean) => void,
  stopSignal?: AbortSignal
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

  const config: any = {
    systemInstruction: systemPrompt,
    temperature: agent.temperature ?? 0.5,
  };

  if (agent.maxOutputTokens && agent.maxOutputTokens > 0) {
    config.maxOutputTokens = agent.maxOutputTokens;
    // As per guidelines, set thinkingBudget when maxOutputTokens is set for flash model
    if ((agent.model || model) === 'gemini-2.5-flash') {
      config.thinkingConfig = { thinkingBudget: Math.max(100, Math.floor(agent.maxOutputTokens / 2)) };
    }
  }

  while (stepCount < MAX_STEPS) {
    if (stopSignal?.aborted) {
      onStep({ thought: "Execution stopped by user.", finalAnswer: "Execution was cancelled by the user." }, true);
      throw new DOMException('The user aborted the request.', 'AbortError');
    }
    stepCount++;
    
    const result = await ai.models.generateContent({ model: agent.model || model, contents: history, config });

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
             }, stopSignal).catch(reject); // Pass signal and handle potential abort
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

export const runPipeline = async (
  pipeline: Pipeline,
  initialPrompt: string,
  allAgents: Agent[],
  onStep: (step: PipelineStep) => void,
  stopSignal?: AbortSignal
): Promise<string> => {
  const { nodes, edges } = pipeline;
  if (nodes.length === 0) return "Pipeline has no steps to run.";

  // --- Topological Sort to determine execution order ---
  const inDegree = new Map<string, number>();
  const adjList = new Map<string, string[]>();

  for (const node of nodes) {
    inDegree.set(node.id, 0);
    adjList.set(node.id, []);
  }

  for (const edge of edges) {
    adjList.get(edge.source)?.push(edge.target);
    inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
  }

  const queue = nodes.filter(node => inDegree.get(node.id) === 0).map(node => node.id);
  const sortedNodes: string[] = [];

  while (queue.length > 0) {
    const u = queue.shift()!;
    sortedNodes.push(u);

    for (const v of adjList.get(u) || []) {
      inDegree.set(v, (inDegree.get(v) || 1) - 1);
      if (inDegree.get(v) === 0) {
        queue.push(v);
      }
    }
  }

  if (sortedNodes.length !== nodes.length) {
    throw new Error("Pipeline contains a cycle and cannot be run.");
  }
  // --- End of Topological Sort ---

  const executionResults = new Map<string, string>();
  let finalOutput = "";

  for (const nodeId of sortedNodes) {
     if (stopSignal?.aborted) {
      throw new DOMException('The user aborted the request.', 'AbortError');
    }

    const node = nodes.find(n => n.id === nodeId);
    if (!node) continue;

    const agent = allAgents.find(a => a.id === node.agentId);
    if (!agent) {
      throw new Error(`Agent with ID ${node.agentId} not found in pipeline "${pipeline.name}".`);
    }

    // Aggregate inputs from parent nodes
    const parentEdges = edges.filter(edge => edge.target === nodeId);
    let currentInput = "";

    if (parentEdges.length === 0) {
      currentInput = initialPrompt;
    } else {
      const parentOutputs = parentEdges.map((edge, index) => {
         const parentOutput = executionResults.get(edge.source) || "";
         return `--- INPUT ${index + 1} ---\n${parentOutput}`;
      });
      currentInput = `You have received multiple inputs. Please process them all.\n\n${parentOutputs.join('\n\n')}`;
    }
    
    const thinkingSteps: ReActStep[] = [];
    
    const output = await new Promise<string>((resolve, reject) => {
        runAgent(agent, currentInput, allAgents, (step, isFinal) => {
            if (isFinal) {
                resolve(step.finalAnswer ?? "Agent finished without providing a final answer.");
            } else {
                thinkingSteps.push({ thought: step.thought, action: step.action, observation: step.observation });
            }
        }, stopSignal).catch(reject);
    });

    executionResults.set(nodeId, output);
    finalOutput = output; // The output of the last executed node
    
    onStep({
      nodeId: node.id,
      agentId: agent.id,
      agentName: agent.name,
      input: currentInput,
      output: output,
      thinkingSteps: thinkingSteps
    });
  }

  return finalOutput;
};

// --- AI Agent Creator ---
export const generateAgentFromPrompt = async (description: string): Promise<Omit<Agent, 'id' | 'isPredefined' | 'files' | 'isMeta' | 'subAgentIds'>> => {
  const systemInstruction = `You are an Agent Architect. Your task is to design an AI agent based on a user's description. You must generate a JSON object that defines the agent's properties.

Available tools: 'GoogleSearch', 'HttpRequest', 'CodeInterpreter', 'WebBrowser'.

Analyze the user's request and:
1.  Create a short, descriptive 'name' for the agent.
2.  Write a one-sentence 'description' of its function.
3.  Choose a single, appropriate emoji for the 'avatar'.
4.  Write a detailed 'systemPrompt' that instructs the agent on its persona, goals, and how to use tools in a ReAct format (Thought, Action, Observation) if necessary. If the agent should not use tools, instruct it to provide the Final Answer directly.
5.  Based on the agent's purpose, create a 'tools' array. For each tool needed, include an object like {"name": "ToolName", "enabled": true}. Only include tools that are absolutely necessary. If no tools are needed, provide an empty array.
6.  Generate a list of 1-3 relevant 'tags' (e.g., "research", "writing").
7.  Create an array of 2-3 example 'predefinedQuestions' a user might ask this agent.

Your output MUST be a valid JSON object conforming to the provided schema. Do not include any other text or explanations.`;

  const agentSchema = {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING, description: 'A short, descriptive name for the agent.' },
      description: { type: Type.STRING, description: "A one-sentence summary of the agent's purpose." },
      avatar: { type: Type.STRING, description: 'A single emoji to represent the agent.' },
      systemPrompt: { type: Type.STRING, description: 'The detailed system instructions for the agent.' },
      tools: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: 'The name of the tool.' },
            enabled: { type: Type.BOOLEAN, description: 'Whether the tool is enabled.' },
          },
        },
        description: 'A list of tools the agent can use.'
      },
      tags: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: 'A list of relevant tags for categorization.'
      },
      predefinedQuestions: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: 'A list of example questions for the user.'
      }
    },
    required: ["name", "description", "avatar", "systemPrompt", "tools", "tags", "predefinedQuestions"]
  };
  
  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: description,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: agentSchema,
      },
    });

    const jsonText = response.text.trim();
    if (!jsonText) {
      throw new Error("The model returned an empty response.");
    }

    const generatedAgent = JSON.parse(jsonText);

    // Validate and clean up the generated tools array
    const validTools: ToolName[] = ['GoogleSearch', 'HttpRequest', 'CodeInterpreter', 'WebBrowser'];
    if (Array.isArray(generatedAgent.tools)) {
        generatedAgent.tools = generatedAgent.tools.filter((tool: Partial<Tool>) => 
            tool && typeof tool.name === 'string' && validTools.includes(tool.name as ToolName) && tool.enabled === true
        );
    } else {
        generatedAgent.tools = [];
    }

    return generatedAgent;
  } catch (error) {
    console.error("Error generating agent from prompt:", error);
    throw new Error(`Failed to generate agent configuration. The model may have returned an invalid format. Details: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// --- AI Pipeline Creator ---
export const generatePipelineFromPrompt = async (
  description: string,
  allAgents: Agent[]
// Fix: Update return type to GeneratedPipeline
): Promise<GeneratedPipeline> => {
  const systemInstruction = `You are a Workflow Architect. Your task is to design an AI agent pipeline based on a user's description. You must generate a JSON object that defines the pipeline's properties.

You have the following agents available to use as steps in the pipeline. Your primary goal is to select the correct agents in the correct order.

Available Agents:
${allAgents.map(a => `- ID: "${a.id}", Name: "${a.name}", Description: "${a.description}"`).join('\n')}

Analyze the user's request and:
1.  Create a short, descriptive 'name' for the pipeline.
2.  Write a one-sentence 'description' of its function.
3.  Create a 'steps' array representing a simple, linear sequence of agents. This is an approximation of the workflow.
4.  For each step, you MUST include the 'agentId' of one of the available agents.
5.  For each step, set 'includePreviousOutput' to 'true' unless it is the very first step.

Your output MUST be a valid JSON object conforming to the provided schema. Do not include any other text or explanations.`;

  const pipelineSchema = {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING, description: 'A short, descriptive name for the pipeline.' },
      description: { type: Type.STRING, description: "A one-sentence summary of the pipeline's purpose." },
      steps: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            agentId: { type: Type.STRING, description: 'The ID of the agent for this step.' },
            includePreviousOutput: { type: Type.BOOLEAN, description: 'Whether to use the output of the previous step as input.' },
          },
          required: ["agentId", "includePreviousOutput"]
        },
        description: 'A linear sequence of agent steps for the pipeline.'
      },
    },
    required: ["name", "description", "steps"]
  };
  
  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: description,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: pipelineSchema,
      },
    });

    const jsonText = response.text.trim();
    if (!jsonText) {
      throw new Error("The model returned an empty response.");
    }
    
    const generatedPipeline = JSON.parse(jsonText);

    // Validate that the returned agentIds are valid
    if (Array.isArray(generatedPipeline.steps)) {
      const validAgentIds = new Set(allAgents.map(a => a.id));
      generatedPipeline.steps = generatedPipeline.steps.filter((step: any) => 
        step && typeof step.agentId === 'string' && validAgentIds.has(step.agentId)
      );
    } else {
        generatedPipeline.steps = [];
    }

    return generatedPipeline;

  } catch (error) {
    console.error("Error generating pipeline from prompt:", error);
    throw new Error(`Failed to generate pipeline configuration. The model may have returned an invalid format. Details: ${error instanceof Error ? error.message : String(error)}`);
  }
};