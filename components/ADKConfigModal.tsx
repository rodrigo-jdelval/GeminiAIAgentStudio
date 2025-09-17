import React, { useState, useEffect } from 'react';
import type { Agent } from '../types';
import { X, Save } from './icons/EditorIcons';

interface ADKConfigModalProps {
  agent: Agent | null;
  onClose: () => void;
  onSave: (agent: Agent) => void;
}

const ADKConfigModal: React.FC<ADKConfigModalProps> = ({ agent, onClose, onSave }) => {
  const [configText, setConfigText] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (agent) {
      const adkConfig = {
        name: agent.name,
        description: agent.description,
        instructions: agent.systemPrompt,
        tools: agent.tools.filter(tool => tool.enabled).map(tool => tool.name),
      };
      setConfigText(JSON.stringify(adkConfig, null, 2));
      setError(null);
    }
  }, [agent]);

  if (!agent) return null;

  const handleSave = () => {
    try {
      const parsedConfig = JSON.parse(configText);
      setError(null);
      
      // Basic validation
      if (!parsedConfig.instructions || !parsedConfig.name) {
          setError("Invalid config: 'name' and 'instructions' are required.");
          return;
      }

      // Create a new agent object with updated values
      const updatedAgent: Agent = {
        ...agent,
        name: parsedConfig.name,
        description: parsedConfig.description || agent.description,
        systemPrompt: parsedConfig.instructions,
        tools: agent.tools.map(tool => ({
          ...tool,
          enabled: Array.isArray(parsedConfig.tools) && parsedConfig.tools.includes(tool.name),
        })),
      };

      onSave(updatedAgent);
      onClose();

    } catch (e) {
      setError('Invalid JSON format.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-lg max-w-3xl w-full max-h-[95vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-xl font-bold">ADK Configuration</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-700 rounded-md transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 flex-1 flex flex-col overflow-hidden">
          <p className="text-gray-400 text-sm mb-2">View and edit the agent's configuration in the Google ADK JSON format.</p>
          <textarea
            value={configText}
            onChange={(e) => setConfigText(e.target.value)}
            className="w-full flex-1 bg-gray-950 border border-gray-700 rounded-md p-2 font-mono text-sm leading-relaxed focus:ring-2 focus:ring-indigo-500 transition-colors"
            spellCheck="false"
          />
          {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
        </div>
        <div className="flex items-center justify-end p-4 border-t border-gray-800 gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium bg-gray-700 hover:bg-gray-600 rounded-md transition-colors">
                Cancel
            </button>
            <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors">
                <Save className="w-4 h-4" /> Save Changes
            </button>
        </div>
      </div>
    </div>
  );
};

export default ADKConfigModal;