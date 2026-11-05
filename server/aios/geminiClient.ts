import { GoogleGenAI } from '@google/genai';

let cachedClient: GoogleGenAI | null = null;
let lastGeminiSuccess: string | null = null;
let lastGeminiAttempt: string | null = null;
let lastGeminiState: 'successful' | 'rate-limited' | 'failed' | 'unavailable' | 'not-configured' = 'not-configured';

export function getGeminiHealthState() {
  const isConfigured = Boolean(
    process.env.GEMINI_API_KEY &&
    process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY' &&
    process.env.GEMINI_API_KEY.trim() !== ''
  );
  return {
    configured: isConfigured,
    state: !isConfigured ? ('not-configured' as const) : lastGeminiState,
    lastSuccessfulRetrieval: lastGeminiSuccess,
    lastAttemptAt: lastGeminiAttempt,
  };
}

export function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
    return null;
  }
  if (!cachedClient) {
    cachedClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'indcine-aios',
        },
      },
    });
  }
  return cachedClient;
}

export const PRIMARY_GEMINI_MODEL = 'gemini-3.8-flash';
export const FALLBACK_GEMINI_MODEL = 'gemini-3.1-flash-lite';

export interface ReliableGeminiResult {
  ok: boolean;
  model: string;
  text: string;
  durationMs: number;
  attempts: number;
  error?: string;
}

export async function generateContentWithRetry(
  prompt: string,
  timeoutMs = 12000
): Promise<ReliableGeminiResult> {
  const ai = getGeminiClient();
  if (!ai) {
    return {
      ok: false,
      model: PRIMARY_GEMINI_MODEL,
      text: '',
      durationMs: 0,
      attempts: 0,
      error: 'GEMINI_API_KEY is not configured on the server. AIOS operates in deterministic intelligence mode.',
    };
  }

  const modelsToTry = [PRIMARY_GEMINI_MODEL, FALLBACK_GEMINI_MODEL];
  const start = Date.now();
  let totalAttempts = 0;
  let lastError = 'Unknown Gemini API error';
  lastGeminiAttempt = new Date().toISOString();

  for (const model of modelsToTry) {
    totalAttempts++;
    try {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Gemini request timed out after ${timeoutMs}ms`)), timeoutMs)
      );

      const response = await Promise.race([
        ai.models.generateContent({
          model,
          contents: prompt,
        }),
        timeoutPromise,
      ]);

      lastGeminiSuccess = new Date().toISOString();
      lastGeminiState = 'successful';

      return {
        ok: true,
        model,
        text: (response.text ?? '').trim(),
        durationMs: Date.now() - start,
        attempts: totalAttempts,
      };
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      console.warn(`Gemini attempt with ${model} failed:`, lastError);
    }
  }

  lastGeminiState =
    lastError.includes('429') || lastError.toLowerCase().includes('quota')
      ? 'rate-limited'
      : 'failed';

  return {
    ok: false,
    model: FALLBACK_GEMINI_MODEL,
    text: '',
    durationMs: Date.now() - start,
    attempts: totalAttempts,
    error: lastError,
  };
}
