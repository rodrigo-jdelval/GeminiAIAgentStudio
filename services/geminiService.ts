
import { GoogleGenAI } from '@google/genai';
import type { Agent, ReActStep, ToolName } from '../types';

if (!process.env.API_KEY) {
  alert("API_KEY environment variable not set. Please set it to use the Gemini API.");
  throw new Error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const model = 'gemini-2.5-flash';
const MAX_STEPS = 10; 

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
    return `Error: Could not retrieve content from ${url}. Check if the URL is correct and accessible.`;
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
  const actionRegex = /Action:\s*(\w+)\(([\s\S]*)\)/s;
  const match = text.match(actionRegex);
  if (match) {
    let args = match[2].trim();
    
    // Handle cases where the model might output `key="value"` inside the parentheses
    const keyValMatch = args.match(/^\w+\s*=\s*"(.*)"$/);
    if (keyValMatch && keyValMatch[1]) {
      args = keyValMatch[1];
    } 
    // Handle standard quoted strings, stripping the outer quotes
    else if ((args.startsWith('"') && args.endsWith('"')) || (args.startsWith("'") && args.endsWith("'")) || (args.startsWith("`") && args.endsWith("`"))) {
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
  onStep: (step: { thought: string; action?: string; observation?: string; finalAnswer?: string }, isFinal: boolean) => void
) => {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  let context = `Current date is ${today}. You must use this date to interpret any time-relative queries from the user (e.g., "last week", "today").\n\n${agent.systemPrompt}\n\nHere is the user's request:\n${prompt}`;
  let stepCount = 0;
  
  const enabledTools = agent.tools.filter(t => t.enabled).map(t => t.name);

  while (stepCount < MAX_STEPS) {
    stepCount++;
    
    const response = await ai.models.generateContent({
      model: model,
      contents: [{ role: 'user', parts: [{ text: context }] }],
    });

    const responseText = response.text ?? '';
    
    const thoughtMatch = responseText.match(/Thought:\s*([\s\S]*?)(?=Action:|Final Answer:|$)/);
    const thought = thoughtMatch ? thoughtMatch[1].trim() : "I need to determine the next step.";

    const finalAnswerMatch = responseText.match(/Final Answer:\s*([\s\S]*)/);
    if (finalAnswerMatch) {
      onStep({ thought, finalAnswer: finalAnswerMatch[1].trim() }, true);
      return;
    }

    const action = parseAction(responseText);
    
    if (action && enabledTools.includes(action.tool as ToolName)) {
        const observation = await executeTool(action.tool as ToolName, action.args);
        const formattedAction = `${action.tool}(${JSON.stringify(action.args)})`;
        const stepResult: ReActStep = { thought, action: formattedAction, observation };
        onStep(stepResult, false);
        context += `\nThought: ${thought}\nAction: ${formattedAction}\nObservation: ${observation}`;
    } else {
        // The model failed to provide a valid action or final answer.
        // We will add its response as a thought and provide corrective feedback in the context for the next loop.
        const invalidResponseAsThought = responseText.trim() || thought;
        const correctiveFeedback = "That was not a valid Action or Final Answer. You must use the format 'Action: ToolName(args)' or 'Final Answer: [your answer]'. Please try again.";
        
        onStep({ thought: invalidResponseAsThought, observation: correctiveFeedback }, false);
        context += `\nThought: ${invalidResponseAsThought}\nObservation: ${correctiveFeedback}`;
    }
  }
  
  onStep({ thought: "Max steps reached.", finalAnswer: "I have reached the maximum number of steps and could not find a conclusive answer." }, true);
};
