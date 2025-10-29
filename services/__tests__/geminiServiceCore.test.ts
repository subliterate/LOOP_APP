import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { createGeminiService } from '../geminiServiceCore.js';

const jsonResponse = (body: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });

const mockFetch = () => fetch as unknown as ReturnType<typeof vi.fn>;

describe('createGeminiService', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('supports relative API bases when running in the browser', async () => {
    vi.stubGlobal('window', { location: {} });

    const { performDeepResearch } = createGeminiService((key) => {
      if (key === 'VITE_API_BASE_URL') {
        return '/.netlify/functions';
      }

      return undefined;
    });

    mockFetch().mockResolvedValueOnce(jsonResponse({ summary: '', sources: [] }));

    await performDeepResearch('topic');

    expect(fetch).toHaveBeenCalledWith(
      '/.netlify/functions/api/research',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('derives an absolute URL for relative bases outside the browser', async () => {
    const { performDeepResearch } = createGeminiService((key) => {
      if (key === 'VITE_API_BASE_URL') {
        return '/.netlify/functions';
      }

      if (key === 'PORT') {
        return '5001';
      }

      return undefined;
    });

    mockFetch().mockResolvedValueOnce(jsonResponse({ summary: '', sources: [] }));

    await performDeepResearch('topic');

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:5001/.netlify/functions/api/research',
      expect.objectContaining({ method: 'POST' })
    );
  });
});
