
import React, { useState } from 'react';
import { X, Sparkles } from './icons/EditorIcons';

interface CreatePipelineModalProps {
  onClose: () => void;
  onCreatePipeline: (description: string) => Promise<void>;
}

const examplePrompts = [
    "A pipeline that researches a topic on the web, then writes a creative summary.",
    "First, find threats for a company profile, then find the TTPs for those threats.",
    "A workflow that takes a CVE, researches it, and then provides hardening advice.",
    "Create a pipeline to get the price of Bitcoin and then search for recent news about it.",
];

const CreatePipelineModal: React.FC<CreatePipelineModalProps> = ({ onClose, onCreatePipeline }) => {
  const [description, setDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || isGenerating) return;

    setIsGenerating(true);
    setError(null);

    try {
      await onCreatePipeline(description);
      // The parent component will handle closing on success.
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExampleClick = (prompt: string) => {
    setDescription(prompt);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
      <div className="bg-gray-900 border border-gray-700 rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-indigo-400" />
            Create Pipeline with AI
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-700 rounded-md transition-colors" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="p-6 space-y-4 overflow-y-auto">
            <div>
              <label htmlFor="pipeline-description" className="block text-sm font-medium text-gray-300 mb-2">
                Describe the pipeline you want to create:
              </label>
              <textarea
                id="pipeline-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                className="w-full bg-gray-800 border-gray-700 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 transition-colors disabled:opacity-50"
                placeholder="e.g., 'A workflow to find information on Google and then get the content from the top result.'"
                disabled={isGenerating}
                required
              />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-400 mb-2">Or try an example:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {examplePrompts.map((prompt, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleExampleClick(prompt)}
                    disabled={isGenerating}
                    className="text-left p-3 bg-gray-700/70 hover:bg-gray-700 rounded-md text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
             {error && <p className="text-red-400 text-sm mt-2 p-2 bg-red-900/50 rounded-md">Error: {error}</p>}
          </div>
          <div className="flex items-center justify-end p-4 border-t border-gray-800 gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium bg-gray-700 hover:bg-gray-600 rounded-md transition-colors" disabled={isGenerating}>
              Cancel
            </button>
            <button type="submit" className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed" disabled={isGenerating || !description.trim()}>
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Pipeline
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePipelineModal;