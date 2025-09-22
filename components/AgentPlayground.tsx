
import React, { useState, useRef, useEffect } from 'react';
import type { Agent, Message, ReActStep, Pipeline, PipelineMessage, PipelineStep } from '../types';
import { runAgent, runPipeline } from '../services/geminiService';
import { Send, Bot, ChevronsRight, Download } from './icons/EditorIcons';
import { exportTextToFile } from '../utils/fileUtils';

interface PlaygroundProps {
  view: 'agents' | 'pipelines';
  item: Agent | Pipeline;
  allAgents: Agent[];
}

const AgentPlayground: React.FC<PlaygroundProps> = ({ view, item, allAgents }) => {
  if (view === 'agents') {
    return <AgentChatPlayground agent={item as Agent} allAgents={allAgents} />;
  }
  if (view === 'pipelines') {
    return <PipelineRunPlayground pipeline={item as Pipeline} allAgents={allAgents} />;
  }
  return null;
};


// --- AGENT CHAT PLAYGROUND ---

interface AgentChatPlaygroundProps {
  agent: Agent;
  allAgents: Agent[];
}

const AgentChatPlayground: React.FC<AgentChatPlaygroundProps> = ({ agent, allAgents }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); };

  useEffect(scrollToBottom, [messages]);
  
  useEffect(() => {
    setMessages([]);
  }, [agent]);

  const handleExportChat = () => {
    if (messages.length === 0) return;
    
    const chatContent = messages.map(message => {
      if (message.role === 'user') {
        return `[USER]\n${message.content}`;
      }
      
      let agentOutput = `[AGENT: ${agent.name}]\n`;
      if(message.thinkingSteps && message.thinkingSteps.length > 0) {
        agentOutput += message.thinkingSteps.map(step => {
          let stepText = `Thought: ${step.thought}`;
          if (step.action) stepText += `\nAction: ${step.action}`;
          if (step.observation) stepText += `\nObservation: ${step.observation}`;
          return stepText;
        }).join('\n---\n');
      }
      if (message.content) {
        agentOutput += `\n\nFinal Answer: ${message.content}`;
      }
      return agentOutput;

    }).join('\n\n================================\n\n');

    const filename = `${agent.name.replace(/\s+/g, '_').toLowerCase()}_chat_export.txt`;
    exportTextToFile(chatContent, filename);
  };


  const handleSendMessage = async (messageContent: string) => {
    if (!messageContent.trim() || isLoading) return;

    const userMessage: Message = { id: `msg-${Date.now()}`, role: 'user', content: messageContent };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const agentMessage: Message = { id: `msg-${Date.now() + 1}`, role: 'agent', content: '', thinkingSteps: [] };
    setMessages(prev => [...prev, agentMessage]);

    try {
      await runAgent(agent, messageContent, allAgents, (step, isFinal) => {
        setMessages(prev => prev.map(msg =>
          msg.id === agentMessage.id
          ? {
              ...msg,
              content: isFinal ? step.finalAnswer ?? "Sorry, I couldn't find an answer." : '',
              thinkingSteps: [...(msg.thinkingSteps ?? []), {
                thought: step.thought, action: step.action, observation: step.observation
              }]
            }
          : msg
        ));
      });
    } catch (error) {
       setMessages(prev => prev.map(msg =>
          msg.id === agentMessage.id
          ? { ...msg, content: `An error occurred: ${error instanceof Error ? error.message : 'Unknown error'}` }
          : msg
        ));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(input);
  };

  const handlePredefinedQuestionClick = (question: string) => {
    handleSendMessage(question);
  };


  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg flex flex-col overflow-hidden">
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bot className="w-6 h-6 text-gray-400" />
          <h3 className="text-lg font-semibold">Agent Playground</h3>
        </div>
        <button onClick={handleExportChat} disabled={messages.length === 0} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-gray-800 hover:bg-gray-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title="Export Chat">
          <Download className="w-4 h-4"/>
          Export Chat
        </button>
      </div>
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {messages.length === 0 && agent.predefinedQuestions && agent.predefinedQuestions.length > 0 && (
          <div className="p-4 bg-gray-800/50 rounded-lg">
            <h4 className="text-sm font-semibold text-gray-400 mb-3">Example Prompts</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {agent.predefinedQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handlePredefinedQuestionClick(q)}
                  disabled={isLoading}
                  className="text-left p-3 bg-gray-700/70 hover:bg-gray-700 rounded-md text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map(message => (
          <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
            {message.role === 'agent' && <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center shrink-0">{agent.avatar}</div>}
            <div className={`max-w-xl ${message.role === 'user' ? 'bg-indigo-600 text-white rounded-l-lg rounded-br-lg' : 'bg-gray-800 rounded-r-lg rounded-bl-lg'}`}>
              {message.thinkingSteps && message.thinkingSteps.length > 0 && (
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
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse delay-75"></div>
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse delay-150"></div>
                 </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t border-gray-800">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Chat with your agent..." disabled={isLoading} className="w-full bg-gray-800 border-gray-700 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 transition-colors disabled:opacity-50" />
          <button type="submit" disabled={isLoading} className="p-2 bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors">
            <Send className="w-5 h-5 text-white" />
          </button>
        </form>
      </div>
    </div>
  );
};


// --- PIPELINE RUN PLAYGROUND ---

interface PipelineRunPlaygroundProps {
  pipeline: Pipeline;
  allAgents: Agent[];
}

const PipelineRunPlayground: React.FC<PipelineRunPlaygroundProps> = ({ pipeline, allAgents }) => {
  const [messages, setMessages] = useState<PipelineMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); };
  useEffect(scrollToBottom, [messages]);
  useEffect(() => { setMessages([]); }, [pipeline]);

  const runPipelineFromInput = async (messageContent: string) => {
    if (!messageContent.trim() || isLoading || pipeline.steps.length === 0) return;

    const userMessage: PipelineMessage = { id: `p-msg-${Date.now()}`, role: 'user', input: messageContent, steps: [] };
    const pipelineMessage: PipelineMessage = { id: `p-msg-${Date.now() + 1}`, role: 'pipeline', input: messageContent, steps: [] };
    setMessages([userMessage, pipelineMessage]);
    
    setInput('');
    setIsLoading(true);

    try {
      await runPipeline(pipeline, messageContent, allAgents, (step) => {
        setMessages(prev => prev.map(msg => msg.id === pipelineMessage.id ? { ...msg, steps: [...msg.steps, step] } : msg));
      });
    } catch (error) {
      setMessages(prev => prev.map(msg => msg.id === pipelineMessage.id ? { ...msg, error: error instanceof Error ? error.message : 'Unknown error' } : msg));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runPipelineFromInput(input);
  };

  const handlePredefinedQuestionClick = (question: string) => {
    runPipelineFromInput(question);
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg flex flex-col overflow-hidden">
      <div className="p-4 border-b border-gray-800 flex items-center gap-3">
        <ChevronsRight className="w-6 h-6 text-gray-400" />
        <h3 className="text-lg font-semibold">Pipeline Playground</h3>
      </div>
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {messages.length === 0 && pipeline.predefinedQuestions && pipeline.predefinedQuestions.length > 0 && (
          <div className="p-4 bg-gray-800/50 rounded-lg">
            <h4 className="text-sm font-semibold text-gray-400 mb-3">Example Prompts</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {pipeline.predefinedQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handlePredefinedQuestionClick(q)}
                  disabled={isLoading}
                  className="text-left p-3 bg-gray-700/70 hover:bg-gray-700 rounded-md text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map(message => (
          message.role === 'user' ? (
            <div key={message.id} className="flex justify-end">
              <div className="p-3 bg-indigo-600 text-white rounded-l-lg rounded-br-lg max-w-xl">{message.input}</div>
            </div>
          ) : (
            <div key={message.id} className="space-y-4">
              {message.steps.map((step, index) => (
                <div key={index} className="bg-gray-800 rounded-lg overflow-hidden">
                  <div className="p-3 bg-gray-800/50 flex items-center gap-3">
                     <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-700 text-indigo-300 font-bold">{index + 1}</div>
                     <div>
                        <p className="font-bold text-lg">{allAgents.find(a => a.id === step.agentId)?.avatar} {step.agentName}</p>
                        <p className="text-xs text-gray-400">Executing Step {index + 1}</p>
                     </div>
                  </div>
                  {step.thinkingSteps && step.thinkingSteps.length > 0 && (
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
                  <div className="p-3 bg-gray-900/50">
                    <details>
                        <summary className="cursor-pointer text-xs text-gray-400 font-semibold">View Input</summary>
                        <p className="mt-2 text-sm text-gray-300 bg-black/20 p-2 rounded">{step.input}</p>
                    </details>
                  </div>
                  <div className="p-3 font-semibold">Final Output:</div>
                  <div className="p-3 pt-0">{step.output}</div>
                </div>
              ))}
              {isLoading && message.steps.length < pipeline.steps.length && (
                 <div className="p-3 flex items-center gap-2 text-gray-400 bg-gray-800 rounded-lg">
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse delay-75"></div>
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse delay-150"></div>
                    <span className="text-sm">Running pipeline... (Step {message.steps.length + 1} of {pipeline.steps.length})</span>
                 </div>
              )}
              {message.error && <div className="p-3 bg-red-900/50 text-red-300 rounded-lg">Error: {message.error}</div>}
            </div>
          )
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t border-gray-800">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Provide initial input for the pipeline..." disabled={isLoading || pipeline.steps.length === 0} className="w-full bg-gray-800 border-gray-700 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 transition-colors disabled:opacity-50" />
          <button type="submit" disabled={isLoading || pipeline.steps.length === 0} className="p-2 bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors">
            <ChevronsRight className="w-5 h-5 text-white" />
          </button>
        </form>
        {pipeline.steps.length === 0 && <p className="text-xs text-yellow-500 text-center mt-2">This pipeline is empty. Add agents in the editor to run it.</p>}
      </div>
    </div>
  );
}


export default AgentPlayground;