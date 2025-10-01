import React from 'react';
import { ResearchStep } from '../types';
import { ResearchStepCard } from './ResearchStepCard';
import { ArrowDownIcon } from './icons';
import { DownloadButtons } from './DownloadButtons';

interface ResultsDisplayProps {
  steps: ResearchStep[];
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ steps }) => {
  if (steps.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-3xl mx-auto mt-12">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 px-2 sm:px-0">
        <h2 className="text-3xl font-bold text-slate-100 mb-4 sm:mb-0">Research Journey</h2>
        <DownloadButtons steps={steps} />
      </div>
      <div className="flex flex-col items-center">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <ResearchStepCard step={step} />
            {index < steps.length -1 && (
              <div className="my-4 flex flex-col items-center text-slate-500">
                <ArrowDownIcon className="h-8 w-8" />
                {step.nextSubject && (
                   <p className="mt-2 text-center text-sm bg-slate-700/50 px-3 py-1 rounded-full">
                     Next inquiry: <span className="font-semibold text-slate-300">{step.nextSubject}</span>
                   </p>
                )}
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};