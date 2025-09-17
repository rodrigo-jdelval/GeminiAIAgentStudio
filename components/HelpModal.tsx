import React from 'react';
import { X } from './icons/EditorIcons';

interface HelpModalProps {
  onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-xl font-bold">Help & Guide</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-700 rounded-md transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-6 overflow-y-auto">
          <section>
            <h3 className="text-lg font-semibold text-indigo-400 mb-2">Welcome to the AI Agent Studio!</h3>
            <p className="text-gray-300">This studio allows you to design, build, and test autonomous AI agents. It's built using modern agentic principles, making it a great environment for prototyping agents that can work with frameworks like the <span className="font-semibold text-white">Google AI Developer Kit (ADK)</span>.</p>
             <p className="text-gray-300 mt-2">You can give your agents specific instructions (a "System Prompt"), grant them access to powerful tools, and watch them reason and act to solve complex problems.</p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-indigo-400 mb-2">Agent Paradigms</h3>
            <div className="space-y-4">
                <div>
                    <h4 className="font-semibold text-white">ReAct Agents (Reasoning and Acting)</h4>
                    <p className="text-gray-300 mt-1">This is the primary paradigm for agents that need to interact with the outside world. The agent operates in a "Thought, Action, Observation" loop:</p>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-gray-400">
                      <li><span className="font-semibold text-purple-400">Thought:</span> The agent analyzes the user's request and its current situation, then decides what to do next.</li>
                      <li><span className="font-semibold text-green-400">Action:</span> The agent decides to use a tool (like Google Search) to get more information.</li>
                      <li><span className="font-semibold text-yellow-400">Observation:</span> The agent receives the result from the tool it used.</li>
                    </ul>
                     <p className="text-gray-300 mt-2">This loop continues until the agent has enough information to provide a <span className="font-semibold text-white">Final Answer</span>. The <span className="font-mono text-xs text-gray-300">Web Researcher</span> is a perfect example of a ReAct agent.</p>
                </div>
                 <div>
                    <h4 className="font-semibold text-white">Chain of Thought (CoT) Agents</h4>
                    <p className="text-gray-300 mt-1">CoT is a simpler but powerful technique where the agent reasons step-by-step to solve a problem <span className="italic">without</span> using any tools. It's perfect for tasks involving logic, math, or complex reasoning that don't require external information.</p>
                     <p className="text-gray-300 mt-2">To create a CoT agent, simply create an agent, disable all its tools, and instruct it in the System Prompt to "think step-by-step before giving an answer". The <span className="font-mono text-xs text-gray-300">Math Tutor</span> agent is an example of a CoT agent.</p>
                </div>
            </div>
          </section>
          
          <section>
            <h3 className="text-lg font-semibold text-indigo-400 mb-2">Crafting the System Prompt</h3>
            <p className="text-gray-300">The <span className="font-semibold text-white">System Prompt</span> is the most crucial part of your agent's configuration. A good system prompt should clearly define:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-gray-400">
              <li>The agent's persona and role (e.g., "You are an expert financial analyst.").</li>
              <li>The specific goal or task it needs to accomplish.</li>
              <li>Crucially, the exact format for using tools (e.g., "Thought: ... Action: ...").</li>
              <li><span className="font-bold text-yellow-400">Important:</span> For ReAct agents, explicitly tell them <span className="italic">not</span> to give a final answer until they have used their tools to find the information. This prevents the agent from making up answers.</li>
            </ul>
          </section>
          
           <section>
            <h3 className="text-lg font-semibold text-indigo-400 mb-2">Available Tools</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-white">GoogleSearch</h4>
                <p className="text-gray-400 text-sm">Searches Google and returns a list of relevant website titles and URIs. It's the primary tool for discovery.</p>
                <code className="text-xs text-green-300 bg-gray-800 rounded p-1 mt-1 inline-block">Action: GoogleSearch("latest news on AI")</code>
              </div>
              <div>
                <h4 className="font-semibold text-white">WebBrowser</h4>
                <p className="text-gray-400 text-sm">Reads the text content of a URL. Best used after GoogleSearch to get detailed information from a specific page.</p>
                <code className="text-xs text-green-300 bg-gray-800 rounded p-1 mt-1 inline-block">Action: WebBrowser("https://www.example.com/article")</code>
              </div>
              <div>
                <h4 className="font-semibold text-white">HttpRequest</h4>
                <p className="text-gray-400 text-sm">Makes a GET request to a URL. Ideal for fetching raw data from APIs that return JSON.</p>
                <code className="text-xs text-green-300 bg-gray-800 rounded p-1 mt-1 inline-block">Action: HttpRequest("https://api.example.com/data")</code>
              </div>
               <div>
                <h4 className="font-semibold text-white">CodeInterpreter</h4>
                <p className="text-gray-400 text-sm">Executes a snippet of JavaScript code in a sandboxed environment. Useful for calculations, data manipulation, or complex logic.</p>
                <code className="text-xs text-green-300 bg-gray-800 rounded p-1 mt-1 inline-block">Action: CodeInterpreter("const result = 2 + 2; return result;")</code>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-indigo-400 mb-2">Import & Export</h3>
            <p className="text-gray-300"><span className="font-semibold text-white">Import/Export:</span> Use these buttons to save and load the complete agent configuration as a <span className="font-mono text-sm bg-gray-800 p-1 rounded">.json</span> file. This is great for backing up your work.</p>
            <p className="text-gray-300 mt-2"><span className="font-semibold text-white">Export ADK:</span> This saves a simplified JSON configuration containing just the agent's instructions and enabled tools. This format is designed to be easily readable by other systems, such as the Google AI Developer Kit.</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;