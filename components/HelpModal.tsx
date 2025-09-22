
import React from 'react';
import { X, FileCode } from './icons/EditorIcons';

interface HelpModalProps {
  onClose: () => void;
}

const HelpSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="mb-6">
    <h3 className="text-lg font-semibold text-indigo-400 mb-3">{title}</h3>
    <div className="space-y-4 text-gray-300">
      {children}
    </div>
  </section>
);

const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-800 shrink-0">
          <h2 className="text-xl font-bold">Help & Guide</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-700 rounded-md transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          <HelpSection title="Welcome to the Gemini AI Agent Studio!">
            <p>This studio is a powerful IDE for designing, building, and testing autonomous AI agents and complex, non-linear workflows. It's built using modern agentic principles, making it a great environment for prototyping agents that can work with frameworks like the <span className="font-semibold text-white">Google AI Developer Kit (ADK)</span>.</p>
            <p>You can give your agents specific instructions, grant them access to powerful tools, link them together in sophisticated graphs, and watch them reason and act to solve complex problems.</p>
          </HelpSection>

          <HelpSection title="Core Concepts">
            <div>
              <h4 className="font-semibold text-white">Agents</h4>
              <p className="mt-1">An Agent is a single AI entity with a specific purpose. You define its persona, instructions (System Prompt), what tools it can use, and its model configuration (temperature, etc.).</p>
            </div>
            <div>
              <h4 className="font-semibold text-white">Pipelines (Workflows)</h4>
              <p className="mt-1">A Pipeline is a visual workflow, or a directed graph, of interconnected agents. This allows you to design multi-step tasks where the output of one or more agents can become the input for another, enabling highly complex automation.</p>
            </div>
             <div>
              <h4 className="font-semibold text-white">Asynchronous Execution</h4>
              <p className="mt-1">Agents and pipelines run in the background. You can start a long-running task, switch to another view to edit a different agent, and the original task will continue to execute. A spinning loader icon in the sidebar will indicate any active tasks.</p>
            </div>
          </HelpSection>

          <HelpSection title="Key Features Explained">
             <div>
                <h4 className="font-semibold text-white">Graphical Pipeline Editor (Canvas)</h4>
                <p className="mt-1">You build pipelines in a visual, node-based editor. This is more than a simple sequence; it's a graph that allows for complex, multi-input workflows.</p>
                 <ul className="list-disc list-inside mt-2 space-y-2 pl-2">
                    <li><span className="font-semibold text-white">Adding Agents:</span> Drag agents from the "Available Agents" list and drop them onto the canvas to create a new node.</li>
                    <li><span className="font-semibold text-white">Creating Connections:</span> Drag from the purple output handle on the right of one node to the indigo input handle on the left of another to create a data flow link (an "edge").</li>
                    <li><span className="font-semibold text-white">Multiple Inputs:</span> A single agent node can have multiple incoming connections. When the pipeline runs, the outputs from all parent nodes will be aggregated and fed as a combined input to the child node.</li>
                    <li><span className="font-semibold text-white">Execution Control:</span> Use the "Stop" button in the playground to safely cancel a running pipeline or agent after it completes its current step.</li>
                </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white">Data Visualizer Agent ✨</h4>
              <p className="mt-1">This special utility agent takes structured data (like JSON) and transforms it into a human-readable report. It can generate summaries, create tables, and even render images if the input data contains image URLs.</p>
            </div>
             <div>
              <h4 className="font-semibold text-white">Model Configuration</h4>
              <p className="mt-1">You have granular control over each agent's behavior. In the Agent Editor, you can set the specific LLM model, adjust the <span className="font-semibold">Temperature</span> for creativity, and set the <span className="font-semibold">Max Output Tokens</span> to control response length.</p>
            </div>
          </HelpSection>
          
          <details className="bg-gray-950/50 border border-gray-700 rounded-lg group">
            <summary className="p-4 cursor-pointer flex items-center gap-3 text-lg font-semibold text-indigo-400 group-hover:text-indigo-300">
              <FileCode className="w-6 h-6"/>
              Product Requirement Document (PRD) for AI Development
            </summary>
            <div className="p-6 border-t border-gray-700 prose prose-invert prose-sm max-w-none prose-pre:bg-gray-800 prose-pre:p-4 prose-pre:rounded-md">
              <p>This document can be used as a detailed prompt for a Large Language Model (e.g., Gemini) to generate the source code for this entire application.</p>
              
              <h3 id="prd-title">Title: Product Requirement Document: Gemini AI Agent Studio</h3>

              <h4>1. Overview</h4>
              <p>The Gemini AI Agent Studio is a powerful, web-based integrated development environment (IDE) for creating, managing, and testing sophisticated AI agents and complex, non-linear multi-agent workflows (pipelines). It enables users to prototype and build agents based on advanced patterns like ReAct, equip them with tools, fine-tune model configurations, and orchestrate them in a visual graph editor. The application must support asynchronous, background execution of tasks.</p>

              <h4>2. Core Features</h4>
              <ul>
                  <li><strong>Agent Management:</strong> Create, edit, duplicate, and delete agents. Includes predefined examples.</li>
                  <li><strong>AI-Powered Creation:</strong> Generate complete agent or pipeline configurations from a natural language description.</li>
                  <li><strong>Advanced Agent Configuration:</strong> A comprehensive UI to configure agent properties including name, description, system prompt, tools, and fine-tuned model settings (model, temperature, max output tokens).</li>
                  <li><strong>Graphical Pipeline Editor (Graph-Based):</strong> A node-based canvas UI to visually design workflows as directed graphs. It must support complex topologies, including one-to-many and many-to-one data flows.</li>
                  <li><strong>Asynchronous Execution Engine:</strong>
                    <ul>
                      <li>All agent and pipeline executions must run in the background, allowing the user to navigate the application freely without interrupting active tasks.</li>
                      <li>The sidebar must display a visual indicator (e.g., a spinner) next to any agent or pipeline that is currently running.</li>
                    </ul>
                  </li>
                  <li><strong>Agent & Pipeline Playground:</strong> An interactive environment for testing:
                    <ul>
                      <li>Displays the step-by-step reasoning process (Thought, Action, Observation).</li>
                      <li>Includes an "Stop Execution" button to safely cancel ongoing tasks.</li>
                      <li>Features a robust Markdown renderer capable of displaying headers, lists, tables, and images.</li>
                      <li>Allows toggling between formatted Markdown and raw text views for outputs.</li>
                    </ul>
                  </li>
                  <li><strong>Global Configuration Management:</strong> Import and export the entire application state (all agents and pipelines) as a single JSON file.</li>
              </ul>

              <h4>3. Technical Implementation & Architecture</h4>
              
              <h5>Centralized Execution State</h5>
              <p>The application's state management must include a centralized record (e.g., a JavaScript object or map) to track the status and history of all executions. This state is critical for background processing and rehydrating the playground view when the user navigates back to an active or completed task.</p>
              
              <h5>Asynchronous Task Management</h5>
              <p>Each agent or pipeline execution should be managed via an `AbortController` to allow for cancellation. The execution logic must be decoupled from the UI components to run independently.</p>
              
              <h5>Option A: Standalone Client-Side Application (Current Architecture)</h5>
              <p>Designed for simplicity and rapid prototyping without a dedicated backend.</p>
              <pre><code>
- Framework: React with TypeScript
- Styling: Tailwind CSS
- State Management: React Hooks (useState, useEffect). A centralized execution state object is managed in the root App component.
- Persistence: Browser's localStorage
- API Calls: The @google/genai SDK is used directly from the client.
              </code></pre>

              <h5>Option B: Scalable Client/Server Application with Firebase</h5>
              <p>Designed for production use, offering scalability, security, and multi-user support.</p>
              <pre><code>
- Frontend: React with TypeScript and Tailwind CSS.
- Backend (Serverless): Firebase Functions handle all Gemini API interactions and tool executions securely. The API key is stored server-side.
- Database: Firestore for persistent storage of agents, pipelines, and user data.
- Real-time Updates: Firestore's real-time capabilities can be used to stream execution state updates from the backend to the client.
- Authentication: Firebase Authentication for user management.
              </code></pre>
              
              <h4>4. Pipeline Engine Specification</h4>
              
              <h5>Graph-Based Structure & Execution</h5>
              <p>The pipeline's structure must be stored as a directed graph (`nodes` and `edges`). The execution engine must perform a topological sort to determine the correct, dependency-aware execution order. For nodes with multiple parents, all parent outputs must be aggregated into a single, formatted input for the child node.</p>

              <h4>5. Predefined Content</h4>
              <p>The application must ship with pre-configured agents and pipelines.</p>
              <h6>Key Predefined Agents</h6>
              <ul>
                  <li><strong>Ransomware Threat Assessor (JSON):</strong> Identifies ransomware threats for a company profile and outputs findings in a structured JSON format.</li>
                  <li><strong>MITRE ATT&CK TTPs Identifier (JSON):</strong> Takes threat actor names and identifies their TTPs, outputting in JSON.</li>
                  <li><strong>Data Visualizer:</strong> An advanced utility agent that formats structured data into human-readable Markdown. It must be capable of generating summaries, tables, lists, and rendering images from URLs found in the input data.</li>
              </ul>
              <h6>Key Predefined Pipeline</h6>
              <ul>
                  <li><strong>Ransomware Actor TTP Analysis:</strong> A three-step linear graph pipeline that chains the `Ransomware Threat Assessor`, `MITRE ATT&CK TTPs Identifier`, and `Data Visualizer` agents.</li>
              </ul>
            </div>
          </details>

        </div>
      </div>
    </div>
  );
};

export default HelpModal;
