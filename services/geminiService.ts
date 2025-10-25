import { Source } from '../types';

const resolveApiUrl = (path: string): string => {
  const base = import.meta.env.VITE_API_BASE_URL || '';
  if (base) {
    return `${base.replace(/\/$/, '')}${path}`;
  }
  return path;
};

interface DeepResearchResponse {
  summary: string;
  sources: Source[];
}

const handleResponse = async <T>(response: Response): Promise<T> => {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      typeof data.error === 'string'
        ? data.error
        : 'The research service returned an unexpected error.';
    throw new Error(message);
  }

  return data as T;
};

export const performDeepResearch = async (
  subject: string
): Promise<DeepResearchResponse> => {
  const response = await fetch(resolveApiUrl('/api/research'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ subject }),
  });

  return handleResponse<DeepResearchResponse>(response);
};

export const findNextInquiry = async (researchSummary: string): Promise<string> => {
  const response = await fetch(resolveApiUrl('/api/next-inquiry'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ summary: researchSummary }),
  });

  const data = await handleResponse<{ nextSubject: string }>(response);

  if (!data.nextSubject) {
    throw new Error('Next inquiry was not provided by the research service.');
  }

  return data.nextSubject;
};
