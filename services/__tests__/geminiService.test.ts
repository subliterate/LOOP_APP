import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { performDeepResearch, findNextInquiry } from '../geminiService';

const jsonResponse = (body: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });

const mockFetch = () => fetch as unknown as ReturnType<typeof vi.fn>;

describe('geminiService', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sends research requests to the API and returns parsed payloads', async () => {
    const summary = 'Deep dive summary';
    const sources = [{ web: { uri: 'https://example.com', title: 'Example' } }];

    mockFetch().mockResolvedValueOnce(jsonResponse({ summary, sources }));

    const result = await performDeepResearch('AI safety');

    expect(fetch).toHaveBeenCalledWith('/api/research', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject: 'AI safety' }),
    });
    expect(result).toEqual({ summary, sources });
  });

  it('throws a descriptive error when research API returns a failure', async () => {
    mockFetch().mockResolvedValueOnce(
      jsonResponse({ error: 'Gemini offline' }, { status: 502 })
    );

    await expect(performDeepResearch('AI safety')).rejects.toThrow(
      'Gemini offline'
    );
  });

  it('returns the next inquiry when the planner succeeds', async () => {
    mockFetch().mockResolvedValueOnce(
      jsonResponse({ nextSubject: 'AI governance' })
    );

    const nextSubject = await findNextInquiry('Prior summary');

    expect(fetch).toHaveBeenCalledWith('/api/next-inquiry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ summary: 'Prior summary' }),
    });
    expect(nextSubject).toBe('AI governance');
  });

  it('surfaces an error when next inquiry payload is missing the subject', async () => {
    mockFetch().mockResolvedValueOnce(jsonResponse({ nextSubject: '' }));

    await expect(findNextInquiry('Prior summary')).rejects.toThrow(
      'Next inquiry was not provided by the research service.'
    );
  });

  it('throws the server-provided error when planner endpoint fails', async () => {
    mockFetch().mockResolvedValueOnce(
      jsonResponse({ error: 'Planner unavailable' }, { status: 500 })
    );

    await expect(findNextInquiry('Prior summary')).rejects.toThrow(
      'Planner unavailable'
    );
  });
});
