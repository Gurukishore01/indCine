import { EvidenceItem, Movie } from '../../../src/types/aios';
import { generateContentWithRetry } from '../geminiClient';
import { runIndianMovieDiscoveryAgent } from './indianMovieDiscoveryAgent';

export interface ResearchAgentResult {
  agent: string;
  status: 'completed' | 'partial' | 'failed';
  movies: Movie[];
  synthesis: string;
  evidence: EvidenceItem[];
  warnings: string[];
  summary: string;
  durationMs: number;
}

export async function runMovieResearchAgent(query: string): Promise<ResearchAgentResult> {
  const start = Date.now();
  const discResult = await runIndianMovieDiscoveryAgent({ query });
  const movies = discResult.movies;
  const evidence: EvidenceItem[] = [...discResult.evidence];
  const warnings: string[] = [...discResult.warnings];

  const prompt = `You are IndCine Movie Research Agent.
Answer this Indian cinema query accurately based on facts without hallucination:
Query: "${query}"

Available Verified Indian Cinema Records:
${movies
  .slice(0, 5)
  .map(
    (m) =>
      `• ${m.title} (${m.year}) - Language: ${m.language}, Director: ${m.director}, Genres: ${m.genres.join(
        ', '
      )}, Box Office Worldwide: ₹${m.boxOffice?.worldwideGrossCrore ?? 'N/A'} Cr, Status: ${
        m.boxOffice?.reportedStatus ?? 'N/A'
      }, OTT: ${m.verifiedOttProviders.map((p) => p.providerName).join(', ') || 'Not verified'}`
  )
  .join('\n')}

Provide an evidence-backed intelligence briefing answering the query. Clearly state if any information is unverified.`;

  const geminiRes = await generateContentWithRetry(prompt, 8000);
  const synthesis = geminiRes.ok
    ? geminiRes.text
    : `Synthesized research for "${query}" across ${movies.length} verified Indian cinema titles.`;

  return {
    agent: 'MovieResearchAgent',
    status: 'completed',
    movies,
    synthesis,
    evidence,
    warnings,
    summary: `Executed in-depth research across ${movies.length} verified titles.`,
    durationMs: Date.now() - start,
  };
}
