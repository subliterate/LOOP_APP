import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const PORT = Number.parseInt(process.env.PORT || '4000', 10);
const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;

if (!apiKey) {
  console.error('[startup] Missing GEMINI_API_KEY environment variable');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });
const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));

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

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const summary = response.text ?? '';

    if (!summary.trim()) {
      res.status(502).json({ error: 'Gemini did not return a summary.' });
      return;
    }

    const groundingChunks =
      response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = mapGroundingChunksToSources(groundingChunks);

    res.json({ summary, sources });
  } catch (error) {
    console.error('[api/research] Gemini request failed', error);
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

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt,
    });

    const nextSubject = (response.text || '').trim();

    if (!nextSubject) {
      res.status(502).json({ error: 'Gemini could not determine the next inquiry.' });
      return;
    }

    res.json({ nextSubject });
  } catch (error) {
    console.error('[api/next-inquiry] Gemini request failed', error);
    res.status(502).json({
      error: 'Failed to find the next thread of inquiry.',
    });
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`[startup] API server listening on http://localhost:${PORT}`);
});
