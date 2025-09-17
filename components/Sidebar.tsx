
import React from 'react';
import type { Agent } from '../types';
import { Plus, Trash2, Lock, Copy } from './icons/EditorIcons';

interface SidebarProps {
  agents: Agent[];
  selectedAgentId: string | null;
  onSelectAgent: (id: string) => void;
  onCreateAgent: () => void;
  onDeleteAgent: (id: string) => void;
  onDuplicateAgent: (id: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ agents, selectedAgentId, onSelectAgent, onCreateAgent, onDeleteAgent, onDuplicateAgent }) => {
  return (
    <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col shrink-0">
      <div className="p-4 flex justify-between items-center border-b border-gray-800">
        <h2 className="text-lg font-semibold">Agents</h2>
        <button onClick={onCreateAgent} className="p-1.5 hover:bg-gray-700 rounded-md transition-colors">
          <Plus className="w-5 h-5" />
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto p-2">
        <ul>
          {agents.map((agent) => (
            <li key={agent.id}>
              <div
                onClick={() => onSelectAgent(agent.id)}
                className={`w-full flex items-center justify-between text-left p-2 rounded-md transition-colors text-sm cursor-pointer ${
                  selectedAgentId === agent.id ? 'bg-indigo-600 text-white' : 'hover:bg-gray-800'
                }`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <span className="text-xl">{agent.avatar}</span>
                  <span className="truncate flex-1">{agent.name}</span>
                  {agent.isPredefined && <Lock className="w-3 h-3 text-gray-400 flex-shrink-0" />}
                </div>
                <div className="flex items-center flex-shrink-0">
                  <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDuplicateAgent(agent.id);
                      }}
                      title="Duplicate Agent"
                      className="p-1 text-gray-400 hover:text-white hover:bg-indigo-500/50 rounded-md"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  {!agent.isPredefined && selectedAgentId === agent.id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`Are you sure you want to delete "${agent.name}"?`)) {
                          onDeleteAgent(agent.id);
                        }
                      }}
                      title="Delete Agent"
                      className="p-1 text-gray-400 hover:text-white hover:bg-red-500/50 rounded-md ml-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
