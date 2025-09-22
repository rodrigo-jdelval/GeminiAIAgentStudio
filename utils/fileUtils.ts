
import type { Agent, Pipeline } from '../types';

// App config type for clarity
interface AppConfig {
  agents: Agent[];
  pipelines: Pipeline[];
}

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

export function exportTextToFile(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// NEW: Export the entire application configuration
export function exportAppConfig(agents: Agent[], pipelines: Pipeline[]) {
  const appConfig: AppConfig = { agents, pipelines };
  const filename = 'gemini_agent_studio_config.json';
  downloadJsonFile(appConfig, filename);
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

// NEW: Import the entire application configuration
export function importAppConfig(file: File): Promise<AppConfig> {
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
        const parsedConfig = JSON.parse(result) as AppConfig;
        
        // Basic validation
        if (!Array.isArray(parsedConfig.agents) || !Array.isArray(parsedConfig.pipelines)) {
          return reject(new Error('Invalid config file format. Must contain "agents" and "pipelines" arrays.'));
        }
        
        resolve(parsedConfig);

      } catch (error) {
        reject(new Error('Failed to parse JSON file.'));
      }
    };
    reader.onerror = () => reject(new Error('Error reading the file.'));
    reader.readAsText(file);
  });
}
