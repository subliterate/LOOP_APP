import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Source } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface DeepResearchResponse {
  summary: string;
  sources: Source[];
}

export const performDeepResearch = async (subject: string): Promise<DeepResearchResponse> => {
  try {
    const prompt = `You are a world-class research analyst. Conduct a comprehensive deep research investigation into the following subject. Your goal is to produce a concise yet thorough summary covering the key aspects, historical context, significant developments, and current status. Format the summary into well-structured, easy-to-read paragraphs for maximum user-friendliness. Synthesize information from multiple sources to provide a holistic overview. The output must be plain text, not Markdown. The subject is: "${subject}"`;
    
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const summary = response.text;
    // Fix: The API's `groundingChunks` may contain sources without a `uri` or `title`.
    // We must filter these out and map to the `Source` type to prevent type errors.
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources: Source[] = groundingChunks.reduce<Source[]>((acc, chunk) => {
      if (chunk.web?.uri && chunk.web?.title) {
        acc.push({
          web: {
            uri: chunk.web.uri,
            title: chunk.web.title,
          },
        });
      }
      return acc;
    }, []);
    
    if (!summary) {
      throw new Error("Gemini API returned an empty summary.");
    }

    return { summary, sources };
  } catch (error) {
    console.error("Error in performDeepResearch:", error);
    throw new Error(`Failed to perform deep research on "${subject}".`);
  }
};

export const findNextInquiry = async (researchSummary: string): Promise<string> => {
  try {
    const prompt = `You are a strategic research planner. Based on the following research summary, identify the single most logical and promising next thread of inquiry to deepen the investigation. Your response must be only the subject for the next research step, with no additional commentary, labels, or explanation. The output must be plain text, not Markdown. Research Summary: \`\`\`${researchSummary}\`\`\``;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: prompt,
    });
    
    const nextSubject = response.text.trim();
    if (!nextSubject) {
      throw new Error("Gemini API could not determine the next inquiry.");
    }

    return nextSubject;
  } catch (error) {
    console.error("Error in findNextInquiry:", error);
    throw new Error("Failed to find the next thread of inquiry.");
  }
};