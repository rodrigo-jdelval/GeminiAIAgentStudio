
import React, { useState, useEffect, useRef } from 'react';
import type { Agent, Pipeline, Tool, KnowledgeFile, PipelineStepConfig } from '../types';
import { Info, Paperclip, FileText, Trash2, Tag, ChevronsRight, X, Link2, Unlink2 } from './icons/EditorIcons';

interface EditorProps {
  view: 'agents' | 'pipelines';
  item: Agent | Pipeline;
  allAgents: Agent[];
  onUpdateAgent: (agent: Agent) => void;
  onUpdatePipeline: (pipeline: Pipeline) => void;
}

const MAX_FILE_SIZE_MB = 1;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const SUPPORTED_FILE_TYPES = ['text/plain', 'text/markdown', 'application/json', 'text/csv', 'application/pdf'];

const AgentEditor: React.FC<EditorProps> = ({ view, item, allAgents, onUpdateAgent, onUpdatePipeline }) => {
  
  if (view === 'agents') {
    return <AgentEditorForm agent={item as Agent} onUpdateAgent={onUpdateAgent} allAgents={allAgents} />;
  }
  if (view === 'pipelines') {
    return <PipelineEditorForm pipeline={item as Pipeline} onUpdatePipeline={onUpdatePipeline} allAgents={allAgents} />;
  }
  return null;
};


// --- AGENT EDITOR ---

interface AgentEditorFormProps {
  agent: Agent;
  allAgents: Agent[];
  onUpdateAgent: (agent: Agent) => void;
}

const AgentEditorForm: React.FC<AgentEditorFormProps> = ({ agent, allAgents, onUpdateAgent }) => {
  const [formData, setFormData] = useState<Agent>(agent);
  const [tagInput, setTagInput] = useState('');

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

  const handleMetaAgentToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isMeta = e.target.checked;
    const updatedAgent = { 
      ...formData, 
      isMeta,
      subAgentIds: isMeta ? formData.subAgentIds || [] : []
    };
    setFormData(updatedAgent);
    onUpdateAgent(updatedAgent);
  };

  const handleSubAgentToggle = (subAgentId: string) => {
    const currentSubAgentIds = formData.subAgentIds || [];
    const updatedSubAgentIds = currentSubAgentIds.includes(subAgentId)
      ? currentSubAgentIds.filter(id => id !== subAgentId)
      : [...currentSubAgentIds, subAgentId];
    
    const updatedAgent = { ...formData, subAgentIds: updatedSubAgentIds };
    setFormData(updatedAgent);
    onUpdateAgent(updatedAgent);
  };

  const handleTagChange = (tags: string[]) => {
    const updatedAgent = { ...formData, tags };
    setFormData(updatedAgent);
    onUpdateAgent(updatedAgent);
  };

  const addTags = () => {
    if (!tagInput.trim()) return;
    const newTags = tagInput.split(',').map(t => t.trim().toLowerCase()).filter(t => t);
    const currentTags = formData.tags || [];
    const uniqueNewTags = newTags.filter(t => !currentTags.includes(t));
    if (uniqueNewTags.length > 0) {
      handleTagChange([...currentTags, ...uniqueNewTags]);
    }
    setTagInput('');
  };

  const removeTag = (tagToRemove: string) => {
    handleTagChange((formData.tags || []).filter(t => t !== tagToRemove));
  };


  const handleFileAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        alert(`File "${file.name}" is too large. Max size is ${MAX_FILE_SIZE_MB}MB.`);
        return;
      }
      if (!SUPPORTED_FILE_TYPES.includes(file.type) && !file.name.endsWith('.md')) {
        alert(`File type for "${file.name}" is not supported. Please use .txt, .md, .json, .csv, or .pdf.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        let newFile: KnowledgeFile;

        if (file.type === 'application/pdf') {
            const base64Content = result.split(',')[1];
            newFile = {
                id: `file-${Date.now()}-${file.name}`, name: file.name, content: '',
                base64Content: base64Content, mimeType: file.type,
            };
        } else {
            newFile = {
                id: `file-${Date.now()}-${file.name}`, name: file.name,
                content: result, mimeType: file.type || 'text/plain',
            };
        }

        const updatedAgent = { ...formData, files: [...(formData.files || []), newFile] };
        setFormData(updatedAgent);
        onUpdateAgent(updatedAgent);
      };
      reader.onerror = () => alert(`Error reading file "${file.name}".`);

      if (file.type === 'application/pdf') reader.readAsDataURL(file);
      else reader.readAsText(file);
    });
    e.target.value = '';
  };

  const handleFileDelete = (fileId: string) => {
    const updatedFiles = formData.files?.filter(file => file.id !== fileId);
    const updatedAgent = { ...formData, files: updatedFiles };
    setFormData(updatedAgent);
    onUpdateAgent(updatedAgent);
  };
  const isReadOnly = agent.isPredefined;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg flex flex-col overflow-hidden">
      <div className="p-4 border-b border-gray-800"><h3 className="text-lg font-semibold">Agent Editor</h3>
        {isReadOnly && (<p className="text-xs text-yellow-400 flex items-center gap-1 mt-1"><Info className="w-3 h-3" /> Predefined agents are not editable. Duplicate to customize.</p>)}
      </div>
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        <div><label htmlFor="name" className="block text-sm font-medium text-gray-400 mb-1">Name</label><input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} disabled={isReadOnly} className="w-full bg-gray-800 border-gray-700 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 transition-colors disabled:opacity-50" /></div>
        <div><label htmlFor="description" className="block text-sm font-medium text-gray-400 mb-1">Description</label><textarea id="description" name="description" rows={2} value={formData.description} onChange={handleInputChange} disabled={isReadOnly} className="w-full bg-gray-800 border-gray-700 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 transition-colors disabled:opacity-50" /></div>
        
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Tags</label>
          <div className="bg-gray-800 p-2 rounded-md">
            <div className="flex flex-wrap gap-2">
              {(formData.tags || []).map(tag => (
                <div key={tag} className="flex items-center gap-1 bg-indigo-600/50 text-indigo-100 text-xs font-semibold px-2 py-1 rounded-full">
                  <span>{tag}</span>
                  {!isReadOnly && <button onClick={() => removeTag(tag)} className="text-indigo-200 hover:text-white"><X className="w-3 h-3"/></button>}
                </div>
              ))}
            </div>
            {!isReadOnly && (
              <div className="flex gap-2 mt-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addTags()}
                  placeholder="Add tags, comma-separated..."
                  className="flex-1 bg-gray-700 border-gray-600 rounded-md p-1.5 text-sm focus:ring-2 focus:ring-indigo-500"
                />
                <button onClick={addTags} className="px-3 py-1.5 bg-gray-600 hover:bg-gray-500 rounded-md text-sm font-medium">Add</button>
              </div>
            )}
          </div>
        </div>

        <div><label htmlFor="systemPrompt" className="block text-sm font-medium text-gray-400 mb-1">System Prompt (Instructions)</label><textarea id="systemPrompt" name="systemPrompt" rows={8} value={formData.systemPrompt} onChange={handleInputChange} disabled={isReadOnly} className="w-full bg-gray-800 border-gray-700 rounded-md p-2 font-mono text-sm leading-relaxed focus:ring-2 focus:ring-indigo-500 transition-colors disabled:opacity-50" /></div>
        <div><h4 className="text-sm font-medium text-gray-400 mb-2">Tools</h4><div className="space-y-2">{formData.tools.map(tool => (<div key={tool.name} className="flex items-center justify-between bg-gray-800 p-3 rounded-md"><div><p className="font-semibold flex items-center gap-2">{tool.name}{tool.warning && (<span title={tool.warning}><Info className="w-4 h-4 text-yellow-400 cursor-help" /></span>)}</p><p className="text-xs text-gray-400">{tool.description}</p></div><label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" checked={tool.enabled} onChange={() => handleToolToggle(tool.name)} className="sr-only peer" disabled={isReadOnly}/><div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-indigo-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 peer-disabled:opacity-50"></div></label></div>))}</div></div>
        <div><h4 className="text-sm font-medium text-gray-400 mb-2">Meta Agent Configuration</h4><div className="bg-gray-800 p-3 rounded-md"><div className="flex items-center justify-between"><div><p className="font-semibold">Is Meta Agent?</p><p className="text-xs text-gray-400">Allows this agent to call other agents as tools.</p></div><label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" checked={formData.isMeta || false} onChange={handleMetaAgentToggle} className="sr-only peer" disabled={isReadOnly}/><div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-indigo-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 peer-disabled:opacity-50"></div></label></div>{formData.isMeta && (<div className="mt-4 pt-3 border-t border-gray-700"><h5 className="text-xs font-semibold text-gray-400 mb-2">Callable Agents</h5><div className="space-y-2 max-h-32 overflow-y-auto">{allAgents.filter(a => a.id !== agent.id).map(subAgent => (<div key={subAgent.id} className="flex items-center justify-between"><p className="text-sm">{subAgent.avatar} {subAgent.name}</p><label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" checked={(formData.subAgentIds || []).includes(subAgent.id)} onChange={() => handleSubAgentToggle(subAgent.id)} className="sr-only peer" disabled={isReadOnly} /><div className="w-9 h-5 bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-indigo-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600 peer-disabled:opacity-50"></div></label></div>))}{allAgents.length <= 1 && <p className="text-xs text-gray-500">No other agents available to call.</p>}</div></div>)}</div></div>
        <div><h4 className="text-sm font-medium text-gray-400 mb-2">Knowledge Base</h4><div className="space-y-2">{formData.files && formData.files.length > 0 && (<div className="space-y-2">{formData.files.map(file => (<div key={file.id} className="flex items-center justify-between bg-gray-800 p-2 pl-3 rounded-md text-sm"><div className="flex items-center gap-2 overflow-hidden"><FileText className="w-4 h-4 text-gray-400 shrink-0" /><span className="truncate" title={file.name}>{file.name}</span></div><button onClick={() => handleFileDelete(file.id)} className="p-1 text-gray-400 hover:text-white hover:bg-red-500/50 rounded-md disabled:opacity-50 disabled:cursor-not-allowed" title="Delete File"><Trash2 className="w-4 h-4" /></button></div>))}</div>)}<input type="file" id="file-upload" multiple onChange={handleFileAdd} className="hidden" accept=".txt,.md,.json,.csv,.pdf" /><label htmlFor="file-upload" className="flex items-center justify-center gap-2 w-full px-3 py-2 text-sm font-medium border-2 border-dashed rounded-md transition-colors bg-gray-800/50 border-gray-700 hover:bg-gray-800 hover:border-gray-600 cursor-pointer"><Paperclip className="w-4 h-4" /> Add File</label><p className="text-xs text-gray-500 text-center">Attach .txt, .md, .json, .csv, or .pdf files to provide context. Max {MAX_FILE_SIZE_MB}MB per file.</p></div></div>
      </div>
    </div>
  );
}


// --- PIPELINE EDITOR ---

interface PipelineEditorFormProps {
  pipeline: Pipeline;
  allAgents: Agent[];
  onUpdatePipeline: (pipeline: Pipeline) => void;
}

const PipelineEditorForm: React.FC<PipelineEditorFormProps> = ({ pipeline, allAgents, onUpdatePipeline }) => {
  const [formData, setFormData] = useState<Pipeline>(pipeline);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  useEffect(() => {
    setFormData(pipeline);
  }, [pipeline]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const updatedPipeline = { ...formData, [name]: value };
    setFormData(updatedPipeline);
    onUpdatePipeline(updatedPipeline);
  };
  
  const addAgentToPipeline = (agentId: string) => {
    const newStep: PipelineStepConfig = {
      agentId,
      includePreviousOutput: formData.steps.length > 0, // Default to true if not the first agent
    };
    const updatedPipeline = { ...formData, steps: [...formData.steps, newStep] };
    setFormData(updatedPipeline);
    onUpdatePipeline(updatedPipeline);
  };
  
  const removeAgentFromPipeline = (index: number) => {
    const updatedSteps = [...formData.steps];
    updatedSteps.splice(index, 1);
    const updatedPipeline = { ...formData, steps: updatedSteps };
    setFormData(updatedPipeline);
    onUpdatePipeline(updatedPipeline);
  };

  const toggleLink = (index: number) => {
    const updatedSteps = [...formData.steps];
    if (updatedSteps[index]) {
      updatedSteps[index].includePreviousOutput = !updatedSteps[index].includePreviousOutput;
      const updatedPipeline = { ...formData, steps: updatedSteps };
      setFormData(updatedPipeline);
      onUpdatePipeline(updatedPipeline);
    }
  };
  
  const handleDragSort = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    const newSteps = [...formData.steps];
    const draggedItemContent = newSteps.splice(dragItem.current, 1)[0];
    newSteps.splice(dragOverItem.current, 0, draggedItemContent);
    dragItem.current = null;
    dragOverItem.current = null;
    
    const updatedPipeline = { ...formData, steps: newSteps };
    setFormData(updatedPipeline);
    onUpdatePipeline(updatedPipeline);
  };

  const pipelineAgents = formData.steps.map(step => ({
    ...step,
    agent: allAgents.find(a => a.id === step.agentId)
  })).filter(item => item.agent) as (PipelineStepConfig & { agent: Agent })[];

  const availableAgents = allAgents.filter(a => !formData.steps.some(step => step.agentId === a.id));

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg flex flex-col overflow-hidden">
      <div className="p-4 border-b border-gray-800"><h3 className="text-lg font-semibold">Pipeline Editor</h3></div>
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        <div><label htmlFor="name" className="block text-sm font-medium text-gray-400 mb-1">Pipeline Name</label><input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} className="w-full bg-gray-800 border-gray-700 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 transition-colors" /></div>
        <div><label htmlFor="description" className="block text-sm font-medium text-gray-400 mb-1">Description</label><textarea id="description" name="description" rows={2} value={formData.description} onChange={handleInputChange} className="w-full bg-gray-800 border-gray-700 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 transition-colors" /></div>
        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-2">Pipeline Flow</h4>
          <div className="bg-gray-800 p-3 rounded-md min-h-[120px]">
            {pipelineAgents.length > 0 ? (
              <div className="flex items-center gap-2 flex-wrap">
                {pipelineAgents.map((step, index) => (
                  <React.Fragment key={`${step.agentId}-${index}`}>
                    <div 
                      draggable
                      onDragStart={() => dragItem.current = index}
                      onDragEnter={() => dragOverItem.current = index}
                      onDragEnd={handleDragSort}
                      onDragOver={(e) => e.preventDefault()}
                      className="flex items-center gap-3 bg-gray-900 p-2 rounded-md cursor-grab active:cursor-grabbing"
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-700 text-indigo-300 font-bold flex-shrink-0">{index + 1}</div>
                      <div className="flex-1 flex items-center gap-2">
                        <span className="text-xl">{step.agent.avatar}</span>
                        <span className="font-semibold text-sm truncate">{step.agent.name}</span>
                      </div>
                      <button onClick={() => removeAgentFromPipeline(index)} className="p-1 text-gray-400 hover:text-white hover:bg-red-500/50 rounded-md"><Trash2 className="w-4 h-4" /></button>
                    </div>

                    {index < pipelineAgents.length - 1 && (
                      <div className="flex flex-col items-center">
                         <button onClick={() => toggleLink(index + 1)} className="p-1 text-gray-400 hover:text-white rounded-md" title={formData.steps[index + 1].includePreviousOutput ? 'Unlink: Use original input' : 'Link: Use previous output'}>
                           {formData.steps[index + 1].includePreviousOutput ? <Link2 className="w-5 h-5 text-indigo-400" /> : <Unlink2 className="w-5 h-5" />}
                         </button>
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-center text-gray-500 text-sm py-10">This pipeline is empty. Add agents from the list below.</div>
            )}
          </div>
        </div>
        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-2">Available Agents</h4>
          <div className="space-y-2">
            {availableAgents.length > 0 ? (
              availableAgents.map(agent => (
                <div key={agent.id} className="flex items-center justify-between bg-gray-800 p-3 rounded-md">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{agent.avatar}</span>
                    <p className="font-semibold">{agent.name}</p>
                  </div>
                  <button onClick={() => addAgentToPipeline(agent.id)} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 rounded-md text-sm font-medium">Add</button>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 text-sm py-2">No more agents available to add.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AgentEditor;