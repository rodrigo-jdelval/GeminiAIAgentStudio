import React, { useRef } from 'react';
import { FileDown, FileUp, HelpCircle, Settings } from './icons/EditorIcons';

interface HeaderProps {
  onImport: (file: File) => void;
  onExport: () => void;
  onShowADKConfig: () => void;
  onShowHelp: () => void;
}

const Header: React.FC<HeaderProps> = ({ onImport, onExport, onShowADKConfig, onShowHelp }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImport(file);
      event.target.value = ''; // Reset for same-file import
    }
  };

  return (
    <header className="flex items-center justify-between p-3 bg-gray-900 border-b border-gray-800 shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg"></div>
        <h1 className="text-xl font-bold text-white">Gemini AI Agent Studio</h1>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept=".json"
          onChange={handleFileChange}
        />
        <button 
          onClick={handleImportClick}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-gray-800 hover:bg-gray-700 rounded-md transition-colors"
          title="Import agent from a .json file"
        >
          <FileUp className="w-4 h-4" /> Import
        </button>
        <button 
          onClick={onExport}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-gray-800 hover:bg-gray-700 rounded-md transition-colors"
          title="Export agent to a .json file"
        >
          <FileDown className="w-4 h-4" /> Export
        </button>
         <button 
          onClick={onShowADKConfig}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-gray-800 hover:bg-gray-700 rounded-md transition-colors"
          title="View and edit ADK configuration"
        >
          <Settings className="w-4 h-4" /> ADK Configuration
        </button>
        <button 
          onClick={onShowHelp}
          className="p-2 text-sm font-medium bg-gray-800 hover:bg-gray-700 rounded-md transition-colors"
           title="Show Help"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

export default Header;