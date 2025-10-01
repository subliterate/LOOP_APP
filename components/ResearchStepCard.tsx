import React from 'react';
import { ResearchStep } from '../types';
import { LinkIcon } from './icons';

interface ResearchStepCardProps {
  step: ResearchStep;
}

export const ResearchStepCard: React.FC<ResearchStepCardProps> = ({ step }) => {
  const filteredSources = step.sources.filter(source => source.web && source.web.uri && source.web.title);

  return (
    <div className="bg-slate-800/60 p-6 rounded-xl shadow-lg border border-slate-700 backdrop-blur-sm transition-all hover:border-cyan-500/50 hover:shadow-cyan-500/10 w-full">
      <div className="flex items-center mb-4">
        <div className="bg-cyan-600 text-white rounded-full h-8 w-8 flex items-center justify-center font-bold text-sm flex-shrink-0">
          {step.id}
        </div>
        <h2 className="text-xl font-bold text-cyan-300 ml-4 truncate">{step.subject}</h2>
      </div>
      
      <div className="prose prose-sm prose-invert max-w-none text-slate-300">
        <p className="whitespace-pre-wrap">{step.summary}</p>
      </div>

      {filteredSources.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-semibold text-slate-400 mb-2">Sources:</h4>
          <ul className="space-y-2">
            {filteredSources.map((source, index) => (
              <li key={index} className="flex items-start">
                <LinkIcon className="h-4 w-4 text-slate-500 mr-2 mt-1 flex-shrink-0" />
                <a
                  href={source.web?.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:text-cyan-300 hover:underline text-xs transition truncate"
                  title={source.web?.title}
                >
                  {source.web?.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};