import React, { useState } from 'react';

interface ApiKeyInputProps {
  onSetApiKey: (key: string) => void;
}

export const ApiKeyInput: React.FC<ApiKeyInputProps> = ({ onSetApiKey }) => {
  const [inputKey, setInputKey] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputKey.trim()) {
      onSetApiKey(inputKey.trim());
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-slate-800/80 p-6 rounded-xl border border-slate-700 shadow-xl backdrop-blur-sm">
      <h2 className="text-xl font-bold text-white mb-4 text-center">Enter Gemini API Key</h2>
      <p className="text-slate-400 text-sm mb-6 text-center">
        To use this application, you need to provide your own Google Gemini API Key. 
        It will be stored locally in your browser.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="apiKey" className="block text-sm font-medium text-slate-300 mb-1">
            API Key
          </label>
          <input
            type="password"
            id="apiKey"
            value={inputKey}
            onChange={(e) => setInputKey(e.target.value)}
            className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all placeholder-slate-600"
            placeholder="AIzaSy..."
            required
          />
        </div>
        <button
          type="submit"
          className="w-full py-2 px-4 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-semibold rounded-lg shadow-md transition-all transform hover:scale-[1.02] active:scale-[0.98]"
        >
          Save API Key
        </button>
      </form>
      <div className="mt-4 text-center">
        <a 
          href="https://aistudio.google.com/app/apikey" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-xs text-cyan-400 hover:text-cyan-300 underline"
        >
          Get an API Key from Google AI Studio
        </a>
      </div>
    </div>
  );
};
