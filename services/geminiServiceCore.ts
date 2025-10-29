import { Source } from '../types.js';

export interface DeepResearchResponse {
  summary: string;
  sources: Source[];
}

/**
 * Retry configuration for exponential backoff
 */
export interface RetryConfig {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

/**
 * Default retry configuration: 3 attempts with exponential backoff
 * 1st attempt: 500ms, 2nd: 1000ms, 3rd: 2000ms (capped at 5000ms)
 */
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelayMs: 500,
  maxDelayMs: 5000,
  backoffMultiplier: 2,
};

/**
 * Check if an error is retryable (network errors, 5xx, 429)
 */
const isRetryableError = (error: unknown): boolean => {
  if (error instanceof TypeError) {
    // Network errors (fetch failed, timeout, etc.)
    return true;
  }
  if (error instanceof Error && error.message.includes('status')) {
    // HTTP error responses
    return true;
  }
  return false;
};

/**
 * Sleep for a specified duration (ms)
 */
const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Calculate delay with exponential backoff
 */
const calculateBackoffDelay = (attempt: number, config: RetryConfig): number => {
  const exponentialDelay = config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt);
  const cappedDelay = Math.min(exponentialDelay, config.maxDelayMs);
  // Add jitter (±10%) to avoid thundering herd
  const jitter = cappedDelay * 0.1 * (Math.random() * 2 - 1);
  return Math.max(0, cappedDelay + jitter);
};

/**
 * Retry a function with exponential backoff
 * @param fn Function to retry
 * @param config Retry configuration
 * @param onRetry Optional callback for logging retries
 * @returns Promise resolving to function result
 */
const withRetry = async <T>(
  fn: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
  onRetry?: (attempt: number, error: unknown) => void
): Promise<T> => {
  let lastError: unknown;

  for (let attempt = 0; attempt < config.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry on the last attempt
      if (attempt === config.maxAttempts - 1) {
        break;
      }

      // Check if error is retryable
      if (!isRetryableError(error)) {
        throw error;
      }

      const delay = calculateBackoffDelay(attempt, config);
      onRetry?.(attempt + 1, error);
      await sleep(delay);
    }
  }

  throw lastError;
};

/**
 * Handle HTTP response and extract data
 */
const handleResponse = async <T>(response: Response): Promise<T> => {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      typeof (data as { error?: unknown }).error === 'string'
        ? (data as { error: string }).error
        : `The research service returned an error (${response.status}).`;
    const error = new Error(message);
    (error as any).statusCode = response.status;
    throw error;
  }

  return data as T;
};

export const createGeminiService = (
  resolveEnvValue: (key: string) => string | undefined
) => {
  const isBrowser =
    typeof window !== 'undefined' && typeof window.location !== 'undefined';

  const fallbackBase = () => {
    const fallbackPort = resolveEnvValue('PORT') || '4000';
    return `http://localhost:${fallbackPort}`;
  };

  const resolveApiUrl = (path: string): string => {
    const base = resolveEnvValue('VITE_API_BASE_URL');

    if (base) {
      const trimmedBase = base.trim();

      if (trimmedBase) {
        let normalizedBase = trimmedBase;

        while (normalizedBase.endsWith('/')) {
          normalizedBase = normalizedBase.slice(0, -1);
        }
        const resolvedPath = `${normalizedBase}${path}`;

        if (isBrowser) {
          return resolvedPath;
        }

        if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(resolvedPath)) {
          return resolvedPath;
        }

        return new URL(resolvedPath, fallbackBase()).toString();
      }
    }

    if (isBrowser) {
      return path;
    }

    return new URL(path, fallbackBase()).toString();
  };

  /**
   * Perform deep research on a subject with automatic retry
   * @param subject Topic to research
   * @returns Research summary and sources
   */
  const performDeepResearch = async (
    subject: string
  ): Promise<DeepResearchResponse> => {
    return withRetry(() =>
      fetch(resolveApiUrl('/api/research'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subject }),
      }).then(handleResponse<DeepResearchResponse>)
    );
  };

  /**
   * Find the next inquiry topic based on current research with automatic retry
   * @param researchSummary Current research summary
   * @returns Suggested next topic for research
   */
  const findNextInquiry = async (researchSummary: string): Promise<string> => {
    const data = await withRetry(() =>
      fetch(resolveApiUrl('/api/next-inquiry'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ summary: researchSummary }),
      }).then(handleResponse<{ nextSubject: string }>)
    );

    if (!data.nextSubject) {
      throw new Error('Next inquiry was not provided by the research service.');
    }

    return data.nextSubject;
  };

  return { performDeepResearch, findNextInquiry };
};
