
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
            <p className="text-gray-300">This studio allows you to design, build, and test autonomous AI agents and complex workflows. It's built using modern agentic principles, making it a great environment for prototyping agents that can work with frameworks like the <span className="font-semibold text-white">Google AI Developer Kit (ADK)</span>.</p>
             <p className="text-gray-300 mt-2">You can give your agents specific instructions, grant them access to powerful tools, link them together in pipelines, and watch them reason and act to solve complex problems.</p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-indigo-400 mb-2">Core Concepts</h3>
            <div className="space-y-4">
               <div>
                  <h4 className="font-semibold text-white">Agents</h4>
                  <p className="text-gray-300 mt-1">An Agent is a single AI entity with a specific purpose. You define its persona, instructions (System Prompt), and what tools it can use.</p>
                </div>
                <div>
                    <h4 className="font-semibold text-white">Meta Agents</h4>
                    <p className="text-gray-300 mt-1">A Meta Agent is a special type of agent that can call other agents as if they were tools. This allows you to create a "manager" agent that delegates tasks to specialized "worker" agents. You can configure this in the Agent Editor.</p>
                </div>
                 <div>
                    <h4 className="font-semibold text-white">Pipelines</h4>
                    <p className="text-gray-300 mt-1">A Pipeline is a sequence of agents that run one after another. The final answer from one agent is automatically passed as the input to the next agent in the chain. This is extremely powerful for automating multi-step tasks (e.g., Research -> Synthesize -> Write).</p>
                </div>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-indigo-400 mb-2">Organizing Your Work</h3>
             <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-white">Tags & Filtering</h4>
                <p className="text-gray-300 mt-1">You can add tags to your agents (e.g., "research", "writing") in the Agent Editor. The sidebar allows you to filter your agent list by one or more tags, making it easy to find what you need in a large project.</p>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-indigo-400 mb-2">Agent Paradigms</h3>
            <div className="space-y-4">
                <div>
                    <h4 className="font-semibold text-white">ReAct Agents (Reasoning and Acting)</h4>
                    <p className="text-gray-300 mt-1">This is the primary paradigm for agents that need to interact with the outside world. The agent operates in a "Thought, Action, Observation" loop until it can provide a Final Answer. The <span className="font-mono text-xs text-gray-300">Web Researcher</span> is a perfect example of a ReAct agent.</p>
                </div>
                 <div>
                    <h4 className="font-semibold text-white">Chain of Thought (CoT) Agents</h4>
                    <p className="text-gray-300 mt-1">CoT is a simpler but powerful technique where the agent reasons step-by-step to solve a problem <span className="italic">without</span> using any tools. It's perfect for tasks involving logic or math. The <span className="font-mono text-xs text-gray-300">Math Tutor</span> agent is an example of a CoT agent.</p>
                </div>
            </div>
          </section>
          
          <section>
            <h3 className="text-lg font-semibold text-indigo-400 mb-2">Crafting the System Prompt</h3>
            <p className="text-gray-300">The <span className="font-semibold text-white">System Prompt</span> is the most crucial part of your agent's configuration. A good system prompt should clearly define the agent's persona, its goal, and the exact format for using tools (e.g., "Thought: ... Action: ...").</p>
            <p className="text-gray-300 mt-2"><span className="font-bold text-yellow-400">Important:</span> For ReAct agents, explicitly tell them <span className="italic">not</span> to give a final answer until they have used their tools to find the information. This prevents the agent from making up answers.</p>
          </section>
          
           <section>
            <h3 className="text-lg font-semibold text-indigo-400 mb-2">Available Tools</h3>
            <div className="space-y-2">
              <div><h4 className="font-semibold text-white">GoogleSearch</h4> <p className="text-gray-400 text-sm">Searches Google and returns a list of relevant website titles and URIs.</p></div>
              <div><h4 className="font-semibold text-white">WebBrowser</h4> <p className="text-gray-400 text-sm">Reads the text content of a URL. Best used after GoogleSearch.</p></div>
              <div><h4 className="font-semibold text-white">HttpRequest</h4> <p className="text-gray-400 text-sm">Makes a GET request to a URL. Ideal for fetching data from APIs.</p></div>
              <div><h4 className="font-semibold text-white">CodeInterpreter</h4> <p className="text-gray-400 text-sm">Executes a snippet of JavaScript code. Useful for calculations or data manipulation.</p></div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;
