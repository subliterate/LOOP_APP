import { Source, ResearchConfig } from '../types.js';

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

/**
 * Build a research prompt tailored to depth and academic level
 * @param subject Topic to research
 * @param config Research configuration with depth and academic level
 * @returns Formatted prompt for Gemini API
 */
export const buildResearchPrompt = (subject: string, config: any): string => {
  const depthFramework = {
    casual: {
      wordRange: '500-1000',
      structure: 'Overview of key aspects, main developments, current status',
      tone: 'Accessible and clear for general audiences',
      focus: 'Essential facts and main ideas'
    },
    professional: {
      wordRange: '1500-2000',
      structure: 'Context, current practices, practical implications, use cases',
      tone: 'Professional and informative',
      focus: 'Relevant examples and actionable insights'
    },
    scholarly: {
      wordRange: '3000-4000',
      structure: `Introduction with thesis | Historical context | Theoretical frameworks |
                  Multiple perspectives | Empirical evidence | Critical analysis |
                  Future directions | Conclusion`,
      tone: 'Academic and analytical',
      focus: 'Depth, nuance, multiple viewpoints, critical engagement'
    },
    expert: {
      wordRange: '5000-6000',
      structure: `Formal introduction | Literature review | Theoretical positioning |
                  Critical examination of competing frameworks | Empirical analysis |
                  Methodological critique | Emerging research | Original insights |
                  Research gaps and implications`,
      tone: 'Expert-level scholarly discourse',
      focus: 'Cutting-edge analysis, methodological sophistication, research frontiers'
    }
  };

  const academicGuidance = {
    ba: {
      level: 'Upper-level undergraduate / Early graduate',
      vocabulary: 'Sophisticated but not overly specialized',
      complexity: 'Complex ideas explained clearly',
      assumptions: 'Some subject background expected'
    },
    ma: {
      level: 'Master\'s degree',
      vocabulary: 'Advanced disciplinary terminology',
      complexity: 'Complex argumentation with nuance',
      assumptions: 'Substantial subject knowledge expected'
    },
    phd: {
      level: 'Doctoral / Expert',
      vocabulary: 'Specialized technical terminology',
      complexity: 'Highly sophisticated analysis',
      assumptions: 'Deep expertise in field assumed'
    }
  };

  const academicLevel = academicGuidance[config.academicLevel];
  const depth = depthFramework[config.depth];

  return `
RESEARCH TASK: Comprehensive Investigation

Subject: "${subject}"

You are conducting original scholarly research as a preeminent academic expert.
Your goal is to produce a research investigation suitable for ${academicLevel.level} study.

RESEARCH DEPTH: ${config.depth.toUpperCase()}
TARGET LENGTH: ${depth.wordRange} words
ACADEMIC LEVEL: ${academicLevel.level}

STRUCTURE AND CONTENT:

${depth.structure.split('|').map((s: string) => `• ${s.trim()}`).join('\n')}

${config.includePerspectives ? `
CRITICAL ANALYSIS:
Engage multiple theoretical frameworks and perspectives on this subject. Where scholarly
debate exists, present competing interpretations fairly. Acknowledge tensions between
different viewpoints. Analyze the strengths and limitations of different approaches.
` : ''}

${config.includeCaseStudies ? `
EMPIRICAL GROUNDING:
Support arguments with specific examples, case studies, and data. Reference real-world
instances demonstrating principles. When appropriate, include quantitative evidence
and qualitative analysis.
` : ''}

${config.includeMethodology ? `
METHODOLOGICAL CONSIDERATIONS:
Discuss research approaches used to study this topic. Consider empirical methods,
theoretical approaches, and their limitations. Reflect on epistemological questions
relevant to understanding this subject.
` : ''}

WRITING STYLE AND TONE:
- Academic Tone: ${depth.tone}
- Vocabulary Level: ${academicLevel.vocabulary}
- Argument Complexity: ${academicLevel.complexity}
- Reader Background: ${academicLevel.assumptions}

SPECIFIC REQUIREMENTS:

1. THESIS-DRIVEN ARGUMENT
   Open with a clear thesis statement that positions your analysis. Develop this
   thesis throughout, returning to it in conclusion. Present original insights
   beyond simply summarizing existing knowledge.

2. SOPHISTICATED SENTENCE STRUCTURE
   Vary sentence length and structure:
   • Short sentences for emphasis: 8-12 words
   • Medium sentences for development: 15-25 words
   • Complex sentences for analysis: 25-40 words
   • Use parallel structures, subordinate clauses, and varied punctuation

3. DISCIPLINARY DEPTH
   Engage with concepts, theories, and frameworks relevant to this field:
   • Explain foundational concepts with nuance
   • Reference relevant theoretical schools or approaches
   • Discuss how understanding has evolved
   • Address current scholarly debates
   • Point to gaps in current knowledge

4. LOGICAL DEVELOPMENT
   • Topic sentence introduces paragraph idea
   • Supporting sentences develop with evidence and analysis
   • Transitional phrases connect ideas between paragraphs
   • Each section builds on previous ones
   • Synthesis emerges rather than being imposed

5. CRITICAL ENGAGEMENT
   Go beyond description to analysis:
   • Why do these patterns exist?
   • What causes these phenomena?
   • What are the implications?
   • Where are the tensions or paradoxes?
   • What remains uncertain or contested?

6. EVIDENCE AND EXAMPLES
   Ground arguments in concrete instances:
   • Specific historical examples where relevant
   • Contemporary case studies illustrating principles
   • Quantitative data and statistics
   • References to research findings or documented cases
   • Hypothetical scenarios exploring implications

7. FUTURE ORIENTATION
   Include forward-looking analysis:
   • Emerging trends and developments
   • Technological or methodological breakthroughs
   • Predictions and projections
   • Uncertainties and open questions
   • Implications for further research

FORMAT SPECIFICATIONS:
- Plain text (no Markdown, no formatting marks)
- Clear section breaks between major parts
- Numbered or bulleted lists for enumerating points (where appropriate)
- Indentation or line breaks to separate sections
- NO HTML, NO asterisks for emphasis, NO excessive punctuation
- Single space between paragraphs (two line breaks in plain text)

QUALITY ASSURANCE:
- Verify all claims are grounded in established knowledge or logical reasoning
- Ensure argumentation is fair to alternative perspectives
- Avoid unsupported speculation; distinguish between evidence and interpretation
- Acknowledge limitations and uncertainties where appropriate
- Maintain scholarly objectivity while engaging with complex issues

TARGET OUTPUT:
${config.wordCount} words of substantive, scholarly analysis suitable for
${academicLevel.level} audiences and ready for use in academic contexts.
`;
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
   * @param config Optional research configuration (depth, academic level, etc.)
   * @returns Research summary and sources
   */
  const performDeepResearch = async (
    subject: string,
    config?: Partial<any>
  ): Promise<DeepResearchResponse> => {
    return withRetry(() =>
      fetch(resolveApiUrl('/api/research'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject,
          ...config
        }),
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
