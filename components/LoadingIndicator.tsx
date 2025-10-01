
import React from 'react';

interface LoadingIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ currentStep, totalSteps }) => {
  return (
    <div className="flex flex-col items-center justify-center space-y-3 p-4 my-8">
      <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-cyan-400"></div>
      <p className="text-lg font-semibold text-cyan-300">
        Running Research Loop {currentStep} of {totalSteps}...
      </p>
      <p className="text-sm text-slate-400">Please wait, this may take a moment.</p>
    </div>
  );
};
