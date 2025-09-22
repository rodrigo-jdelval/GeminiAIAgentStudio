import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Agent, Pipeline, Tool, KnowledgeFile, PipelineNode, PipelineEdge } from '../types';
import { Info, Paperclip, FileText, Trash2, Tag, X } from './icons/EditorIcons';

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const updatedAgent = { ...formData, [name]: (name === 'temperature' || name === 'maxOutputTokens') ? Number(value) : value };
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

        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-2">Model Configuration</h4>
          <div className="space-y-3 bg-gray-800 p-3 rounded-md">
            <div>
              <label htmlFor="model" className="block text-xs font-medium text-gray-400 mb-1">Model</label>
              <select id="model" name="model" value={formData.model || 'gemini-2.5-flash'} onChange={handleInputChange} disabled={isReadOnly} className="w-full bg-gray-700 border-gray-600 rounded-md p-2 text-sm focus:ring-2 focus:ring-indigo-500 transition-colors disabled:opacity-50">
                <option value="gemini-2.5-flash">gemini-2.5-flash</option>
              </select>
            </div>
            <div>
              <label htmlFor="temperature" className="block text-xs font-medium text-gray-400 mb-1">Temperature: <span className="font-bold text-white">{(formData.temperature ?? 0.5).toFixed(1)}</span></label>
              <input type="range" id="temperature" name="temperature" min="0" max="1" step="0.1" value={formData.temperature ?? 0.5} onChange={handleInputChange} disabled={isReadOnly} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:opacity-50 accent-indigo-500" />
            </div>
            <div>
              <label htmlFor="maxOutputTokens" className="block text-xs font-medium text-gray-400 mb-1">Max Output Tokens</label>
              <input type="number" id="maxOutputTokens" name="maxOutputTokens" value={formData.maxOutputTokens ?? 2048} onChange={handleInputChange} disabled={isReadOnly} className="w-full bg-gray-700 border-gray-600 rounded-md p-2 text-sm focus:ring-2 focus:ring-indigo-500 transition-colors disabled:opacity-50" />
            </div>
          </div>
        </div>

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
  const canvasRef = useRef<HTMLDivElement>(null);
  const [draggingNode, setDraggingNode] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const [drawingEdge, setDrawingEdge] = useState<{ sourceId: string; mouseX: number; mouseY: number } | null>(null);

  useEffect(() => {
    setFormData(pipeline);
  }, [pipeline]);
  
  const handleUpdate = useCallback((updatedPipeline: Pipeline) => {
    setFormData(updatedPipeline);
    onUpdatePipeline(updatedPipeline);
  }, [onUpdatePipeline]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    handleUpdate({ ...formData, [name]: value });
  };
  
  const handleAgentDragStart = (e: React.DragEvent, agentId: string) => {
    e.dataTransfer.setData('agentId', agentId);
  };
  
  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const agentId = e.dataTransfer.getData('agentId');
    const canvasBounds = canvasRef.current?.getBoundingClientRect();
    if (agentId && canvasBounds) {
      const newNode: PipelineNode = {
        id: `node-${Date.now()}`,
        agentId,
        position: {
          x: e.clientX - canvasBounds.left,
          y: e.clientY - canvasBounds.top,
        },
      };
      handleUpdate({ ...formData, nodes: [...formData.nodes, newNode] });
    }
  };

  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    const node = formData.nodes.find(n => n.id === nodeId);
    if (node) {
      const offsetX = e.clientX - node.position.x;
      const offsetY = e.clientY - node.position.y;
      setDraggingNode({ id: nodeId, offsetX, offsetY });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingNode) {
      const newX = e.clientX - draggingNode.offsetX;
      const newY = e.clientY - draggingNode.offsetY;
      const newNodes = formData.nodes.map(n =>
        n.id === draggingNode.id ? { ...n, position: { x: newX, y: newY } } : n
      );
      setFormData({ ...formData, nodes: newNodes }); // Local update for performance
    }
    if (drawingEdge) {
      const canvasBounds = canvasRef.current?.getBoundingClientRect();
      if (canvasBounds) {
        setDrawingEdge({
          ...drawingEdge,
          mouseX: e.clientX - canvasBounds.left,
          mouseY: e.clientY - canvasBounds.top,
        });
      }
    }
  };
  
  const handleMouseUp = () => {
    if (draggingNode) {
        // Final update to parent
        onUpdatePipeline(formData);
    }
    setDraggingNode(null);
    setDrawingEdge(null);
  };

  const handleStartEdge = (e: React.MouseEvent, sourceId: string) => {
    e.stopPropagation();
    const canvasBounds = canvasRef.current?.getBoundingClientRect();
    if(canvasBounds){
        setDrawingEdge({
          sourceId,
          mouseX: e.clientX - canvasBounds.left,
          mouseY: e.clientY - canvasBounds.top,
        });
    }
  };
  
  const handleEndEdge = (e: React.MouseEvent, targetId: string) => {
    e.stopPropagation();
    if (drawingEdge && drawingEdge.sourceId !== targetId) {
      const newEdge: PipelineEdge = {
        id: `edge-${drawingEdge.sourceId}-${targetId}`,
        source: drawingEdge.sourceId,
        target: targetId,
      };
      // Prevent duplicate edges
      if (!formData.edges.some(e => e.source === newEdge.source && e.target === newEdge.target)) {
        handleUpdate({ ...formData, edges: [...formData.edges, newEdge] });
      }
    }
    setDrawingEdge(null);
  };

  const deleteNode = (nodeId: string) => {
    const newNodes = formData.nodes.filter(n => n.id !== nodeId);
    const newEdges = formData.edges.filter(e => e.source !== nodeId && e.target !== nodeId);
    handleUpdate({ ...formData, nodes: newNodes, edges: newEdges });
  };
  
  const deleteEdge = (edgeId: string) => {
    const newEdges = formData.edges.filter(e => e.id !== edgeId);
    handleUpdate({ ...formData, edges: newEdges });
  };
  
  const nodeMap = new Map(formData.nodes.map(node => [node.id, node]));

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg flex flex-col overflow-hidden h-full">
      <div className="p-4 border-b border-gray-800 shrink-0"><h3 className="text-lg font-semibold">Pipeline Editor</h3></div>
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        <div><label htmlFor="name" className="block text-sm font-medium text-gray-400 mb-1">Pipeline Name</label><input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} className="w-full bg-gray-800 border-gray-700 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 transition-colors" /></div>
        <div><label htmlFor="description" className="block text-sm font-medium text-gray-400 mb-1">Description</label><textarea id="description" name="description" rows={2} value={formData.description} onChange={handleInputChange} className="w-full bg-gray-800 border-gray-700 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 transition-colors" /></div>
      </div>
      <div className="flex-1 flex flex-col border-t border-gray-800 overflow-hidden">
        <h4 className="text-sm font-medium text-gray-400 p-4 pb-2 shrink-0">Workflow Canvas</h4>
        <div className="flex-1 flex overflow-hidden">
          <div className="w-1/3 border-r border-gray-800 p-2 overflow-y-auto">
             <h5 className="text-xs font-semibold text-gray-500 mb-2 px-1">Available Agents</h5>
             <div className="space-y-1">
                {allAgents.map(agent => (
                  <div key={agent.id} draggable onDragStart={(e) => handleAgentDragStart(e, agent.id)}
                    className="flex items-center gap-3 bg-gray-800 p-2 rounded-md cursor-grab active:cursor-grabbing">
                    <span className="text-xl">{agent.avatar}</span>
                    <p className="font-semibold text-sm truncate">{agent.name}</p>
                  </div>
                ))}
             </div>
          </div>
          <div 
            ref={canvasRef}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleCanvasDrop}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="w-2/3 h-full relative overflow-auto bg-gray-950/50"
            style={{ backgroundSize: '20px 20px', backgroundImage: 'radial-gradient(circle, #3c3c45 1px, rgba(0,0,0,0) 1px)' }}
          >
            {formData.nodes.map(node => {
               const agent = allAgents.find(a => a.id === node.agentId);
               return (
                  <div key={node.id} 
                    style={{ left: node.position.x, top: node.position.y, touchAction: 'none' }}
                    onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                    onMouseUp={(e) => handleEndEdge(e, node.id)}
                    className="absolute bg-gray-800 border-2 border-gray-700 rounded-lg p-2 shadow-lg cursor-grab active:cursor-grabbing w-64"
                  >
                    <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-4 h-4 bg-indigo-500 rounded-full border-2 border-gray-800 cursor-crosshair" title="Input"/>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{agent?.avatar}</span>
                      <div className="flex-1 overflow-hidden">
                          <p className="font-bold truncate">{agent?.name}</p>
                          <p className="text-xs text-gray-400 truncate">{agent?.description}</p>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); deleteNode(node.id); }} className="p-1 text-gray-400 hover:text-white hover:bg-red-500/50 rounded-md"><Trash2 className="w-4 h-4" /></button>
                    </div>
                    <div onMouseDown={(e) => handleStartEdge(e, node.id)} className="absolute -right-3 top-1/2 -translate-y-1/2 w-4 h-4 bg-purple-500 rounded-full border-2 border-gray-800 cursor-crosshair" title="Output"/>
                  </div>
               );
            })}
            <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
                {formData.edges.map(edge => {
                    const sourceNode = nodeMap.get(edge.source);
                    const targetNode = nodeMap.get(edge.target);
                    if (!sourceNode || !targetNode) return null;
                    const startX = sourceNode.position.x + 256; // Node width
                    const startY = sourceNode.position.y + 32; // Half node height
                    const endX = targetNode.position.x;
                    const endY = targetNode.position.y + 32;
                    const c1X = startX + 50;
                    const c1Y = startY;
                    const c2X = endX - 50;
                    const c2Y = endY;
                    return <path key={edge.id} d={`M ${startX} ${startY} C ${c1X} ${c1Y}, ${c2X} ${c2Y}, ${endX} ${endY}`} stroke="#6366f1" strokeWidth="2" fill="none" className="hover:stroke-red-500 pointer-events-stroke" onDoubleClick={() => deleteEdge(edge.id)}/>
                })}
                {drawingEdge && (() => {
                    const sourceNode = nodeMap.get(drawingEdge.sourceId);
                    if (!sourceNode) return null;
                     const startX = sourceNode.position.x + 256;
                     const startY = sourceNode.position.y + 32;
                     const endX = drawingEdge.mouseX;
                     const endY = drawingEdge.mouseY;
                     const c1X = startX + 50;
                     const c1Y = startY;
                     const c2X = endX - 50;
                     const c2Y = endY;
                    return <path d={`M ${startX} ${startY} C ${c1X} ${c1Y}, ${c2X} ${c2Y}, ${endX} ${endY}`} stroke="#a78bfa" strokeWidth="2" fill="none" strokeDasharray="5,5"/>
                })()}
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AgentEditor;