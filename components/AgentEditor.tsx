
import React, { useState, useEffect } from 'react';
import type { Agent, Tool } from '../types';
import { Info } from './icons/EditorIcons';

interface AgentEditorProps {
  agent: Agent;
  onUpdateAgent: (agent: Agent) => void;
}

const AgentEditor: React.FC<AgentEditorProps> = ({ agent, onUpdateAgent }) => {
  const [formData, setFormData] = useState<Agent>(agent);

  useEffect(() => {
    setFormData(agent);
  }, [agent]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const updatedAgent = { ...formData, [name]: value };
    setFormData(updatedAgent);
    onUpdateAgent(updatedAgent);
  };
  
  const handleToolToggle = (toolName: string) => {
    const updatedTools = formData.tools.map(tool => 
      tool.name === toolName ? { ...tool, enabled: !tool.enabled } : tool
    );
    const updatedAgent = { ...formData, tools: updatedTools as Tool[] };
    setFormData(updatedAgent);
    onUpdateAgent(updatedAgent);
  };

  const isReadOnly = agent.isPredefined;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg flex flex-col overflow-hidden">
      <div className="p-4 border-b border-gray-800">
        <h3 className="text-lg font-semibold">Agent Editor</h3>
        {isReadOnly && (
          <p className="text-xs text-yellow-400 flex items-center gap-1 mt-1">
            <Info className="w-3 h-3" /> Predefined agents are not editable.
          </p>
        )}
      </div>
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-400 mb-1">Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            disabled={isReadOnly}
            className="w-full bg-gray-800 border-gray-700 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 transition-colors disabled:opacity-50"
          />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-400 mb-1">Description</label>
          <textarea
            id="description"
            name="description"
            rows={2}
            value={formData.description}
            onChange={handleInputChange}
            disabled={isReadOnly}
            className="w-full bg-gray-800 border-gray-700 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 transition-colors disabled:opacity-50"
          />
        </div>
        <div>
          <label htmlFor="systemPrompt" className="block text-sm font-medium text-gray-400 mb-1">System Prompt (Instructions)</label>
          <textarea
            id="systemPrompt"
            name="systemPrompt"
            rows={10}
            value={formData.systemPrompt}
            onChange={handleInputChange}
            disabled={isReadOnly}
            className="w-full bg-gray-800 border-gray-700 rounded-md p-2 font-mono text-sm leading-relaxed focus:ring-2 focus:ring-indigo-500 transition-colors disabled:opacity-50"
          />
        </div>
        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-2">Tools</h4>
          <div className="space-y-2">
            {formData.tools.map(tool => (
              <div key={tool.name} className="flex items-center justify-between bg-gray-800 p-3 rounded-md">
                <div>
                   <p className="font-semibold flex items-center gap-2">
                    {tool.name}
                    {tool.warning && (
                      <span title={tool.warning}>
                        <Info className="w-4 h-4 text-yellow-400 cursor-help" />
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-400">{tool.description}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={tool.enabled} onChange={() => handleToolToggle(tool.name)} className="sr-only peer" disabled={isReadOnly}/>
                  <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-indigo-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 peer-disabled:opacity-50"></div>
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentEditor;
