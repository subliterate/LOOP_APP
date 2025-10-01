import React from 'react';
import { ResearchStep } from '../types';
import { DownloadIcon } from './icons';

interface DownloadButtonsProps {
  steps: ResearchStep[];
}

const downloadFile = (content: string, fileName: string, contentType: string) => {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const DownloadButtons: React.FC<DownloadButtonsProps> = ({ steps }) => {
  const handleTxtDownload = () => {
    const title = steps[0]?.subject || 'Research';
    const fileName = `${title.replace(/ /g, '_')}_research.txt`;

    let content = `DEEP RESEARCH JOURNEY\nInitial Subject: ${title}\n\n`;

    steps.forEach(step => {
      content += `==================================================\n`;
      content += `STEP ${step.id}: ${step.subject}\n`;
      content += `==================================================\n\n`;
      content += `SUMMARY:\n${step.summary}\n\n`;

      const filteredSources = step.sources.filter(s => s.web?.uri && s.web.title);
      if (filteredSources.length > 0) {
        content += `SOURCES:\n`;
        filteredSources.forEach(source => {
          content += `- ${source.web?.title}: ${source.web?.uri}\n`;
        });
        content += `\n`;
      }

      if (step.nextSubject) {
        content += `NEXT INQUIRY: ${step.nextSubject}\n`;
      }
      content += `\n`;
    });
    
    downloadFile(content, fileName, 'text/plain;charset=utf-8;');
  };

  const handleJsonDownload = () => {
    const title = steps[0]?.subject || 'Research';
    const fileName = `${title.replace(/ /g, '_')}_research.json`;
    const content = JSON.stringify(steps, null, 2);
    downloadFile(content, fileName, 'application/json');
  };

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={handleTxtDownload}
        className="flex items-center text-sm bg-slate-700 hover:bg-slate-600 text-slate-300 font-medium py-2 px-3 rounded-md transition-colors duration-200"
        aria-label="Download as TXT"
      >
        <DownloadIcon className="h-4 w-4 mr-2" />
        TXT
      </button>
      <button
        onClick={handleJsonDownload}
        className="flex items-center text-sm bg-slate-700 hover:bg-slate-600 text-slate-300 font-medium py-2 px-3 rounded-md transition-colors duration-200"
        aria-label="Download as JSON"
      >
        <DownloadIcon className="h-4 w-4 mr-2" />
        JSON
      </button>
    </div>
  );
};