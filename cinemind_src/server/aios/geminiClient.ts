import { GenerateContentParameters, GoogleGenAI, ThinkingLevel } from '@google/genai';

let cachedClient: GoogleGenAI | null = null;

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
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return cachedClient;
}

export const PRIMARY_GEMINI_MODEL = 'gemini-3.5-flash-lite';
export const FALLBACK_GEMINI_MODEL = 'gemini-3.8-flash';
export const GEMINI_TEXT_MODEL = PRIMARY_GEMINI_MODEL;

function isTransientError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  const status = (err as { status?: number })?.status;
  if (status === 400 || status === 401 || status === 403 || status === 404) {
    return false;
  }
  if (
    msg.includes('API_KEY_INVALID') ||
    msg.includes('PERMISSION_DENIED') ||
    msg.includes('INVALID_ARGUMENT')
  ) {
    return false;
  }
  return (
    status === 503 ||
    status === 429 ||
    msg.includes('503') ||
    msg.includes('429') ||
    msg.includes('UNAVAILABLE') ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.includes('timed out')
  );
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface ReliableGeminiResult {
  ok: boolean;
  model: string;
  text: string;
  durationMs: number;
  attempts: number;
  error?: string;
}

export async function generateContentWithRetry(
  contents: GenerateContentParameters['contents'],
  config?: GenerateContentParameters['config'],
  timeoutMs = 10000
): Promise<ReliableGeminiResult> {
  const ai = getGeminiClient();
  if (!ai) {
    return {
      ok: false,
      model: PRIMARY_GEMINI_MODEL,
      text: '',
      durationMs: 0,
      attempts: 0,
      error: 'GEMINI_API_KEY is not configured on the server.',
    };
  }

  const modelsToTry = [PRIMARY_GEMINI_MODEL, FALLBACK_GEMINI_MODEL];
  const start = Date.now();
  let totalAttempts = 0;
  let lastError = 'Unknown Gemini API error';

  for (const model of modelsToTry) {
    const maxRetries = 1;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      totalAttempts++;
      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Gemini request timed out after ${timeoutMs}ms`)), timeoutMs)
        );

        const mergedConfig: GenerateContentParameters['config'] = {
          ...config,
          thinkingConfig:
            model === PRIMARY_GEMINI_MODEL
              ? { thinkingLevel: ThinkingLevel.LOW }
              : config?.thinkingConfig,
        };

        const response = await Promise.race([
          ai.models.generateContent({
            model,
            contents,
            config: mergedConfig,
          }),
          timeoutPromise,
        ]);

        return {
          ok: true,
          model,
          text: (response.text ?? '').trim(),
          durationMs: Date.now() - start,
          attempts: totalAttempts,
        };
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
        if (!isTransientError(err)) {
          // Do not retry auth, invalid API key, or invalid request errors
          break;
        }
        if (attempt < maxRetries) {
          const baseDelay = 400 * Math.pow(2, attempt);
          const jitter = Math.floor(Math.random() * 250);
          await sleep(baseDelay + jitter);
        }
      }
    }
  }

  return {
    ok: false,
    model: FALLBACK_GEMINI_MODEL,
    text: '',
    durationMs: Date.now() - start,
    attempts: totalAttempts,
    error: lastError,
  };
}
