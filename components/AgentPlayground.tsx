
import React, { useState, useRef, useEffect } from 'react';
import type { Agent, Message, ReActStep } from '../types';
import { runAgent } from '../services/geminiService';
import { Send, Bot } from './icons/EditorIcons';

interface AgentPlaygroundProps {
  agent: Agent;
}

const AgentPlayground: React.FC<AgentPlaygroundProps> = ({ agent }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);
  
  useEffect(() => {
    // Clear chat when agent changes
    setMessages([]);
  }, [agent]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input,
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    const agentMessage: Message = {
      id: `msg-${Date.now() + 1}`,
      role: 'agent',
      content: '',
      thinkingSteps: [],
    };
    
    setMessages(prev => [...prev, agentMessage]);

    try {
      await runAgent(agent, input, (step, isFinal) => {
        setMessages(prev => prev.map(msg => 
          msg.id === agentMessage.id 
          ? {
              ...msg,
              content: isFinal ? step.finalAnswer ?? "Sorry, I couldn't find an answer." : '',
              thinkingSteps: [...(msg.thinkingSteps ?? []), {
                thought: step.thought,
                action: step.action,
                observation: step.observation
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

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg flex flex-col overflow-hidden">
      <div className="p-4 border-b border-gray-800 flex items-center gap-3">
        <Bot className="w-6 h-6 text-gray-400" />
        <h3 className="text-lg font-semibold">Agent Playground</h3>
      </div>
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
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
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Chat with your agent..."
            disabled={isLoading}
            className="w-full bg-gray-800 border-gray-700 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 transition-colors disabled:opacity-50"
          />
          <button type="submit" disabled={isLoading} className="p-2 bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors">
            <Send className="w-5 h-5 text-white" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default AgentPlayground;
