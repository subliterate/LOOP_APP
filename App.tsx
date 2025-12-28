
import React, { useState, useCallback, useEffect } from 'react';
import { ResearchStep } from './types';
import { performDeepResearch, findNextInquiry } from './services/geminiService';
import { InputForm } from './components/InputForm';
import { LoadingIndicator } from './components/LoadingIndicator';
import { ResultsDisplay } from './components/ResultsDisplay';
import { ApiKeyInput } from './components/ApiKeyInput';

export default function App() {
  const [apiKey, setApiKey] = useState<string>('');
  const [researchSteps, setResearchSteps] = useState<ResearchStep[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [totalSteps, setTotalSteps] = useState<number>(0);

  useEffect(() => {
    const storedKey = localStorage.getItem('gemini_api_key');
    if (storedKey) {
      setApiKey(storedKey);
    }
  }, []);

  const handleSetApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('gemini_api_key', key);
  };

  const handleClearApiKey = () => {
    setApiKey('');
    localStorage.removeItem('gemini_api_key');
  };

  const handleStartResearch = useCallback(async (subject: string, loops: number) => {
    if (!apiKey) {
      setError("API Key is missing.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResearchSteps([]);
    setTotalSteps(loops);
    
    let currentSubject = subject;

    try {
      for (let i = 1; i <= loops; i++) {
        setCurrentStep(i);

        const researchResult = await performDeepResearch(apiKey, currentSubject);
        
        let nextSubject: string | null = null;
        if (i < loops) {
           nextSubject = await findNextInquiry(apiKey, researchResult.summary);
        }

        const newStep: ResearchStep = {
          id: i,
          subject: currentSubject,
          summary: researchResult.summary,
          sources: researchResult.sources,
          nextSubject: nextSubject,
        };

        setResearchSteps(prev => [...prev, newStep]);

        if (nextSubject) {
          currentSubject = nextSubject;
        } else {
          break; // Stop if no next subject is found
        }
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      console.error(e);
      setError(`Error during step ${currentStep}: ${errorMessage}`);
    } finally {
      setIsLoading(false);
      setCurrentStep(0);
    }
  }, [apiKey, currentStep]);

  return (
    <div className="min-h-screen bg-slate-900 font-sans p-4 sm:p-6 md:p-8">
      <div 
        className="absolute top-0 left-0 w-full h-full bg-cover bg-center opacity-10" 
        style={{backgroundImage: 'url(https://picsum.photos/seed/research/1920/1080)'}}
      ></div>
      <main className="relative z-10 container mx-auto flex flex-col items-center">
        <header className="text-center my-8 md:my-12 relative w-full">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-500">
            Gemini Deep Research Loop
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-lg text-slate-400">
            Automate your research process. Start with a topic, and let Gemini discover and follow the most logical threads of inquiry.
          </p>
          {apiKey && (
            <button 
              onClick={handleClearApiKey}
              className="absolute top-0 right-0 text-xs text-slate-500 hover:text-slate-300 underline"
            >
              Change API Key
            </button>
          )}
        </header>

        {!apiKey ? (
          <ApiKeyInput onSetApiKey={handleSetApiKey} />
        ) : (
          <>
            <InputForm onStart={handleStartResearch} isLoading={isLoading} />

            {error && (
              <div className="mt-8 bg-red-900/50 border border-red-700 text-red-200 p-4 rounded-lg w-full max-w-2xl text-center">
                <p className="font-bold">An Error Occurred</p>
                <p className="text-sm">{error}</p>
              </div>
            )}

            {isLoading && <LoadingIndicator currentStep={currentStep} totalSteps={totalSteps} />}

            {!isLoading && <ResultsDisplay steps={researchSteps} />}
          </>
        )}

      </main>
    </div>
  );
}
