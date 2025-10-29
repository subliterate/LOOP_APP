import { createGeminiService } from './geminiServiceCore.js';

const resolveEnvValue = (key: string): string | undefined => {
  if (typeof process !== 'undefined') {
    return process.env?.[key];
  }

  return undefined;
};

const { performDeepResearch, findNextInquiry } = createGeminiService(resolveEnvValue);

export { performDeepResearch, findNextInquiry };
export type { DeepResearchResponse } from './geminiServiceCore.js';
