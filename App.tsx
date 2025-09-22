
import React, { useState, useCallback, useEffect } from 'react';
import { PREDEFINED_AGENTS, PREDEFINED_PIPELINES } from './constants';
import type { Agent, Pipeline, ExecutionState, Message, PipelineMessage } from './types';
import Sidebar from './components/Sidebar';
import AgentEditor from './components/AgentEditor';
import AgentPlayground from './components/AgentPlayground';
import Header from './components/Header';
import HelpModal from './components/HelpModal';
import ADKConfigModal from './components/ADKConfigModal';
import CreateAgentModal from './components/CreateAgentModal';
import CreatePipelineModal from './components/CreatePipelineModal';
import { exportAppConfig, importAppConfig } from './utils/fileUtils';
import { generateAgentFromPrompt, generatePipelineFromPrompt, runAgent, runPipeline } from './services/geminiService';


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
      return savedPipelines ? JSON.parse(savedPipelines) : PREDEFINED_PIPELINES;
    } catch (error) {
      console.error("Failed to load pipelines from localStorage", error);
      return PREDEFINED_PIPELINES;
    }
  });
  
  // Centralized state for all agent/pipeline executions
  const [executionStates, setExecutionStates] = useState<Record<string, ExecutionState>>({});
  const executionControllers = React.useRef<Record<string, AbortController>>({});

  const [view, setView] = useState<'agents' | 'pipelines'>('agents');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(agents.length > 0 ? agents[0].id : null);
  const [isHelpVisible, setHelpVisible] = useState(false);
  const [isADKConfigModalVisible, setADKConfigModalVisible] = useState(false);
  const [isCreateAgentModalVisible, setCreateAgentModalVisible] = useState(false);
  const [isCreatePipelineModalVisible, setCreatePipelineModalVisible] = useState(false);


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
    const selectedItemExistsInCurrentView = currentList.some(item => item.id === selectedItemId);

    if (!selectedItemExistsInCurrentView) {
      if (view === 'agents') {
        setSelectedItemId(agents.length > 0 ? agents[0].id : null);
      } else if (view === 'pipelines') {
        setSelectedItemId(pipelines.length > 0 ? pipelines[0].id : null);
      }
    }
  }, [view, agents, pipelines, selectedItemId]);
  
  const handleStopExecution = useCallback((itemId: string) => {
      if (executionControllers.current[itemId]) {
        executionControllers.current[itemId].abort();
        delete executionControllers.current[itemId];
      }
  }, []);

  const handleRunAgent = useCallback(async (agent: Agent, userInput: string) => {
    handleStopExecution(agent.id); // Stop previous run if any
    
    const controller = new AbortController();
    executionControllers.current[agent.id] = controller;
    const stopSignal = controller.signal;

    const userMessage: Message = { id: `msg-${Date.now()}`, role: 'user', content: userInput };
    const agentMessage: Message = { id: `msg-${Date.now() + 1}`, role: 'agent', content: '', thinkingSteps: [] };
    
    setExecutionStates(prev => ({
      ...prev,
      [agent.id]: {
        id: agent.id, type: 'agent', status: 'running', userInput,
        history: [userMessage, agentMessage],
      }
    }));

    try {
      await runAgent(agent, userInput, agents, (step, isFinal) => {
        setExecutionStates(prev => {
          const current = prev[agent.id];
          if (current?.type !== 'agent') return prev;
          
          const updatedHistory = current.history.map(msg =>
            msg.id === agentMessage.id
            ? {
                ...msg,
                content: isFinal ? step.finalAnswer ?? "" : '',
                thinkingSteps: [...(msg.thinkingSteps ?? []), {
                  thought: step.thought, action: step.action, observation: step.observation
                }]
              }
            : msg
          );

          return {
            ...prev,
            [agent.id]: { ...current, history: updatedHistory },
          };
        });
      }, stopSignal);
      
      setExecutionStates(prev => {
        const current = prev[agent.id];
        if (current) return { ...prev, [agent.id]: { ...current, status: 'success' } };
        return prev;
      });

    } catch (error) {
       setExecutionStates(prev => {
         const current = prev[agent.id];
         if (!current) return prev;
         const isCancelled = error instanceof Error && error.name === 'AbortError';
         return {
           ...prev,
           [agent.id]: {
             ...current,
             status: isCancelled ? 'cancelled' : 'error',
             error: isCancelled ? "Execution was cancelled by the user." : (error instanceof Error ? error.message : 'Unknown error')
           }
         };
       });
    } finally {
        delete executionControllers.current[agent.id];
    }
  }, [agents, handleStopExecution]);

  const handleRunPipeline = useCallback(async (pipeline: Pipeline, userInput: string) => {
    handleStopExecution(pipeline.id); // Stop previous run if any
    
    const controller = new AbortController();
    executionControllers.current[pipeline.id] = controller;
    const stopSignal = controller.signal;

    const userMessage: PipelineMessage = { id: `p-msg-${Date.now()}`, role: 'user', input: userInput, steps: [] };
    const pipelineMessage: PipelineMessage = { id: `p-msg-${Date.now() + 1}`, role: 'pipeline', input: userInput, steps: [] };
    
    setExecutionStates(prev => ({
        ...prev,
        [pipeline.id]: {
            id: pipeline.id, type: 'pipeline', status: 'running', userInput,
            history: [userMessage, pipelineMessage]
        }
    }));

    try {
        await runPipeline(pipeline, userInput, agents, (step) => {
            setExecutionStates(prev => {
                const current = prev[pipeline.id];
                if (current?.type !== 'pipeline') return prev;
                const updatedHistory = current.history.map(msg => 
                    msg.id === pipelineMessage.id ? { ...msg, steps: [...msg.steps, step] } : msg
                );
                return { ...prev, [pipeline.id]: { ...current, history: updatedHistory } };
            });
        }, stopSignal);

        setExecutionStates(prev => {
          const current = prev[pipeline.id];
          if (current) return { ...prev, [pipeline.id]: { ...current, status: 'success' } };
          return prev;
        });

    } catch (error) {
        setExecutionStates(prev => {
           const current = prev[pipeline.id];
           if (!current) return prev;
           const isCancelled = error instanceof Error && error.name === 'AbortError';
           return {
               ...prev,
               [pipeline.id]: {
                   ...current,
                   status: isCancelled ? 'cancelled' : 'error',
                   error: isCancelled ? "Execution was cancelled by the user." : (error instanceof Error ? error.message : 'Unknown error')
               }
           };
       });
    } finally {
        delete executionControllers.current[pipeline.id];
    }
  }, [agents, handleStopExecution]);


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
      model: 'gemini-2.5-flash',
      temperature: 0.5,
      maxOutputTokens: 2048,
    };
    setAgents(prev => [...prev, newAgent]);
    setSelectedItemId(newAgent.id);
  }, []);

  const handleCreateAgentFromNaturalLanguage = useCallback(async (description: string) => {
    try {
      const agentData = await generateAgentFromPrompt(description);

      const allTools = [
        { name: 'GoogleSearch' as const, description: "Search Google for up-to-date information." },
        { name: 'HttpRequest' as const, description: "Make a GET request to a URL to fetch data, e.g., from an API." },
        { name: 'CodeInterpreter' as const, description: "Execute a snippet of JavaScript code.", warning: "Executes arbitrary code. Use with extreme caution as it can be insecure." },
        { name: 'WebBrowser' as const, description: "Get the main text content from a URL. Best for reading articles." },
      ];

      const newAgent: Agent = {
        ...agentData,
        id: `agent-${Date.now()}`,
        isPredefined: false,
        isMeta: false,
        subAgentIds: [],
        files: [],
        tools: allTools.map(toolDef => {
          const isEnabled = agentData.tools.some(t => t.name === toolDef.name && t.enabled);
          return { ...toolDef, enabled: isEnabled };
        }),
        model: agentData.model || 'gemini-2.5-flash',
        temperature: agentData.temperature || 0.5,
        maxOutputTokens: agentData.maxOutputTokens || 2048,
      };

      setAgents(prev => [...prev, newAgent]);
      setSelectedItemId(newAgent.id);
      setCreateAgentModalVisible(false);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      alert(`Failed to create agent: ${errorMessage}`);
      throw error; // Rethrow to be caught by the modal
    }
  }, []);


  const handleCreatePipelineFromNaturalLanguage = useCallback(async (description: string) => {
    try {
      const pipelineData = await generatePipelineFromPrompt(description, agents);
      const newPipeline: Pipeline = {
        id: `pipeline-${Date.now()}`,
        name: pipelineData.name || 'New AI Pipeline',
        description: pipelineData.description || 'Generated by AI',
        nodes: (pipelineData.steps || []).map((step, index) => ({
          id: `node-${Date.now()}-${index}`,
          agentId: step.agentId,
          position: { x: 50 + index * 300, y: 150 },
        })),
        edges: (pipelineData.steps || []).slice(0, -1).map((step, index) => ({
           id: `edge-${Date.now()}-${index}`,
           source: `node-${Date.now()}-${index}`,
           target: `node-${Date.now()}-${index+1}`,
        })),
      };

      setPipelines(prev => [...prev, newPipeline]);
      setSelectedItemId(newPipeline.id);
      setView('pipelines');
      setCreatePipelineModalVisible(false);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      alert(`Failed to create pipeline: ${errorMessage}`);
      throw error; // Rethrow to be caught by the modal
    }
  }, [agents]);

  const handleCreatePipeline = useCallback(() => {
    const newPipeline: Pipeline = {
      id: `pipeline-${Date.now()}`,
      name: 'New Pipeline',
      description: 'A new brilliant AI pipeline.',
      nodes: [],
      edges: [],
    };
    setPipelines(prev => [...prev, newPipeline]);
    setSelectedItemId(newPipeline.id);
    setView('pipelines');
  }, []);


  const handleUpdateAgent = useCallback((updatedAgent: Agent) => {
    setAgents(prev => prev.map(agent => agent.id === updatedAgent.id ? updatedAgent : agent));
  }, []);
  
  const handleUpdatePipeline = useCallback((updatedPipeline: Pipeline) => {
    setPipelines(prev => prev.map(p => p.id === updatedPipeline.id ? updatedPipeline : p));
  }, []);

  const handleDeleteAgent = useCallback((agentIdToDelete: string) => {
    setAgents(prev => {
        const updatedAgents = prev.filter(agent => agent.id !== agentIdToDelete);
        const finalAgents = updatedAgents.map(agent => {
            if (agent.isMeta && agent.subAgentIds?.includes(agentIdToDelete)) {
                return { ...agent, subAgentIds: agent.subAgentIds.filter(subId => subId !== agentIdToDelete) };
            }
            return agent;
        });
        if (selectedItemId === agentIdToDelete) setSelectedItemId(finalAgents.length > 0 ? finalAgents[0].id : null);
        return finalAgents;
    });
    setPipelines(currentPipelines =>
        currentPipelines.map(p => {
            const nodesToDelete = p.nodes.filter(node => node.agentId === agentIdToDelete).map(node => node.id);
            if (nodesToDelete.length === 0) return p;
            const nodesToDeleteSet = new Set(nodesToDelete);
            const newNodes = p.nodes.filter(node => node.agentId !== agentIdToDelete);
            const newEdges = p.edges.filter(edge => !nodesToDeleteSet.has(edge.source) && !nodesToDeleteSet.has(edge.target));
            return { ...p, nodes: newNodes, edges: newEdges };
        })
    );
    // Clean up execution state for the deleted agent
    setExecutionStates(prev => {
        const newState = { ...prev };
        delete newState[agentIdToDelete];
        return newState;
    });
  }, [selectedItemId, setPipelines]);

  const handleDeletePipeline = useCallback((id: string) => {
    setPipelines(prev => {
      const newPipelines = prev.filter(p => p.id !== id);
      if (selectedItemId === id) setSelectedItemId(newPipelines.length > 0 ? newPipelines[0].id : null);
      return newPipelines;
    });
    // Clean up execution state for the deleted pipeline
    setExecutionStates(prev => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
    });
  }, [selectedItemId]);

  const handleDuplicateAgent = useCallback((id: string) => {
    const agentToCopy = agents.find(a => a.id === id);
    if (!agentToCopy) return;
    const newAgent: Agent = { ...agentToCopy, id: `agent-${Date.now()}`, name: `${agentToCopy.name} (Copy)`, isPredefined: false, };
    setAgents(prev => [...prev, newAgent]);
    setSelectedItemId(newAgent.id);
  }, [agents]);

  const handleExportApp = useCallback(() => { exportAppConfig(agents, pipelines); }, [agents, pipelines]);

  const handleImportApp = useCallback(async (file: File) => {
    if (!window.confirm("This will overwrite your current agents and pipelines. Are you sure?")) return;
    try {
      const { agents: importedAgents, pipelines: importedPipelines } = await importAppConfig(file);
      setAgents(importedAgents);
      setPipelines(importedPipelines);
      setView('agents');
      setSelectedItemId(importedAgents.length > 0 ? importedAgents[0].id : null);
      setExecutionStates({}); // Clear all execution states on import
      alert("App configuration imported successfully!");
    } catch (error) {
      alert(`Error importing configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, []);

  const handleReorderAgents = useCallback((reorderedAgents: Agent[]) => { setAgents(reorderedAgents); }, []);

  const handleMoveAgent = useCallback((agentId: string, direction: 'up' | 'down') => {
    setAgents(prevAgents => {
        const predefinedAgents = prevAgents.filter(a => a.isPredefined);
        const customAgents = prevAgents.filter(a => !a.isPredefined);
        const currentIndex = customAgents.findIndex(a => a.id === agentId);
        if (currentIndex === -1) return prevAgents;
        const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        if (newIndex < 0 || newIndex >= customAgents.length) return prevAgents;
        const newCustomAgents = [...customAgents];
        [newCustomAgents[currentIndex], newCustomAgents[newIndex]] = [newCustomAgents[newIndex], newCustomAgents[currentIndex]];
        return [...predefinedAgents, ...newCustomAgents];
    });
  }, []);

  const selectedAgent = view === 'agents' ? agents.find(agent => agent.id === selectedItemId) ?? null : null;
  const selectedPipeline = view === 'pipelines' ? pipelines.find(p => p.id === selectedItemId) ?? null : null;
  const selectedItem = selectedAgent ?? selectedPipeline;

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-gray-100">
      <Header onImport={handleImportApp} onExport={handleExportApp} onShowADKConfig={() => setADKConfigModalVisible(true)} onShowHelp={() => setHelpVisible(true)} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          view={view}
          onSetView={setView}
          agents={agents}
          pipelines={pipelines}
          selectedItemId={selectedItemId}
          onSelectItem={handleSelectItem}
          onCreateAgent={handleCreateAgent}
          onShowCreateAgentModal={() => setCreateAgentModalVisible(true)}
          onShowCreatePipelineModal={() => setCreatePipelineModalVisible(true)}
          onDeleteAgent={handleDeleteAgent}
          onDuplicateAgent={handleDuplicateAgent}
          onCreatePipeline={handleCreatePipeline}
          onDeletePipeline={handleDeletePipeline}
          onReorderAgents={handleReorderAgents}
          onMoveAgent={handleMoveAgent}
          executionStates={executionStates}
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
                executionState={executionStates[selectedItem.id]}
                onRunAgent={handleRunAgent}
                onRunPipeline={handleRunPipeline}
                onStopExecution={handleStopExecution}
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
      {isADKConfigModalVisible && selectedAgent && (<ADKConfigModal agent={selectedAgent} onClose={() => setADKConfigModalVisible(false)} onSave={handleUpdateAgent} />)}
      {isCreateAgentModalVisible && (<CreateAgentModal onClose={() => setCreateAgentModalVisible(false)} onCreateAgent={handleCreateAgentFromNaturalLanguage} />)}
      {isCreatePipelineModalVisible && (<CreatePipelineModal onClose={() => setCreatePipelineModalVisible(false)} onCreatePipeline={handleCreatePipelineFromNaturalLanguage} />)}
    </div>
  );
};

export default App;
