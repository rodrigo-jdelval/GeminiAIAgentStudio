
[Español](README.es.md)

# Gemini AI Agent Studio

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Built with React](https://img.shields.io/badge/Built%20with-React-61DAFB?logo=react)](https://reactjs.org/)
[![Powered by Gemini](https://img.shields.io/badge/Powered%20by-Gemini-8A2BE2)](https://ai.google.dev/)

**A powerful web-based IDE for designing, building, and testing autonomous AI agents and complex, graph-based workflows, all powered by the Google Gemini API.**

---

![Gemini AI Agent Studio Screenshot](https://storage.googleapis.com/gemini-studio-images/gemini-agent-studio-screenshot.png)
*(A conceptual screenshot of the Agent Studio interface)*

## 🚀 Overview

Gemini AI Agent Studio is an open-source, client-side application designed as a prototyping environment for creating sophisticated AI agents. It embraces modern agentic design patterns like ReAct (Reasoning and Acting) and provides a visual, node-based editor for orchestrating multiple agents into complex, non-linear pipelines.

Whether you're a developer exploring agentic AI, a researcher prototyping multi-agent systems, or an enthusiast curious about the power of Gemini, this studio provides the tools to bring your ideas to life right in your browser.

## ✨ Key Features

- **🤖 Agent Management**: Create, edit, duplicate, and delete agents with an easy-to-use interface. Includes a rich set of pre-defined agents for various tasks (research, creative writing, cybersecurity analysis, etc.).
- **🪄 AI-Powered Creation**: Describe the agent or pipeline you want in natural language and let Gemini build the configuration for you.
- **🔗 Graphical Pipeline Editor**: Go beyond simple chains. Design complex, multi-agent workflows as directed graphs on a visual canvas. Supports one-to-many and many-to-one data flows.
- **⚡ Asynchronous Execution**: Run multiple, long-running agents or pipelines in the background. The UI remains responsive, and you can track active tasks via sidebar indicators.
- **🧪 Interactive Playground**: Test your creations instantly. See the agent's step-by-step reasoning process (Thought, Action, Observation) and safely cancel tasks with a "Stop" button.
- **📊 Rich Output Rendering**: The playground features a robust Markdown renderer capable of displaying headers, lists, tables, and even images generated or found by the agents.
- **🛠️ Versatile Tooling**: Equip agents with powerful tools like `GoogleSearch`, `HttpRequest` for API calls, a `WebBrowser` for reading content, and a sandboxed `CodeInterpreter`.
- **🔄 Import & Export**: Save and share your entire workspace. Export all your agents and pipelines to a single JSON file and import them into another session.
- **📄 ADK Compatibility**: View and edit agent configurations in a format compatible with the [Google AI Developer Kit (ADK)](https://developers.google.com/ai/adk).

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **AI Engine**: Google Gemini API via [`@google/genai`](https://www.npmjs.com/package/@google/genai)
- **State Management**: React Hooks
- **Persistence**: Browser `localStorage`

## ⚙️ Getting Started

This application is designed to run in a development environment where the necessary API key is provided as an environment variable.

### Prerequisites

- An active Google Gemini API key. You can get one from [Google AI Studio](https://aistudio.google.com/).
- A local development server or an environment capable of serving static files.

### Running the Application

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-repo/gemini-ai-agent-studio.git
    cd gemini-ai-agent-studio
    ```

2.  **Set the API Key:**
    The application requires the `API_KEY` environment variable to be set with your Google Gemini API key. The application's code directly references `process.env.API_KEY`, so your development setup must make this variable available to the browser-side JavaScript. Tools like Vite or Create React App handle this automatically using a `.env` file.

    *Example using a `.env` file:*
    ```
    API_KEY="YOUR_GEMINI_API_KEY_HERE"
    ```

3.  **Serve the files:**
    Since this is a static, client-side application, you can serve the files with any simple HTTP server.
    ```bash
    # If you have Node.js, you can use the 'serve' package
    npx serve .
    ```
    Now, open your browser and navigate to the local address provided by the server.

## 🧠 Core Concepts Explained

- **Agents**: An Agent is a single AI entity with a specific purpose defined by its *System Prompt*. It can be given tools to interact with the outside world and follows the ReAct pattern to reason about problems.
- **Pipelines (Workflows)**: A Pipeline is a directed graph of interconnected agents. The visual editor allows you to define how one agent's output becomes the input for another, enabling the creation of sophisticated, multi-step automations.
- **ReAct Pattern**: Agents operate on a "Reason-Act" loop. They **think** about the problem, decide on an **action** (like using a tool), and then process the **observation** (the tool's result) to continue their reasoning process until they reach a final answer.

## 🌟 Showcase Example

The studio comes with examples to get you started, including a powerful cybersecurity pipeline:

**Pipeline: Ransomware Actor TTP Analysis**
This three-step pipeline demonstrates the power of chaining specialized agents:
1.  **Ransomware Threat Assessor**: Takes a company profile (e.g., "US-based financial company") and uses its tools to find relevant ransomware threats, outputting structured JSON data.
2.  **MITRE ATT&CK TTPs Identifier**: Receives the JSON data, extracts threat actor names, researches their associated MITRE ATT&CK TTPs, and outputs a new, enriched JSON object with the findings.
3.  **Data Visualizer**: Takes the final, enriched JSON data and transforms it into a clean, human-readable Markdown report, complete with summaries, tables, and visual formatting.

## 🤝 Contributing

Contributions are welcome! If you have ideas for new features, pre-defined agents, or improvements, please open an issue or submit a pull request.

## 📄 License

This project is licensed under the Apache 2.0 License. See the [LICENSE](LICENSE) file for details.
