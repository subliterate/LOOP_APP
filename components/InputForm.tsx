
import React, { useState } from 'react';
import { SearchIcon } from './icons';

interface InputFormProps {
  onStart: (subject: string, loops: number) => void;
  isLoading: boolean;
}

export const InputForm: React.FC<InputFormProps> = ({ onStart, isLoading }) => {
  const [subject, setSubject] = useState('The history of deep learning');
  const [loops, setLoops] = useState(3);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (subject.trim() && loops > 0 && !isLoading) {
      onStart(subject.trim(), loops);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-800/50 p-6 rounded-xl shadow-lg border border-slate-700 w-full max-w-2xl mx-auto backdrop-blur-sm">
      <div className="space-y-4">
        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-slate-300 mb-1">
            Initial Research Subject
          </label>
          <input
            type="text"
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full bg-slate-900/80 border border-slate-600 rounded-md px-3 py-2 text-slate-100 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
            placeholder="e.g., The impact of quantum computing"
            disabled={isLoading}
          />
        </div>
        <div>
          <label htmlFor="loops" className="block text-sm font-medium text-slate-300 mb-1">
            Number of Research Loops
          </label>
          <input
            type="number"
            id="loops"
            value={loops}
            min="1"
            max="10"
            onChange={(e) => setLoops(parseInt(e.target.value, 10) || 1)}
            className="w-full bg-slate-900/80 border border-slate-600 rounded-md px-3 py-2 text-slate-100 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
            disabled={isLoading}
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={isLoading || !subject.trim() || loops < 1}
        className="mt-6 w-full flex items-center justify-center bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-2.5 px-4 rounded-md transition-all duration-300 ease-in-out group"
      >
        <SearchIcon className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
        {isLoading ? 'Researching...' : 'Start Deep Research'}
      </button>
    </form>
  );
};
