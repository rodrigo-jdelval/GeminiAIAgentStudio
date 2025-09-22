
import React, { useState, useRef, useEffect } from 'react';
import type { Agent, Message, Pipeline, PipelineMessage, ExecutionState, AgentExecutionState, PipelineExecutionState } from '../types';
import { Send, Bot, ChevronsRight, Download, Square } from './icons/EditorIcons';
import { exportTextToFile } from '../utils/fileUtils';
import MarkdownRenderer from './MarkdownRenderer';

interface PlaygroundProps {
  view: 'agents' | 'pipelines';
  item: Agent | Pipeline;
  allAgents: Agent[];
  executionState: ExecutionState | undefined;
  onRunAgent: (agent: Agent, userInput: string) => void;
  onRunPipeline: (pipeline: Pipeline, userInput: string) => void;
  onStopExecution: (itemId: string) => void;
}

const AgentPlayground: React.FC<PlaygroundProps> = (props) => {
  if (props.view === 'agents') {
    return <AgentChatPlayground agent={props.item as Agent} {...props} />;
  }
  if (props.view === 'pipelines') {
    return <PipelineRunPlayground pipeline={props.item as Pipeline} {...props} />;
  }
  return null;
};

// --- AGENT CHAT PLAYGROUND ---

const AgentChatPlayground: React.FC<Omit<PlaygroundProps, 'item'> & { agent: Agent }> = ({ agent, allAgents, executionState, onRunAgent, onStopExecution }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const agentExecutionState = executionState as AgentExecutionState | undefined;
  const messages = agentExecutionState?.history ?? [];
  const isLoading = agentExecutionState?.status === 'running';

  const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); };
  useEffect(scrollToBottom, [messages]);

  const handleExportChat = () => {
    if (messages.length === 0) return;
    const chatContent = messages.map(message => {
      if (message.role === 'user') return `[USER]\n${message.content}`;
      let agentOutput = `[AGENT: ${agent.name}]\n`;
      if (message.thinkingSteps?.length) {
        agentOutput += message.thinkingSteps.map(step => `Thought: ${step.thought}\n` + (step.action ? `Action: ${step.action}\n` : '') + (step.observation ? `Observation: ${step.observation}` : '')).join('\n---\n');
      }
      if (message.content) agentOutput += `\n\nFinal Answer: ${message.content}`;
      return agentOutput;
    }).join('\n\n================================\n\n');
    exportTextToFile(chatContent, `${agent.name.replace(/\s+/g, '_').toLowerCase()}_chat_export.txt`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onRunAgent(agent, input);
    setInput('');
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg flex flex-col overflow-hidden">
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-3"><Bot className="w-6 h-6 text-gray-400" /><h3 className="text-lg font-semibold">Agent Playground</h3></div>
        <button onClick={handleExportChat} disabled={messages.length === 0} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-gray-800 hover:bg-gray-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title="Export Chat">
          <Download className="w-4 h-4"/>Export Chat
        </button>
      </div>
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {messages.length === 0 && agent.predefinedQuestions?.length && (
          <div className="p-4 bg-gray-800/50 rounded-lg">
            <h4 className="text-sm font-semibold text-gray-400 mb-3">Example Prompts</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {agent.predefinedQuestions.map((q, i) => (
                <button key={i} onClick={() => onRunAgent(agent, q)} disabled={isLoading} className="text-left p-3 bg-gray-700/70 hover:bg-gray-700 rounded-md text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed">{q}</button>
              ))}
            </div>
          </div>
        )}
        {messages.map(message => (
          <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
            {message.role === 'agent' && <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center shrink-0">{agent.avatar}</div>}
            <div className={`max-w-xl ${message.role === 'user' ? 'bg-indigo-600 text-white rounded-l-lg rounded-br-lg' : 'bg-gray-800 rounded-r-lg rounded-bl-lg'}`}>
              {message.thinkingSteps?.length && (
                <div className="p-3 border-b border-gray-700 space-y-3">
                  {message.thinkingSteps.map((step, index) => (
                    <div key={index} className="text-xs text-gray-400 font-mono">
                      <p><span className="font-semibold text-purple-400">Thought:</span> {step.thought}</p>
                      {step.action && <p><span className="font-semibold text-green-400">Action:</span> {step.action}</p>}
                      {step.observation && <p className="bg-gray-900/50 p-2 rounded mt-1"><span className="font-semibold text-yellow-400">Observation:</span> {step.observation}</p>}
                    </div>
                  ))}
                </div>
              )}
              {message.content && <div className="p-3">{message.content}</div>}
              {isLoading && message.role === 'agent' && !message.content && (
                 <div className="p-3 flex items-center gap-2 text-gray-400">
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div><div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse delay-75"></div><div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse delay-150"></div>
                 </div>
              )}
            </div>
          </div>
        ))}
        {agentExecutionState?.status === 'error' && <div className="p-3 bg-red-900/50 text-red-300 rounded-lg">Error: {agentExecutionState.error}</div>}
        {agentExecutionState?.status === 'cancelled' && <div className="p-3 bg-yellow-900/50 text-yellow-300 rounded-lg">{agentExecutionState.error}</div>}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t border-gray-800">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Chat with your agent..." disabled={isLoading} className="w-full bg-gray-800 border-gray-700 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 transition-colors disabled:opacity-50" />
          {isLoading ? (
            <button type="button" onClick={() => onStopExecution(agent.id)} className="p-2 bg-red-600 rounded-md hover:bg-red-700 transition-colors" title="Stop Execution"><Square className="w-5 h-5 text-white" /></button>
          ) : (
            <button type="submit" disabled={!input.trim()} className="p-2 bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"><Send className="w-5 h-5 text-white" /></button>
          )}
        </form>
      </div>
    </div>
  );
};

// --- PIPELINE RUN PLAYGROUND ---

const PipelineRunPlayground: React.FC<Omit<PlaygroundProps, 'item'> & { pipeline: Pipeline }> = ({ pipeline, allAgents, executionState, onRunPipeline, onStopExecution }) => {
  const [input, setInput] = useState('');
  const [rawViewSteps, setRawViewSteps] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const pipelineExecutionState = executionState as PipelineExecutionState | undefined;
  const messages = pipelineExecutionState?.history ?? [];
  const isLoading = pipelineExecutionState?.status === 'running';

  const toggleRawView = (nodeId: string) => setRawViewSteps(prev => ({ ...prev, [nodeId]: !prev[nodeId] }));

  const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); };
  useEffect(scrollToBottom, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || pipeline.nodes.length === 0) return;
    onRunPipeline(pipeline, input);
    setInput('');
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg flex flex-col overflow-hidden">
      <div className="p-4 border-b border-gray-800 flex items-center gap-3"><ChevronsRight className="w-6 h-6 text-gray-400" /><h3 className="text-lg font-semibold">Pipeline Playground</h3></div>
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {messages.length === 0 && pipeline.predefinedQuestions?.length && (
          <div className="p-4 bg-gray-800/50 rounded-lg">
            <h4 className="text-sm font-semibold text-gray-400 mb-3">Example Prompts</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {pipeline.predefinedQuestions.map((q, i) => (
                <button key={i} onClick={() => onRunPipeline(pipeline, q)} disabled={isLoading} className="text-left p-3 bg-gray-700/70 hover:bg-gray-700 rounded-md text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed">{q}</button>
              ))}
            </div>
          </div>
        )}
        {messages.map(message =>
          message.role === 'user' ? (
            <div key={message.id} className="flex justify-end"><div className="p-3 bg-indigo-600 text-white rounded-l-lg rounded-br-lg max-w-xl">{message.input}</div></div>
          ) : (
            <div key={message.id} className="space-y-4">
              {message.steps.map((step, index) => (
                <div key={index} className="bg-gray-800 rounded-lg overflow-hidden">
                  <div className="p-3 bg-gray-800/50 flex items-center gap-3">
                     <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-700 text-indigo-300 font-bold">{index + 1}</div>
                     <div><p className="font-bold text-lg">{allAgents.find(a => a.id === step.agentId)?.avatar} {step.agentName}</p><p className="text-xs text-gray-400">Executing Step {index + 1}</p></div>
                  </div>
                  {step.thinkingSteps?.length && (
                    <div className="p-3 border-y border-gray-700 space-y-3 max-h-48 overflow-y-auto">
                      {step.thinkingSteps.map((s, i) => (
                        <div key={i} className="text-xs text-gray-400 font-mono">
                          <p><span className="font-semibold text-purple-400">Thought:</span> {s.thought}</p>
                          {s.action && <p><span className="font-semibold text-green-400">Action:</span> {s.action}</p>}
                          {s.observation && <p className="bg-gray-900/50 p-2 rounded mt-1"><span className="font-semibold text-yellow-400">Observation:</span> {s.observation}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="p-3 bg-gray-900/50"><details><summary className="cursor-pointer text-xs text-gray-400 font-semibold">View Input</summary><p className="mt-2 text-sm text-gray-300 bg-black/20 p-2 rounded">{step.input}</p></details></div>
                  <div className="p-3 font-semibold flex justify-between items-center">
                    <span>Final Output:</span>
                    {step.agentId === 'agent-data-visualizer-16' && (<label className="flex items-center gap-2 text-xs font-normal cursor-pointer text-gray-400"><input type="checkbox" checked={rawViewSteps[step.nodeId] || false} onChange={() => toggleRawView(step.nodeId)} className="w-4 h-4 rounded text-indigo-500 bg-gray-700 border-gray-600 focus:ring-indigo-600"/>Show Raw Text</label>)}
                  </div>
                  <div className="p-3 pt-0 prose prose-invert prose-sm max-w-none">
                     {rawViewSteps[step.nodeId] ? <pre className="whitespace-pre-wrap text-xs text-gray-300 bg-black/20 p-2 rounded"><code>{step.output}</code></pre> : <MarkdownRenderer content={step.output} />}
                  </div>
                </div>
              ))}
              {isLoading && message.steps.length < pipeline.nodes.length && (
                 <div className="p-3 flex items-center gap-2 text-gray-400 bg-gray-800 rounded-lg">
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div><div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse delay-75"></div><div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse delay-150"></div>
                    <span className="text-sm">Running pipeline... (Step {message.steps.length + 1} of {pipeline.nodes.length})</span>
                 </div>
              )}
              {pipelineExecutionState?.status === 'error' && <div className="p-3 bg-red-900/50 text-red-300 rounded-lg">Error: {pipelineExecutionState.error}</div>}
              {pipelineExecutionState?.status === 'cancelled' && <div className="p-3 bg-yellow-900/50 text-yellow-300 rounded-lg">{pipelineExecutionState.error}</div>}
            </div>
          )
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t border-gray-800">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Provide initial input for the pipeline..." disabled={isLoading || pipeline.nodes.length === 0} className="w-full bg-gray-800 border-gray-700 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 transition-colors disabled:opacity-50" />
          {isLoading ? (
            <button type="button" onClick={() => onStopExecution(pipeline.id)} className="p-2 bg-red-600 rounded-md hover:bg-red-700 transition-colors" title="Stop Execution"><Square className="w-5 h-5 text-white" /></button>
          ) : (
            <button type="submit" disabled={!input.trim() || pipeline.nodes.length === 0} className="p-2 bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"><ChevronsRight className="w-5 h-5 text-white" /></button>
          )}
        </form>
        {pipeline.nodes.length === 0 && <p className="text-xs text-yellow-500 text-center mt-2">This pipeline is empty. Add agents in the editor to run it.</p>}
      </div>
    </div>
  );
}

export default AgentPlayground;
