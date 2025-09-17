
import React, { useState, useCallback, useEffect } from 'react';
import { PREDEFINED_AGENTS } from './constants';
import type { Agent, Tool } from './types';
import Sidebar from './components/Sidebar';
import AgentEditor from './components/AgentEditor';
import AgentPlayground from './components/AgentPlayground';
import Header from './components/Header';
import HelpModal from './components/HelpModal';
import ADKConfigModal from './components/ADKConfigModal';
import { exportAgentToFile, importAgentFromFile, exportAgentForADK } from './utils/fileUtils';

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
  
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(agents.length > 0 ? agents[0].id : null);
  const [isHelpVisible, setHelpVisible] = useState(false);
  const [isADKConfigModalVisible, setADKConfigModalVisible] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('ai-agents', JSON.stringify(agents));
    } catch (error) {
      console.error("Failed to save agents to localStorage", error);
    }
  }, [agents]);

  const handleSelectAgent = useCallback((id: string) => {
    setSelectedAgentId(id);
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
      isPredefined: false,
    };
    setAgents(prev => [...prev, newAgent]);
    setSelectedAgentId(newAgent.id);
  }, []);

  const handleUpdateAgent = useCallback((updatedAgent: Agent) => {
    setAgents(prev => prev.map(agent => agent.id === updatedAgent.id ? updatedAgent : agent));
  }, []);
  
  const handleUpdateAgentFromADK = useCallback((updatedAgent: Agent) => {
    handleUpdateAgent(updatedAgent);
  }, [handleUpdateAgent]);

  const handleDeleteAgent = useCallback((id: string) => {
    setAgents(prev => {
      const newAgents = prev.filter(agent => agent.id !== id);
      if (selectedAgentId === id) {
        setSelectedAgentId(newAgents.length > 0 ? newAgents[0].id : null);
      }
      return newAgents;
    });
  }, [selectedAgentId]);

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
    setSelectedAgentId(newAgent.id);
  }, [agents]);

  const handleExportAgent = useCallback(() => {
    const agentToExport = agents.find(agent => agent.id === selectedAgentId);
    if (agentToExport) {
      exportAgentToFile(agentToExport);
    }
  }, [agents, selectedAgentId]);

  const handleImportAgent = useCallback(async (file: File) => {
    try {
      const importedAgent = await importAgentFromFile(file);
      if (agents.some(a => a.id === importedAgent.id)) {
        // To avoid ID collisions, we can assign a new ID.
        importedAgent.id = `agent-${Date.now()}`;
      }
      setAgents(prev => [...prev, importedAgent]);
      setSelectedAgentId(importedAgent.id);
    } catch (error) {
      alert(`Error importing agent: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [agents]);

  const selectedAgent = agents.find(agent => agent.id === selectedAgentId) || null;

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
          agents={agents}
          selectedAgentId={selectedAgentId}
          onSelectAgent={handleSelectAgent}
          onCreateAgent={handleCreateAgent}
          onDeleteAgent={handleDeleteAgent}
          onDuplicateAgent={handleDuplicateAgent}
        />
        <main className="flex-1 flex overflow-hidden">
          {selectedAgent ? (
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 overflow-hidden">
              <AgentEditor
                key={selectedAgent.id}
                agent={selectedAgent}
                onUpdateAgent={handleUpdateAgent}
              />
              <AgentPlayground
                key={`${selectedAgent.id}-playground`}
                agent={selectedAgent}
              />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <p className="text-2xl">No Agent Selected</p>
                <p>Create a new agent or select one from the list to begin.</p>
              </div>
            </div>
          )}
        </main>
      </div>
      {isHelpVisible && <HelpModal onClose={() => setHelpVisible(false)} />}
      {isADKConfigModalVisible && (
        <ADKConfigModal
          agent={selectedAgent}
          onClose={() => setADKConfigModalVisible(false)}
          onSave={handleUpdateAgentFromADK}
        />
      )}
    </div>
  );
};

export default App;
