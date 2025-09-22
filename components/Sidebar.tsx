
import React, { useMemo, useState } from 'react';
import type { Agent, Pipeline, ExecutionState } from '../types';
import { Plus, Trash2, Lock, Copy, Bot, Layers, Tag, ArrowUp, ArrowDown, Sparkles, Loader } from './icons/EditorIcons';

interface SidebarProps {
  view: 'agents' | 'pipelines';
  onSetView: (view: 'agents' | 'pipelines') => void;
  agents: Agent[];
  pipelines: Pipeline[];
  selectedItemId: string | null;
  onSelectItem: (id: string) => void;
  onCreateAgent: () => void;
  onShowCreateAgentModal: () => void;
  onShowCreatePipelineModal: () => void;
  onDeleteAgent: (id: string) => void;
  onDuplicateAgent: (id: string) => void;
  onCreatePipeline: () => void;
  onDeletePipeline: (id: string) => void;
  onReorderAgents: (agents: Agent[]) => void;
  onMoveAgent: (agentId: string, direction: 'up' | 'down') => void;
  executionStates: Record<string, ExecutionState>;
}

const Sidebar: React.FC<SidebarProps> = (props) => {
  const { view, onSetView, agents, pipelines, selectedItemId, onSelectItem, onCreateAgent, onShowCreateAgentModal, onShowCreatePipelineModal, onDeleteAgent, onDuplicateAgent, onCreatePipeline, onDeletePipeline, onReorderAgents, onMoveAgent, executionStates } = props;

  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
  const [draggedAgentId, setDraggedAgentId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);


  const allTags = useMemo(() => {
    const tags = new Set<string>();
    agents.forEach(agent => agent.tags?.forEach(tag => tags.add(tag)));
    return Array.from(tags).sort();
  }, [agents]);
  
  const hasMetaAgents = useMemo(() => agents.some(a => a.isMeta), [agents]);

  const toggleFilter = (filter: string) => {
    setActiveFilters(prev => {
      const newFilters = new Set(prev);
      if (newFilters.has(filter)) {
        newFilters.delete(filter);
      } else {
        newFilters.add(filter);
      }
      return newFilters;
    });
  };
  
  const filteredAgents = useMemo(() => {
    if (activeFilters.size === 0) return agents;
    return agents.filter(agent => {
      const agentTags = new Set(agent.tags || []);
      for (const filter of activeFilters) {
        if (filter === '__meta__') {
          if (!agent.isMeta) return false;
        } else {
          if (!agentTags.has(filter)) return false;
        }
      }
      return true;
    });
  }, [agents, activeFilters]);

  const customAgents = useMemo(() => agents.filter(a => !a.isPredefined), [agents]);

  // --- Drag and Drop Handlers ---
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, agent: Agent) => {
    if (agent.isPredefined) {
      e.preventDefault();
      return;
    }
    setDraggedAgentId(agent.id);
    e.dataTransfer.setData('agentId', agent.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, targetAgent: Agent) => {
    e.preventDefault();
    if (draggedAgentId && draggedAgentId !== targetAgent.id && !targetAgent.isPredefined) {
      setDropTargetId(targetAgent.id);
    }
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDropTargetId(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetAgent: Agent) => {
    e.preventDefault();
    if (!draggedAgentId || targetAgent.isPredefined) return;

    const sourceAgent = agents.find(a => a.id === draggedAgentId);
    if (!sourceAgent || sourceAgent.id === targetAgent.id) return;
    
    let reorderedAgents = agents.filter(a => a.id !== draggedAgentId);
    const targetIndex = reorderedAgents.findIndex(a => a.id === targetAgent.id);

    if (targetIndex !== -1) {
      reorderedAgents.splice(targetIndex, 0, sourceAgent);
      onReorderAgents(reorderedAgents);
    }
  };

  const handleDragEnd = () => {
    setDraggedAgentId(null);
    setDropTargetId(null);
  };


  const renderAgentList = () => (
    <>
      <div className="p-2 space-y-2 border-b border-gray-800">
        <h3 className="px-2 text-xs font-semibold text-gray-400">Filters</h3>
        <div className="flex flex-wrap gap-1">
          {hasMetaAgents && (
            <button
              onClick={() => toggleFilter('__meta__')}
              className={`px-2 py-0.5 text-xs rounded-full transition-colors ${activeFilters.has('__meta__') ? 'bg-purple-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}
            >
              Meta Agents
            </button>
          )}
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => toggleFilter(tag)}
              className={`px-2 py-0.5 text-xs rounded-full transition-colors flex items-center gap-1 ${activeFilters.has(tag) ? 'bg-indigo-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}
            >
              <Tag className="w-3 h-3"/> {tag}
            </button>
          ))}
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto p-2">
        <ul>
          {filteredAgents.map((agent) => {
            const isCustom = !agent.isPredefined;
            const customIndex = isCustom ? customAgents.findIndex(a => a.id === agent.id) : -1;
            const isRunning = executionStates[agent.id]?.status === 'running';
            
            return (
              <li key={agent.id}>
                <div
                  onClick={() => onSelectItem(agent.id)}
                  draggable={!agent.isPredefined}
                  onDragStart={(e) => handleDragStart(e, agent)}
                  onDragOver={handleDragOver}
                  onDragEnter={(e) => handleDragEnter(e, agent)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, agent)}
                  onDragEnd={handleDragEnd}
                  className={`w-full flex items-center justify-between text-left p-2 rounded-md transition-all text-sm group
                    ${!agent.isPredefined ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}
                    ${selectedItemId === agent.id ? 'bg-indigo-600 text-white' : 'hover:bg-gray-800'}
                    ${draggedAgentId === agent.id ? 'opacity-30' : 'opacity-100'}
                    ${dropTargetId === agent.id ? 'border-t-2 border-indigo-400' : 'border-t-2 border-transparent'}`
                  }
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    {isRunning ? <Loader className="w-6 h-6 text-indigo-400 shrink-0" /> : <span className="text-xl w-6 text-center shrink-0">{agent.avatar}</span>}
                    <span className="truncate flex-1">{agent.name}</span>
                    {agent.isPredefined && <span title="Predefined Agent"><Lock className="w-3 h-3 text-gray-400 flex-shrink-0" /></span>}
                  </div>
                  <div className="flex items-center flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      {isCustom && (
                        <div className="flex items-center border-r border-gray-700 mr-1 pr-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); onMoveAgent(agent.id, 'up'); }}
                            title="Move Up"
                            disabled={customIndex === 0}
                            className="p-1 text-gray-400 hover:text-white hover:bg-indigo-500/50 rounded-md disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); onMoveAgent(agent.id, 'down'); }}
                            title="Move Down"
                            disabled={customIndex === customAgents.length - 1}
                            className="p-1 text-gray-400 hover:text-white hover:bg-indigo-500/50 rounded-md disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); onDuplicateAgent(agent.id); }}
                        title="Duplicate Agent"
                        className="p-1 text-gray-400 hover:text-white hover:bg-indigo-500/50 rounded-md"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    {isCustom && (
                      <button
                        onClick={(e) => { e.stopPropagation(); if (window.confirm(`Are you sure you want to delete "${agent.name}"?`)) { onDeleteAgent(agent.id); } }}
                        title="Delete Agent"
                        className="p-1 text-gray-400 hover:text-white hover:bg-red-500/50 rounded-md ml-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      </nav>
    </>
  );

  const renderPipelineList = () => (
     <nav className="flex-1 overflow-y-auto p-2">
        <ul>
          {pipelines.map((pipeline) => {
            const isRunning = executionStates[pipeline.id]?.status === 'running';
            return (
              <li key={pipeline.id}>
                <div
                  onClick={() => onSelectItem(pipeline.id)}
                  className={`w-full flex items-center justify-between text-left p-2 rounded-md transition-colors text-sm cursor-pointer group ${
                    selectedItemId === pipeline.id ? 'bg-indigo-600 text-white' : 'hover:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    {isRunning ? <Loader className="w-5 h-5 text-indigo-400" /> : <Layers className="w-5 h-5 text-gray-400" />}
                    <span className="truncate flex-1">{pipeline.name}</span>
                  </div>
                  <div className="flex items-center flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); if (window.confirm(`Are you sure you want to delete "${pipeline.name}"?`)) { onDeletePipeline(pipeline.id); } }}
                      title="Delete Pipeline"
                      className="p-1 text-gray-400 hover:text-white hover:bg-red-500/50 rounded-md ml-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </nav>
  );

  const isAgentView = view === 'agents';

  return (
    <aside className="w-72 bg-gray-900 border-r border-gray-800 flex flex-col shrink-0">
      <div className="p-2">
        <div className="flex p-1 bg-gray-800 rounded-lg">
          <button 
            onClick={() => onSetView('agents')}
            className={`w-1/2 p-1.5 text-sm font-semibold rounded-md transition-colors flex items-center justify-center gap-2 ${isAgentView ? 'bg-gray-700' : 'hover:bg-gray-700/50'}`}>
            <Bot className="w-5 h-5"/> Agents
          </button>
          <button 
            onClick={() => onSetView('pipelines')}
            className={`w-1/2 p-1.5 text-sm font-semibold rounded-md transition-colors flex items-center justify-center gap-2 ${!isAgentView ? 'bg-gray-700' : 'hover:bg-gray-700/50'}`}>
            <Layers className="w-5 h-5"/> Pipelines
          </button>
        </div>
      </div>

      <div className="p-4 flex justify-between items-center border-b border-t border-gray-800">
        <h2 className="text-lg font-semibold">{isAgentView ? 'Agents' : 'Pipelines'}</h2>
        <div className="flex items-center gap-1">
          <button 
            onClick={isAgentView ? onShowCreateAgentModal : onShowCreatePipelineModal} 
            className="p-1.5 hover:bg-gray-700 rounded-md transition-colors"
            title={isAgentView ? "Create Agent with AI" : "Create Pipeline with AI"}
          >
            <Sparkles className="w-5 h-5" />
          </button>
          <button onClick={isAgentView ? onCreateAgent : onCreatePipeline} className="p-1.5 hover:bg-gray-700 rounded-md transition-colors" title={isAgentView ? 'Create Agent' : 'Create Pipeline'}>
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {isAgentView ? renderAgentList() : renderPipelineList()}
      
    </aside>
  );
};

export default Sidebar;
