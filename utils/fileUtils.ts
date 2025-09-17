import type { Agent } from '../types';

function downloadJsonFile(content: object, filename: string) {
  const data = JSON.stringify(content, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportAgentToFile(agent: Agent) {
  const filename = `${agent.name.replace(/\s+/g, '_').toLowerCase()}_agent.json`;
  downloadJsonFile(agent, filename);
}

export function exportAgentForADK(agent: Agent) {
  const adkConfig = {
    name: agent.name,
    description: agent.description,
    instructions: agent.systemPrompt,
    tools: agent.tools.filter(tool => tool.enabled).map(tool => tool.name),
  };
  const filename = `${agent.name.replace(/\s+/g, '_').toLowerCase()}_adk_config.json`;
  downloadJsonFile(adkConfig, filename);
}


export function importAgentFromFile(file: File): Promise<Agent> {
  return new Promise((resolve, reject) => {
    if (file.type !== 'application/json') {
      return reject(new Error('Invalid file type. Please upload a JSON file.'));
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const result = event.target?.result;
        if (typeof result !== 'string') {
          return reject(new Error('Failed to read file content.'));
        }
        const parsedAgent = JSON.parse(result) as Agent;
        
        // Basic validation
        if (!parsedAgent.id || !parsedAgent.name || !parsedAgent.systemPrompt) {
          return reject(new Error('Invalid agent file format. Missing required fields.'));
        }
        
        // Ensure it's not marked as predefined
        parsedAgent.isPredefined = false;
        resolve(parsedAgent);

      } catch (error) {
        reject(new Error('Failed to parse JSON file.'));
      }
    };
    reader.onerror = () => reject(new Error('Error reading the file.'));
    reader.readAsText(file);
  });
}