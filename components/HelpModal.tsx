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
      <div className="bg-gray-900 border border-gray-700 rounded-lg max-w-3xl w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-800 shrink-0">
          <h2 className="text-xl font-bold">Help & Guide</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-700 rounded-md transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          <HelpSection title="Welcome to the Gemini AI Agent Studio!">
            <p>This studio is a powerful IDE for designing, building, and testing autonomous AI agents and complex workflows. It's built using modern agentic principles, making it a great environment for prototyping agents that can work with frameworks like the <span className="font-semibold text-white">Google AI Developer Kit (ADK)</span>.</p>
            <p>You can give your agents specific instructions, grant them access to powerful tools, link them together in pipelines, and watch them reason and act to solve complex problems.</p>
          </HelpSection>

          <HelpSection title="Core Concepts">
            <div>
              <h4 className="font-semibold text-white">Agents</h4>
              <p className="mt-1">An Agent is a single AI entity with a specific purpose. You define its persona, instructions (System Prompt), and what tools it can use.</p>
            </div>
            <div>
              <h4 className="font-semibold text-white">Pipelines (Workflows)</h4>
              <p className="mt-1">A Pipeline is a sequence of agents that run one after another to automate a multi-step task. You can visually design these workflows using the graphical editor.</p>
            </div>
             <div>
              <h4 className="font-semibold text-white">Create with AI ✨</h4>
              <p className="mt-1">This is the fastest way to get started. You can create both agents and pipelines simply by describing them in natural language. Click the ✨ icon, describe what you need, and the AI will generate a complete configuration for you.</p>
            </div>
            <div>
              <h4 className="font-semibold text-white">Meta Agents</h4>
              <p className="mt-1">A Meta Agent is a special type of agent that can call other agents as if they were tools. This allows you to create a "manager" agent that delegates tasks to specialized "worker" agents.</p>
            </div>
          </HelpSection>

          <HelpSection title="Key Features Explained">
             <div>
                <h4 className="font-semibold text-white">Graphical Pipeline Editor</h4>
                <p className="mt-1">Instead of a simple list, you can build your pipelines in a visual, node-based editor. Drag and drop agents to reorder them. Between each agent, you'll find a <span className="font-semibold text-white">Link/Unlink</span> toggle. This gives you precise control over the data flow:
                    <ul className="list-disc list-inside mt-2 space-y-1 pl-2">
                        <li><span className="font-semibold text-indigo-300">Linked:</span> The output of the previous agent is used as the input for the next one. This is for sequential tasks.</li>
                        <li><span className="font-semibold text-gray-400">Unlinked:</span> The agent ignores the previous step's output and uses the pipeline's original input. This is for parallel tasks.</li>
                    </ul>
                </p>
            </div>
            <div>
                <h4 className="font-semibold text-white">ReAct vs. Chain of Thought</h4>
                <p className="mt-1">The studio supports two main agent paradigms:</p>
                <ul className="list-disc list-inside mt-2 space-y-1 pl-2">
                    <li><span className="font-semibold text-white">ReAct (Reasoning and Acting):</span> For agents that need to interact with tools. They operate in a "Thought, Action, Observation" loop. The <span className="font-mono text-xs">Web Researcher</span> is a perfect example.</li>
                    <li><span className="font-semibold text-white">Chain of Thought (CoT):</span> For agents that solve problems through reasoning alone, without tools. They think step-by-step. The <span className="font-mono text-xs">Math Tutor</span> is a good example.</li>
                </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white">Crafting the System Prompt</h4>
              <p className="mt-1">This is the most crucial part of your agent. A good prompt clearly defines the agent's persona, its goal, and the exact format for using tools. <span className="font-bold text-yellow-400">Important:</span> For ReAct agents, explicitly tell them <span className="italic">not</span> to give a final answer until they have used their tools. This prevents hallucination.</p>
            </div>
            <div>
              <h4 className="font-semibold text-white">Available Tools</h4>
              <ul className="list-disc list-inside mt-2 space-y-1 pl-2">
                <li><span className="font-semibold text-white">GoogleSearch:</span> Searches Google and returns titles and URIs.</li>
                <li><span className="font-semibold text-white">WebBrowser:</span> Reads the text content of a URL.</li>
                <li><span className="font-semibold text-white">HttpRequest:</span> Makes GET requests to APIs.</li>
                <li><span className="font-semibold text-white">CodeInterpreter:</span> Executes a snippet of JavaScript code.</li>
              </ul>
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
              <p>The Gemini AI Agent Studio is a powerful, web-based integrated development environment (IDE) for creating, managing, and testing sophisticated AI agents and multi-agent workflows (pipelines). It enables users to prototype and build agents based on advanced patterns like ReAct (Reasoning and Acting) and Chain of Thought (CoT), equip them with tools, and orchestrate them to solve complex tasks.</p>

              <h4>2. Core Features</h4>
              <ul>
                  <li><strong>Agent Management:</strong> Create, edit, duplicate, and delete agents. Includes predefined examples (e.g., Web Researcher, Cybersecurity Analyst).</li>
                  <li><strong>AI-Powered Creation:</strong>
                      <ul>
                          <li><strong>Create Agent with AI:</strong> Generate a complete agent configuration (name, description, system prompt, tool selection) from a natural language description.</li>
                          <li><strong>Create Pipeline with AI:</strong> Generate a multi-agent pipeline from a natural language description of the workflow.</li>
                      </ul>
                  </li>
                  <li><strong>Agent Editor:</strong> A comprehensive UI to configure agent properties: Name, Description, Avatar, System Prompt, Tool Selection, and Meta-Agent settings.</li>
                  <li><strong>Graphical Pipeline Editor:</strong> A node-based UI to visually design workflows. Agents are nodes that can be reordered via drag-and-drop. Connections between nodes can be "Linked" (passing output to the next input) or "Unlinked" (using the original pipeline input).</li>
                  <li><strong>Agent & Pipeline Playground:</strong> An interactive chat interface to test agents and run pipelines, showing the step-by-step reasoning process (Thought, Action, Observation) and allowing chat history to be exported.</li>
                  <li><strong>Configuration Management:</strong> Import/export agent configurations as JSON files and view/edit them in a format compatible with the Google AI Developer Kit (ADK).</li>
              </ul>

              <h4>3. User Interface (UI)</h4>
              <p>The application uses a responsive three-column layout:</p>
              <ol>
                  <li><strong>Sidebar (Left):</strong> Tabs for "Agents" and "Pipelines" views, with lists and management controls (create, delete, filter).</li>
                  <li><strong>Editor Panel (Middle):</strong> Displays the configuration editor for the selected agent or the graphical editor for the selected pipeline.</li>
                  <li><strong>Playground Panel (Right):</strong> The interactive environment for testing the selected item.</li>
              </ol>

              <h4>4. Technical Implementation</h4>
              <p>Below are two potential architectures for building this application.</p>

              <h5>Option A: Standalone Client-Side Application (Current Architecture)</h5>
              <p>Designed for simplicity, ease of deployment, and offline functionality without a dedicated backend.</p>
              <pre><code>
- Framework: React with TypeScript
- Styling: Tailwind CSS
- State Management: React Hooks (useState, useEffect)
- Persistence: Browser's localStorage
- API Calls:
  - @google/genai SDK used directly from the client.
  - Tool execution (HttpRequest, WebBrowser) relies on a public CORS proxy.
- Deployment: Static web application (e.g., Firebase Hosting, GitHub Pages).
              </code></pre>

              <h5>Option B: Scalable Client/Server Application with Firebase</h5>
              <p>Designed for production use, offering scalability, security, and multi-user support.</p>
              <pre><code>
- Frontend: React with TypeScript and Tailwind CSS.
- Backend (Serverless):
  - Firebase Functions: Handle all Gemini API interactions and tool executions securely. The API key is stored server-side.
- Database:
  - Firestore: NoSQL database for persistent storage of agents, pipelines, and user data, replacing localStorage.
- Authentication:
  - Firebase Authentication: Manages user sign-up and login, enabling multi-user support with data isolation.
- Deployment:
  - Firebase Hosting for the frontend.
  - Firebase Functions & Firestore for backend and database.
              </code></pre>
            </div>
          </details>

        </div>
      </div>
    </div>
  );
};

export default HelpModal;
