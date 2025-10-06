
[English](README.md)

# Gemini AI Agent Studio

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Built with React](https://img.shields.io/badge/Built%20with-React-61DAFB?logo=react)](https://reactjs.org/)
[![Powered by Gemini](https://img.shields.io/badge/Powered%20by-Gemini-8A2BE2)](https://ai.google.dev/)

**Un potente IDE basado en web para diseñar, construir y probar agentes de IA autónomos y flujos de trabajo complejos basados en grafos, todo ello impulsado por la API de Google Gemini.**

---

![Gemini AI Agent Studio Screenshot](https://storage.googleapis.com/gemini-studio-images/gemini-agent-studio-screenshot.png)
*(Una captura de pantalla conceptual de la interfaz del Agent Studio)*

## 🚀 Visión General

Gemini AI Agent Studio es una aplicación de código abierto, ejecutada en el lado del cliente, diseñada como un entorno de prototipado para crear agentes de IA sofisticados. Adopta patrones de diseño modernos como ReAct (Razonamiento y Actuación) y proporciona un editor visual basado en nodos para orquestar múltiples agentes en pipelines complejos y no lineales.

Si eres un desarrollador explorando la IA agéntica, un investigador prototipando sistemas multiagente, o un entusiasta curioso sobre el poder de Gemini, este estudio te proporciona las herramientas para dar vida a tus ideas directamente en tu navegador.

## ✨ Características Clave

- **🤖 Gestión de Agentes**: Crea, edita, duplica y elimina agentes con una interfaz fácil de usar. Incluye un amplio conjunto de agentes predefinidos para diversas tareas (investigación, escritura creativa, análisis de ciberseguridad, etc.).
- **🪄 Creación con IA**: Describe el agente o pipeline que deseas en lenguaje natural y deja que Gemini construya la configuración por ti.
- **🔗 Editor Gráfico de Pipelines**: Ve más allá de simples cadenas. Diseña flujos de trabajo complejos y multiagente como grafos dirigidos en un lienzo visual. Soporta flujos de datos de uno a muchos y de muchos a uno.
- **⚡ Ejecución Asíncrona**: Ejecuta múltiples agentes o pipelines de larga duración en segundo plano. La interfaz de usuario permanece receptiva y puedes seguir las tareas activas a través de indicadores en la barra lateral.
- **🧪 Playground Interactivo**: Prueba tus creaciones al instante. Visualiza el proceso de razonamiento paso a paso del agente (Pensamiento, Acción, Observación) y cancela tareas de forma segura con un botón de "Detener".
- **📊 Renderizado de Salida Enriquecido**: El playground cuenta con un robusto renderizador de Markdown capaz de mostrar encabezados, listas, tablas e incluso imágenes generadas o encontradas por los agentes.
- **🛠️ Herramientas Versátiles**: Equipa a los agentes con potentes herramientas como `GoogleSearch`, `HttpRequest` para llamadas a API, un `WebBrowser` para leer contenido y un `CodeInterpreter` en un entorno seguro.
- **🔄 Importar y Exportar**: Guarda y comparte todo tu espacio de trabajo. Exporta todos tus agentes y pipelines a un único archivo JSON e impórtalos en otra sesión.
- **📄 Compatibilidad con ADK**: Visualiza y edita configuraciones de agentes en un formato compatible con el [Google AI Developer Kit (ADK)](https://developers.google.com/ai/adk).

## 🛠️ Stack Tecnológico

- **Frontend**: React, TypeScript, Tailwind CSS
- **Motor de IA**: API de Google Gemini a través de [`@google/genai`](https://www.npmjs.com/package/@google/genai)
- **Gestión de Estado**: React Hooks
- **Persistencia**: `localStorage` del navegador

## ⚙️ Cómo Empezar

Esta aplicación está diseñada para ejecutarse en un entorno de desarrollo donde la clave de API necesaria se proporciona como una variable de entorno.

### Prerrequisitos

- Una clave de API activa de Google Gemini. Puedes obtener una en [Google AI Studio](https://aistudio.google.com/).
- Un servidor de desarrollo local o un entorno capaz de servir archivos estáticos.

### Ejecutar la Aplicación

1.  **Clona el repositorio:**
    ```bash
    git clone https://github.com/your-repo/gemini-ai-agent-studio.git
    cd gemini-ai-agent-studio
    ```

2.  **Configura la Clave de API:**
    La aplicación requiere que la variable de entorno `API_KEY` esté configurada con tu clave de API de Google Gemini. El código de la aplicación hace referencia directa a `process.env.API_KEY`, por lo que tu entorno de desarrollo debe hacer que esta variable esté disponible para el código JavaScript que se ejecuta en el navegador. Herramientas como Vite o Create React App manejan esto automáticamente usando un archivo `.env`.

    *Ejemplo usando un archivo `.env`:*
    ```
    API_KEY="TU_CLAVE_DE_API_DE_GEMINI_AQUI"
    ```

3.  **Sirve los archivos:**
    Dado que esta es una aplicación estática del lado del cliente, puedes servir los archivos con cualquier servidor HTTP simple.
    ```bash
    # Si tienes Node.js, puedes usar el paquete 'serve'
    npx serve .
    ```
    Ahora, abre tu navegador y navega a la dirección local proporcionada por el servidor.

## 🧠 Conceptos Clave Explicados

- **Agentes**: Un Agente es una única entidad de IA con un propósito específico definido por su *System Prompt*. Se le pueden dar herramientas para interactuar con el mundo exterior y sigue el patrón ReAct para razonar sobre los problemas.
- **Pipelines (Flujos de Trabajo)**: Un Pipeline es un grafo dirigido de agentes interconectados. El editor visual te permite definir cómo la salida de un agente se convierte en la entrada de otro, permitiendo la creación de automatizaciones sofisticadas y de múltiples pasos.
- **Patrón ReAct**: Los agentes operan en un bucle "Razonar-Actuar". **Piensan** sobre el problema, deciden una **acción** (como usar una herramienta) y luego procesan la **observación** (el resultado de la herramienta) para continuar su proceso de razonamiento hasta llegar a una respuesta final.

## 🌟 Ejemplo Destacado

El estudio viene con ejemplos para que puedas empezar, incluyendo un potente pipeline de ciberseguridad:

**Pipeline: Análisis de TTPs de Actores de Ransomware**
Este pipeline de tres pasos demuestra el poder de encadenar agentes especializados:
1.  **Evaluador de Amenazas de Ransomware**: Toma un perfil de empresa (por ejemplo, "empresa financiera con sede en EE. UU.") y utiliza sus herramientas para encontrar amenazas de ransomware relevantes, generando datos estructurados en formato JSON.
2.  **Identificador de TTPs de MITRE ATT&CK**: Recibe los datos JSON, extrae los nombres de los actores de amenazas, investiga sus TTPs de MITRE ATT&CK asociados y genera un nuevo objeto JSON con los hallazgos.
3.  **Visualizador de Datos**: Toma los datos JSON finales y enriquecidos y los transforma en un informe limpio y legible en formato Markdown, con resúmenes, tablas y formato visual.

## 🤝 Contribuciones

¡Las contribuciones son bienvenidas! Si tienes ideas para nuevas funcionalidades, agentes predefinidos o mejoras, por favor, abre un *issue* o envía una *pull request*.

## 📄 Licencia

Este proyecto está licenciado bajo la Licencia Apache 2.0. Consulta el archivo [LICENSE](LICENSE) para más detalles.
