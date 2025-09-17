
import React, { useState, useCallback, useEffect } from 'react';
import { PREDEFINED_AGENTS } from './constants';
import type { Agent, Pipeline } from './types';
import Sidebar from './components/Sidebar';
import AgentEditor from './components/AgentEditor';
import AgentPlayground from './components/AgentPlayground';
import Header from './components/Header';
import HelpModal from './components/HelpModal';
import ADKConfigModal from './components/ADKConfigModal';
import { exportAgentToFile, importAgentFromFile } from './utils/fileUtils';

const App: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>(() => {
    try {
      const savedAgents = localStorage.getItem('ai-agents');
      return savedAgents ? JSON.parse(savedAgents) : PREDEFINED_AGENTS;
    } catch (error) {
      console.error("Failed to load agents from localStorage", error);
      return PREDEFINED_AGENTS;
    }
  });

  const [pipelines, setPipelines] = useState<Pipeline[]>(() => {
    try {
      const savedPipelines = localStorage.getItem('ai-pipelines');
      return savedPipelines ? JSON.parse(savedPipelines) : [];
    } catch (error) {
      console.error("Failed to load pipelines from localStorage", error);
      return [];
    }
  });

  const [view, setView] = useState<'agents' | 'pipelines'>('agents');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(agents.length > 0 ? agents[0].id : null);
  const [isHelpVisible, setHelpVisible] = useState(false);
  const [isADKConfigModalVisible, setADKConfigModalVisible] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('ai-agents', JSON.stringify(agents));
    } catch (error) {
      console.error("Failed to save agents to localStorage", error);
    }
  }, [agents]);

  useEffect(() => {
    try {
      localStorage.setItem('ai-pipelines', JSON.stringify(pipelines));
    } catch (error) {
      console.error("Failed to save pipelines to localStorage", error);
    }
  }, [pipelines]);
  
  useEffect(() => {
    const currentList = view === 'agents' ? agents : pipelines;
    // Check if the currently selected item exists in the list for the current view.
    const selectedItemExistsInCurrentView = currentList.some(item => item.id === selectedItemId);

    // If the selected item doesn't exist (e.g., it was deleted, or the view changed),
    // then select the first item from the current list.
    if (!selectedItemExistsInCurrentView) {
      if (view === 'agents') {
        setSelectedItemId(agents.length > 0 ? agents[0].id : null);
      } else if (view === 'pipelines') {
        setSelectedItemId(pipelines.length > 0 ? pipelines[0].id : null);
      }
    }
  }, [view, agents, pipelines, selectedItemId]);

  const handleSelectItem = useCallback((id: string) => {
    setSelectedItemId(id);
  }, []);

  const handleCreateAgent = useCallback(() => {
    const newAgent: Agent = {
      id: `agent-${Date.now()}`,
      name: 'New Agent',
      description: 'A new brilliant AI agent.',
      avatar: '🤖',
      systemPrompt: `You are a helpful assistant.
- Follow the user's instructions carefully.
- When you need to use a tool, you MUST format your response as:
Thought: [Your reasoning for using the tool]
Action: [ToolName(args)]
- After getting the tool's result (Observation), continue reasoning or provide the final answer.
- Your final response to the user MUST be formatted as:
Final Answer: [Your conclusive response]`,
      tools: [
        { name: 'GoogleSearch', enabled: false, description: "Search Google for up-to-date information." },
        { name: 'HttpRequest', enabled: false, description: "Make a GET request to a URL to fetch data, e.g., from an API." },
        { name: 'CodeInterpreter', enabled: false, description: "Execute a snippet of JavaScript code.", warning: "Executes arbitrary code. Use with extreme caution as it can be insecure." },
        { name: 'WebBrowser', enabled: false, description: "Get the main text content from a URL. Best for reading articles." },
      ],
      files: [],
      tags: [],
      isPredefined: false,
      isMeta: false,
      subAgentIds: [],
      predefinedQuestions: [],
    };
    setAgents(prev => [...prev, newAgent]);
    setSelectedItemId(newAgent.id);
  }, []);

  const handleCreatePipeline = useCallback(() => {
    const newPipeline: Pipeline = {
      id: `pipeline-${Date.now()}`,
      name: 'New Pipeline',
      description: 'A sequence of agents to perform a complex task.',
      agentIds: [],
    };
    setPipelines(prev => [...prev, newPipeline]);
    setSelectedItemId(newPipeline.id);
  }, []);


  const handleUpdateAgent = useCallback((updatedAgent: Agent) => {
    setAgents(prev => prev.map(agent => agent.id === updatedAgent.id ? updatedAgent : agent));
  }, []);
  
  const handleUpdatePipeline = useCallback((updatedPipeline: Pipeline) => {
    setPipelines(prev => prev.map(p => p.id === updatedPipeline.id ? updatedPipeline : p));
  }, []);

  const handleDeleteAgent = useCallback((id: string) => {
    setAgents(prev => {
      // Also remove this agent from any meta-agent's subAgentIds list
      const updatedAgents = prev.map(agent => {
        if (agent.isMeta && agent.subAgentIds?.includes(id)) {
          return { ...agent, subAgentIds: agent.subAgentIds.filter(subId => subId !== id) };
        }
        return agent;
      });

      // Also remove this agent from any pipeline
      setPipelines(currentPipelines => currentPipelines.map(p => ({
        ...p,
        agentIds: p.agentIds.filter(agentId => agentId !== id),
      })));

      const newAgents = updatedAgents.filter(agent => agent.id !== id);
      if (selectedItemId === id) {
        setSelectedItemId(newAgents.length > 0 ? newAgents[0].id : null);
      }
      return newAgents;
    });
  }, [selectedItemId, setPipelines]);

  const handleDeletePipeline = useCallback((id: string) => {
    setPipelines(prev => {
      const newPipelines = prev.filter(p => p.id !== id);
      if (selectedItemId === id) {
        setSelectedItemId(newPipelines.length > 0 ? newPipelines[0].id : null);
      }
      return newPipelines;
    });
  }, [selectedItemId]);

  const handleDuplicateAgent = useCallback((id: string) => {
    const agentToCopy = agents.find(a => a.id === id);
    if (!agentToCopy) return;

    const newAgent: Agent = {
      ...agentToCopy,
      id: `agent-${Date.now()}`,
      name: `${agentToCopy.name} (Copy)`,
      isPredefined: false,
    };

    setAgents(prev => [...prev, newAgent]);
    setSelectedItemId(newAgent.id);
  }, [agents]);

  const handleExportAgent = useCallback(() => {
    const agentToExport = agents.find(agent => agent.id === selectedItemId);
    if (agentToExport) {
      exportAgentToFile(agentToExport);
    }
  }, [agents, selectedItemId]);

  const handleImportAgent = useCallback(async (file: File) => {
    try {
      const importedAgent = await importAgentFromFile(file);
      if (agents.some(a => a.id === importedAgent.id)) {
        importedAgent.id = `agent-${Date.now()}`;
      }
      setAgents(prev => [...prev, importedAgent]);
      setView('agents');
      setSelectedItemId(importedAgent.id);
    } catch (error) {
      alert(`Error importing agent: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [agents]);

  const handleReorderAgents = useCallback((reorderedAgents: Agent[]) => {
    setAgents(reorderedAgents);
  }, []);

  const handleMoveAgent = useCallback((agentId: string, direction: 'up' | 'down') => {
    setAgents(prevAgents => {
        // Separate predefined from custom agents to ensure we don't mix them
        const predefinedAgents = prevAgents.filter(a => a.isPredefined);
        const customAgents = prevAgents.filter(a => !a.isPredefined);

        const currentIndex = customAgents.findIndex(a => a.id === agentId);

        // If agent not found in custom list, do nothing
        if (currentIndex === -1) {
            return prevAgents;
        }

        const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

        // Check if the move is within the bounds of the custom agents array
        if (newIndex < 0 || newIndex >= customAgents.length) {
            return prevAgents; // Already at the top or bottom
        }

        // Swap the elements
        const newCustomAgents = [...customAgents];
        const temp = newCustomAgents[currentIndex];
        newCustomAgents[currentIndex] = newCustomAgents[newIndex];
        newCustomAgents[newIndex] = temp;
        
        // Recombine the lists and return the new state
        return [...predefinedAgents, ...newCustomAgents];
    });
  }, []);


  const selectedAgent = view === 'agents' ? agents.find(agent => agent.id === selectedItemId) ?? null : null;
  const selectedPipeline = view === 'pipelines' ? pipelines.find(p => p.id === selectedItemId) ?? null : null;
  const selectedItem = selectedAgent ?? selectedPipeline;

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-gray-100">
      <Header 
        onImport={handleImportAgent} 
        onExport={handleExportAgent}
        onShowADKConfig={() => setADKConfigModalVisible(true)}
        onShowHelp={() => setHelpVisible(true)}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          view={view}
          onSetView={setView}
          agents={agents}
          pipelines={pipelines}
          selectedItemId={selectedItemId}
          onSelectItem={handleSelectItem}
          onCreateAgent={handleCreateAgent}
          onDeleteAgent={handleDeleteAgent}
          onDuplicateAgent={handleDuplicateAgent}
          onCreatePipeline={handleCreatePipeline}
          onDeletePipeline={handleDeletePipeline}
          onReorderAgents={handleReorderAgents}
          onMoveAgent={handleMoveAgent}
        />
        <main className="flex-1 flex overflow-hidden">
          {selectedItem ? (
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 overflow-hidden">
              <AgentEditor
                key={selectedItem.id}
                view={view}
                item={selectedItem}
                allAgents={agents}
                onUpdateAgent={handleUpdateAgent}
                onUpdatePipeline={handleUpdatePipeline}
              />
              <AgentPlayground
                key={`${selectedItem.id}-playground`}
                view={view}
                item={selectedItem}
                allAgents={agents}
              />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <p className="text-2xl">No {view === 'agents' ? 'Agent' : 'Pipeline'} Selected</p>
                <p>Create a new {view === 'agents' ? 'agent' : 'pipeline'} or select one from the list to begin.</p>
              </div>
            </div>
          )}
        </main>
      </div>
      {isHelpVisible && <HelpModal onClose={() => setHelpVisible(false)} />}
      {isADKConfigModalVisible && selectedAgent && (
        <ADKConfigModal
          agent={selectedAgent}
          onClose={() => setADKConfigModalVisible(false)}
          onSave={handleUpdateAgent}
        />
      )}
    </div>
  );
};

export default App;