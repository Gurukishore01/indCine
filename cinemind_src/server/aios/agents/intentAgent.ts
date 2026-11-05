import { Type } from '@google/genai';
import {
  AIOSIntentType,
  AgentResult,
  MoodConstraints,
  ReleasePeriodPreset,
} from '../../../src/types/aios';
import { getGeminiClient } from '../geminiClient';

const LANGUAGE_KEYWORD_TO_CODE: Record<string, { code: string; name: string }> = {
  tamil: { code: 'ta', name: 'Tamil' },
  telugu: { code: 'te', name: 'Telugu' },
  malayalam: { code: 'ml', name: 'Malayalam' },
  kannada: { code: 'kn', name: 'Kannada' },
  hindi: { code: 'hi', name: 'Hindi' },
  bengali: { code: 'bn', name: 'Bengali' },
  marathi: { code: 'mr', name: 'Marathi' },
  punjabi: { code: 'pa', name: 'Punjabi' },
  gujarati: { code: 'gu', name: 'Gujarati' },
  korean: { code: 'ko', name: 'Korean' },
  japanese: { code: 'ja', name: 'Japanese' },
  chinese: { code: 'zh', name: 'Chinese' },
  mandarin: { code: 'zh', name: 'Chinese' },
  cantonese: { code: 'cn', name: 'Cantonese' },
  french: { code: 'fr', name: 'French' },
  spanish: { code: 'es', name: 'Spanish' },
  german: { code: 'de', name: 'German' },
  italian: { code: 'it', name: 'Italian' },
  arabic: { code: 'ar', name: 'Arabic' },
  portuguese: { code: 'pt', name: 'Portuguese' },
  russian: { code: 'ru', name: 'Russian' },
  english: { code: 'en', name: 'English' },
};

const GENRE_KEYWORD_TO_ID: Record<string, { id: number; name: string }> = {
  thriller: { id: 53, name: 'Thriller' },
  psychological: { id: 53, name: 'Thriller' },
  'sci-fi': { id: 878, name: 'Sci-Fi' },
  'science fiction': { id: 878, name: 'Sci-Fi' },
  'science-fiction': { id: 878, name: 'Sci-Fi' },
  crime: { id: 80, name: 'Crime' },
  mystery: { id: 9648, name: 'Mystery' },
  drama: { id: 18, name: 'Drama' },
  action: { id: 28, name: 'Action' },
  comedy: { id: 35, name: 'Comedy' },
  horror: { id: 27, name: 'Horror' },
  romance: { id: 10749, name: 'Romance' },
  animation: { id: 16, name: 'Animation' },
  adventure: { id: 12, name: 'Adventure' },
  fantasy: { id: 14, name: 'Fantasy' },
  documentary: { id: 99, name: 'Documentary' },
};

export function deterministicExtract(
  prompt: string,
  explicit?: MoodConstraints
): MoodConstraints {
  const lower = prompt.toLowerCase();
  const extracted: MoodConstraints = { ...explicit };

  // 1. Detect Intent Type (order matters: specific factual/ranking intents before generic recommendation)
  if (!extracted.intentType) {
    if (
      (lower.includes('trending') || lower.includes('popular')) &&
      (lower.includes('today') || lower.includes('this week') || lower.includes('right now'))
    ) {
      extracted.intentType = 'trending_query';
    } else if (
      lower.includes('highest-rated') ||
      lower.includes('highest rated') ||
      lower.includes('best-rated') ||
      lower.includes('best rated') ||
      lower.includes('best ') ||
      lower.includes('highest audience rating') ||
      lower.includes('of all time') ||
      lower.includes('till date') ||
      lower.includes('all-time') ||
      lower.includes('top rated') ||
      lower.includes('top-rated') ||
      lower.includes('most horror')
    ) {
      extracted.intentType = 'all_time_ranking';
      extracted.rankBy = lower.includes('most popular') ? 'popularity.desc' : 'vote_average.desc';
      extracted.minVoteCount = 300;
    } else if (lower.includes('similar to') || lower.includes('like ')) {
      extracted.intentType = 'similar_movies';
    } else if (lower.includes('compare ') || lower.includes(' vs ')) {
      extracted.intentType = 'movie_comparison';
    } else if (
      lower.includes('where can i watch') ||
      lower.includes('streaming') ||
      lower.includes('ott')
    ) {
      extracted.intentType = 'ott_availability';
    } else if (
      lower.includes('theatre') ||
      lower.includes('theater') ||
      lower.includes('showtime') ||
      lower.includes('tickets')
    ) {
      extracted.intentType = 'cinema_discovery';
    } else if (
      lower.includes('history of') ||
      lower.includes('tell me about') ||
      lower.includes('why was') ||
      lower.includes('why did') ||
      lower.includes('successful') ||
      lower.includes('box office') ||
      lower.includes('award') ||
      lower.includes('oscar') ||
      lower.includes('anticipated') ||
      lower.includes('what is happening')
    ) {
      extracted.intentType = 'general_research';
    } else if (
      lower.includes('recommend') ||
      lower.includes('suggest') ||
      lower.includes('tonight') ||
      lower.includes('feel like') ||
      lower.includes('i want a')
    ) {
      extracted.intentType = 'mood_recommendation';
    } else if (
      lower.includes('show me') ||
      lower.includes('find ') ||
      lower.includes('which ') ||
      lower.includes('movies released') ||
      lower.includes('all languages')
    ) {
      extracted.intentType = 'global_discovery';
    } else {
      extracted.intentType = 'general_research';
    }
  }

  // 2. Trending window
  if (extracted.intentType === 'trending_query' && !extracted.trendingWindow) {
    extracted.trendingWindow = lower.includes('today') ? 'day' : 'week';
  }

  // 3. Similar-to title
  if (extracted.intentType === 'similar_movies' && !extracted.similarToTitle) {
    const match = prompt.match(/(?:similar to|like)\s+([a-zA-Z0-9\s:'-]+)/i);
    if (match && match[1]) {
      extracted.similarToTitle = match[1].replace(/[?.!]+$/, '').trim();
    }
  }

  // 4. Compare titles
  if (extracted.intentType === 'movie_comparison' && !extracted.compareTitles) {
    const match = prompt.match(
      /compare\s+([a-zA-Z0-9\s:'-]+?)\s+(?:and|vs\.?|with)\s+([a-zA-Z0-9\s:'-]+)/i
    );
    if (match && match[1] && match[2]) {
      extracted.compareTitles = [
        match[1].trim(),
        match[2].replace(/[?.!]+$/, '').trim(),
      ];
    }
  }

  // 5. Original Language
  if (!extracted.originalLanguageCode) {
    if (lower.includes('all languages')) {
      extracted.language = 'All Languages';
      extracted.originalLanguageCode = undefined;
    } else {
      for (const [kw, info] of Object.entries(LANGUAGE_KEYWORD_TO_CODE)) {
        if (lower.includes(kw)) {
          extracted.originalLanguageCode = info.code;
          extracted.language = info.name;
          break;
        }
      }
    }
  }

  // 6. Genres
  const genreIds: number[] = extracted.genreIds ? [...extracted.genreIds] : [];
  for (const [kw, info] of Object.entries(GENRE_KEYWORD_TO_ID)) {
    if (lower.includes(kw)) {
      if (!genreIds.includes(info.id)) genreIds.push(info.id);
      if (!extracted.genre) extracted.genre = info.name;
    }
  }
  if (genreIds.length > 0) {
    extracted.genreIds = genreIds;
  }

  // 7. Release Period & Specific Year
  if (!extracted.releasePeriod) {
    const yearMatch = prompt.match(/\b(19\d{2}|20[0-2]\d)\b/);
    if (yearMatch) {
      extracted.releasePeriod = 'specific_year';
      extracted.specificYear = Number(yearMatch[1]);
    } else if (lower.includes('classic')) {
      extracted.releasePeriod = 'classics';
    } else if (lower.includes('this week')) {
      extracted.releasePeriod = 'this_week';
    } else if (lower.includes('recent') || lower.includes('this month') || lower.includes('latest')) {
      extracted.releasePeriod = 'this_month';
    } else if (lower.includes('this year')) {
      extracted.releasePeriod = 'this_year';
    }
  }

  // 8. Runtime
  if (!extracted.maxRuntimeMinutes) {
    if (lower.includes('90 min') || lower.includes('under 90') || lower.includes('short')) {
      extracted.maxRuntimeMinutes = 90;
    } else if (
      lower.includes('two hours') ||
      lower.includes('2 hours') ||
      lower.includes('120 min')
    ) {
      extracted.maxRuntimeMinutes = 120;
    }
  }

  // 9. Mood
  if (!extracted.mood) {
    if (lower.includes('mind') || lower.includes('cerebral') || lower.includes('twist')) {
      extracted.mood = 'Mind-Bending & Cerebral';
    } else if (lower.includes('fast') || lower.includes('adrenaline') || lower.includes('intense')) {
      extracted.mood = 'Adrenaline Rush & Fast';
    } else if (lower.includes('cozy') || lower.includes('comfort') || lower.includes('wholesome')) {
      extracted.mood = 'Cozy Wholesome Comfort';
    } else if (lower.includes('noir') || lower.includes('dark') || lower.includes('grim')) {
      extracted.mood = 'Late Night Grim Noir';
    } else if (lower.includes('laugh') || lower.includes('funny')) {
      extracted.mood = 'Laugh Out Loud';
    } else if (lower.includes('cry') || lower.includes('emotional') || lower.includes('moving')) {
      extracted.mood = 'Tear-Jerker & Moving';
    }
  }

  if (prompt.trim()) {
    extracted.freeTextQuery = prompt.trim();
  }

  return extracted;
}

export async function runIntentPlanningAgent(
  prompt: string,
  explicitConstraints?: MoodConstraints
): Promise<AgentResult<MoodConstraints> & { usedGemini: boolean }> {
  const start = Date.now();
  const retrievedAt = new Date().toISOString();
  const warnings: string[] = [];
  let usedGemini = false;

  const constraints = deterministicExtract(prompt, explicitConstraints);

  // Only invoke Gemini if the query is complex/ambiguous and lacks clear deterministic filters
  const needsGeminiParsing =
    prompt.trim().length > 25 &&
    !constraints.originalLanguageCode &&
    (!constraints.genreIds || constraints.genreIds.length === 0) &&
    constraints.intentType === 'mood_recommendation';

  const ai = getGeminiClient();
  if (ai && needsGeminiParsing) {
    const { generateContentWithRetry } = await import('../geminiClient');
    const res = await generateContentWithRetry(
      `Extract movie discovery constraints from: "${prompt}".
Return JSON with optional fields: mood, genre, language, maxRuntimeMinutes.`,
      {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            mood: { type: Type.STRING },
            genre: { type: Type.STRING },
            language: { type: Type.STRING },
            maxRuntimeMinutes: { type: Type.INTEGER },
          },
        },
      }
    );

    if (res.ok && res.text) {
      usedGemini = true;
      try {
        const parsed = JSON.parse(res.text);
        if (parsed.mood && !constraints.mood) constraints.mood = parsed.mood;
        if (parsed.genre && !constraints.genre) constraints.genre = parsed.genre;
        if (parsed.language && !constraints.language) {
          constraints.language = parsed.language;
          const mapped = LANGUAGE_KEYWORD_TO_CODE[parsed.language.toLowerCase()];
          if (mapped) constraints.originalLanguageCode = mapped.code;
        }
        if (parsed.maxRuntimeMinutes && !constraints.maxRuntimeMinutes) {
          constraints.maxRuntimeMinutes = parsed.maxRuntimeMinutes;
        }
      } catch {
        warnings.push('Gemini intent JSON parse fallback to deterministic rules.');
      }
    }
  }

  return {
    agent: 'IntentPlanningAgent',
    status: 'completed',
    summary: `Intent: ${constraints.intentType} | Language: ${
      constraints.language || 'Worldwide'
    } | Genre: ${constraints.genre || 'Any'}`,
    items: [constraints],
    evidence: [],
    warnings,
    retrievedAt,
    durationMs: Date.now() - start,
    usedGemini,
  };
}
