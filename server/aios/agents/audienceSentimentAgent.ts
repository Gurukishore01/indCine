import { EvidenceItem, Movie, ReceptionAnalysis } from '../../../src/types/aios';
import { generateContentWithRetry } from '../geminiClient';

export interface SentimentAgentResult {
  agent: string;
  status: 'completed' | 'partial' | 'failed';
  receptions: Record<string, ReceptionAnalysis>;
  evidence: EvidenceItem[];
  warnings: string[];
  summary: string;
  durationMs: number;
}

export async function runAudienceSentimentAgent(movies: Movie[]): Promise<SentimentAgentResult> {
  const start = Date.now();
  const receptions: Record<string, ReceptionAnalysis> = {};
  const evidence: EvidenceItem[] = [];
  const warnings: string[] = [];

  for (const m of movies.slice(0, 3)) {
    receptions[m.id] = m.reception;

    evidence.push({
      sourceName: m.reception.sourceName || 'Critical Review & Audience Aggregate',
      sourceUrl: m.reception.sourceUrl || `https://www.themoviedb.org/movie/${m.id}`,
      publishedAt: null,
      retrievedAt: new Date().toISOString(),
      territory: 'India',
      metric: 'audience_and_critic_reception',
      value: `Critic: ${m.reception.criticScore ?? 'N/A'}% | Audience: ${m.reception.audienceScore ?? 'N/A'}%`,
      methodologyNote: m.reception.audienceSampleNote || 'Synthesized from published regional Indian review publications.',
      confidence: m.reception.criticScore ? 'high' : 'moderate',
    });
  }

  // Synthesize via Gemini if available
  const prompt = `You are IndCine Audience & Critic Sentiment Agent.
Summarize the verified audience and critic consensus for these Indian films without fabricating ratings or fake viewer quotes:
${movies
  .slice(0, 3)
  .map(
    (m) =>
      `- Title: ${m.title} (${m.year}, ${m.language})\n  Critic Consensus: ${m.reception.criticConsensus}\n  Audience Consensus: ${m.reception.audienceConsensus}\n  Praise: ${m.reception.praiseThemes.join(', ')}\n  Complaints: ${m.reception.criticismThemes.join(', ')}`
  )
  .join('\n\n')}

Provide a concise 2-3 sentence overview highlighting the consensus pattern across languages.`;

  const geminiRes = await generateContentWithRetry(prompt, 6000);
  const summary = geminiRes.ok
    ? geminiRes.text
    : `Synthesized reception records for ${Object.keys(receptions).length} titles with separate critic and audience streams.`;

  return {
    agent: 'AudienceCriticSentimentAgent',
    status: 'completed',
    receptions,
    evidence,
    warnings,
    summary,
    durationMs: Date.now() - start,
  };
}
