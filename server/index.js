import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

// Initialize structured logging
const createSimpleLogger = (serviceName) => {
  const enableJson = process.env.LOG_FORMAT === 'json';
  const minLevel = process.env.LOG_LEVEL || 'INFO';
  const levels = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };
  const minLevelValue = levels[minLevel.toUpperCase()] ?? 1;

  return {
    debug: (message, ctx) => {
      if (levels.DEBUG >= minLevelValue) {
        const log = { timestamp: new Date().toISOString(), level: 'DEBUG', service: serviceName, message, ...ctx };
        console.log(enableJson ? JSON.stringify(log) : `[${log.timestamp}] [${log.level}] [${serviceName}] ${message}`);
      }
    },
    info: (message, ctx) => {
      if (levels.INFO >= minLevelValue) {
        const log = { timestamp: new Date().toISOString(), level: 'INFO', service: serviceName, message, ...ctx };
        console.log(enableJson ? JSON.stringify(log) : `[${log.timestamp}] [${log.level}] [${serviceName}] ${message}`);
      }
    },
    warn: (message, ctx) => {
      if (levels.WARN >= minLevelValue) {
        const log = { timestamp: new Date().toISOString(), level: 'WARN', service: serviceName, message, ...ctx };
        console.warn(enableJson ? JSON.stringify(log) : `[${log.timestamp}] [${log.level}] [${serviceName}] ${message}`);
      }
    },
    error: (message, ctx) => {
      if (levels.ERROR >= minLevelValue) {
        const log = { timestamp: new Date().toISOString(), level: 'ERROR', service: serviceName, message, ...ctx };
        console.error(enableJson ? JSON.stringify(log) : `[${log.timestamp}] [${log.level}] [${serviceName}] ${message}`);
      }
    },
  };
};

const logger = createSimpleLogger('server');

const PORT = Number.parseInt(process.env.PORT || '4000', 10);
const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;

if (!apiKey) {
  logger.error('Missing GEMINI_API_KEY environment variable');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });
const app = express();

logger.info('Server initializing', { port: PORT });

app.use(cors());
app.use(express.json({ limit: '1mb' }));

/**
 * Retry configuration for Gemini API calls
 */
const RETRY_CONFIG = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
};

/**
 * Sleep for a specified duration
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Calculate delay with exponential backoff and jitter
 */
const calculateBackoffDelay = (attempt) => {
  const exponentialDelay = RETRY_CONFIG.initialDelayMs * Math.pow(RETRY_CONFIG.backoffMultiplier, attempt);
  const cappedDelay = Math.min(exponentialDelay, RETRY_CONFIG.maxDelayMs);
  const jitter = cappedDelay * 0.1 * (Math.random() * 2 - 1);
  return Math.max(0, cappedDelay + jitter);
};

/**
 * Check if an error is retryable
 */
const isRetryableError = (error) => {
  const message = error?.message || '';
  // Retry on rate limits, network errors, and temporary failures
  return (
    message.includes('429') ||
    message.includes('500') ||
    message.includes('503') ||
    message.includes('timeout') ||
    message.includes('ECONNREFUSED') ||
    message.includes('network')
  );
};

/**
 * Retry a function with exponential backoff
 */
const withRetry = async (fn, fnName = 'function') => {
  let lastError;

  for (let attempt = 0; attempt < RETRY_CONFIG.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === RETRY_CONFIG.maxAttempts - 1) {
        break;
      }

      if (!isRetryableError(error)) {
        throw error;
      }

      const delay = calculateBackoffDelay(attempt);
      logger.warn(`${fnName} attempt failed, retrying`, {
        function: fnName,
        attempt: attempt + 1,
        delayMs: Math.round(delay),
        error: error.message,
      });
      await sleep(delay);
    }
  }

  throw lastError;
};

const mapGroundingChunksToSources = (groundingChunks = []) => {
  return groundingChunks.reduce((acc, chunk) => {
    const uri = chunk.web?.uri;
    const title = chunk.web?.title;

    if (uri && title) {
      acc.push({ web: { uri, title } });
    }

    return acc;
  }, []);
};

app.post('/api/research', async (req, res) => {
  const { subject } = req.body || {};

  if (!subject || typeof subject !== 'string') {
    res.status(400).json({ error: 'Subject is required.' });
    return;
  }

  try {
    const prompt = `You are a world-class research analyst. Conduct a comprehensive deep research investigation into the following subject. Your goal is to produce a concise yet thorough summary covering the key aspects, historical context, significant developments, and current status. Format the summary into well-structured, easy-to-read paragraphs for maximum user-friendliness. Synthesize information from multiple sources to provide a holistic overview. The output must be plain text, not Markdown. The subject is: "${subject}"`;

    const response = await withRetry(() =>
      ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      }),
      'api/research'
    );

    const summary = response.text ?? '';

    if (!summary.trim()) {
      logger.warn('Empty research summary returned', { subject });
      res.status(502).json({ error: 'Gemini did not return a summary.' });
      return;
    }

    const groundingChunks =
      response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = mapGroundingChunksToSources(groundingChunks);

    logger.info('Research completed successfully', {
      subject,
      sourcesCount: sources.length,
    });
    res.json({ summary, sources });
  } catch (error) {
    logger.error('Research failed after retries', {
      subject,
      error: error.message,
    });
    res.status(502).json({
      error: `Failed to perform deep research on "${subject}".`,
    });
  }
});

app.post('/api/next-inquiry', async (req, res) => {
  const { summary } = req.body || {};

  if (!summary || typeof summary !== 'string') {
    res.status(400).json({ error: 'Summary is required.' });
    return;
  }

  try {
    const prompt = `You are a strategic research planner. Based on the following research summary, identify the single most logical and promising next thread of inquiry to deepen the investigation. Your response must be only the subject for the next research step, with no additional commentary, labels, or explanation. The output must be plain text, not Markdown. Research Summary: \`\`\`${summary}\`\`\``;

    const response = await withRetry(() =>
      ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
      }),
      'api/next-inquiry'
    );

    const nextSubject = (response.text || '').trim();

    if (!nextSubject) {
      logger.warn('Empty next inquiry returned');
      res.status(502).json({ error: 'Gemini could not determine the next inquiry.' });
      return;
    }

    logger.info('Next inquiry found', { nextSubject });
    res.json({ nextSubject });
  } catch (error) {
    logger.error('Next inquiry lookup failed after retries', {
      error: error.message,
    });
    res.status(502).json({
      error: 'Failed to find the next thread of inquiry.',
    });
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  logger.info('API server started successfully', {
    port: PORT,
    url: `http://localhost:${PORT}`,
    environment: process.env.NODE_ENV || 'development',
  });
});
