import {
  AgentResult,
  EvidenceItem,
  MoodConstraints,
  RecommendationItem,
} from '../../../src/types/aios';
import { getGeminiClient } from '../geminiClient';

export async function runReviewSentimentAgent(
  recommendations: RecommendationItem[],
  constraints: MoodConstraints
): Promise<AgentResult<{ movieId: string; synthesis: string }> & { usedGemini: boolean }> {
  const start = Date.now();
  const retrievedAt = new Date().toISOString();
  const warnings: string[] = [];
  let usedGemini = false;

  if (recommendations.length === 0) {
    return {
      agent: 'ReviewSentimentAgent',
      status: 'unavailable',
      summary: 'No candidate films to analyze.',
      items: [],
      evidence: [],
      warnings: ['Empty recommendation list.'],
      retrievedAt,
      durationMs: Date.now() - start,
      usedGemini: false,
    };
  }

  const top = recommendations[0];
  const ai = getGeminiClient();

  if (ai) {
    const { generateContentWithRetry } = await import('../geminiClient');
    const res = await generateContentWithRetry(
      `You are CINEMIND's Review & Sentiment Agent.
User constraints: ${JSON.stringify(constraints)}
Top recommended film: ${top.movie.title} (${top.movie.year}, ${top.movie.language}).
TMDB Audience Consensus: "${top.movie.reviewSummary.audienceConsensus}"
Critic Review Status: "${top.movie.reviewSummary.criticConsensus}"
Film Premise: "${top.movie.synopsis}"
Write a concise 2-sentence grounded explanation of how this film's premise and TMDB audience reception fit the user's request. Explicitly note that critic review data is unavailable. Do not invent any critic scores or external reviews.`
    );
    if (res.ok && res.text) {
      top.reviewInsight = res.text;
      usedGemini = true;
    } else {
      warnings.push(
        `Gemini review synthesis unavailable (${res.error || 'unknown'}); using sourced TMDB audience consensus.`
      );
    }
  } else {
    warnings.push('GEMINI_API_KEY not configured; using sourced TMDB audience consensus.');
  }

  const evidence: EvidenceItem[] = recommendations.slice(0, 3).map((rec) => ({
    sourceName: rec.movie.reviewSummary.sourceName,
    sourceUrl: rec.movie.reviewSummary.sourceUrl,
    publishedAt: rec.movie.releaseDate || null,
    retrievedAt,
    territory: rec.movie.region || 'Worldwide',
    metric: 'tmdb_audience_rating',
    value: rec.movie.reviewSummary.sampleSize,
    methodologyNote: `${rec.movie.reviewSummary.audienceConsensus} (${rec.movie.reviewSummary.criticConsensus})`,
    confidence: (rec.movie.sourceVoteCount || 0) >= 100 ? 'high' : 'medium',
  }));

  return {
    agent: 'ReviewSentimentAgent',
    status: warnings.length > 0 ? 'partial' : 'completed',
    summary: `Synthesized TMDB audience consensus for ${recommendations.length} title(s) (critic review data unavailable).`,
    items: recommendations.map((r) => ({
      movieId: r.movie.id,
      synthesis: r.reviewInsight,
    })),
    evidence,
    warnings,
    retrievedAt,
    durationMs: Date.now() - start,
    usedGemini,
  };
}
