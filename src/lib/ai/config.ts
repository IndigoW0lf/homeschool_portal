import OpenAI from 'openai';

// Model configuration
export const AI_MODELS = {
  default: 'gpt-4.1-nano',
  escalation: 'gpt-4.1',
} as const;

// API configuration
export const AI_CONFIG = {
  temperature: 0.7,
  maxTokens: 1024,
  // Rate limiting
  maxRequestsPerMinute: 10,
} as const;

// Lazy-initialized OpenAI client
let openaiClient: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}
