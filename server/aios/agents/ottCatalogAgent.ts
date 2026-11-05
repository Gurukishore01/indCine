import { EvidenceItem, Movie, VerifiedOttProvider } from '../../../src/types/aios';
import { getIndianMovieDetails } from '../../services/tmdbService';

export interface OttAgentResult {
  agent: string;
  status: 'completed' | 'partial' | 'failed';
  providersByMovie: Record<string, VerifiedOttProvider[]>;
  evidence: EvidenceItem[];
  warnings: string[];
  summary: string;
  durationMs: number;
}

export async function runOttCatalogAgent(movieIds: string[]): Promise<OttAgentResult> {
  const start = Date.now();
  const providersByMovie: Record<string, VerifiedOttProvider[]> = {};
  const evidence: EvidenceItem[] = [];
  const warnings: string[] = [];

  const details = await Promise.all(movieIds.map((id) => getIndianMovieDetails(id)));

  details.forEach((m) => {
    if (!m) return;
    providersByMovie[m.id] = m.verifiedOttProviders;

    if (m.verifiedOttProviders.length === 0) {
      warnings.push(`No verified India OTT streaming platform confirmed for "${m.title}".`);
    } else {
      m.verifiedOttProviders.forEach((p) => {
        evidence.push({
          sourceName: 'JustWatch / TMDB Watch Providers v3',
          sourceUrl: p.link || `https://www.justwatch.com/in/search?q=${encodeURIComponent(m.title)}`,
          publishedAt: null,
          retrievedAt: new Date().toISOString(),
          territory: 'India (IN)',
          metric: 'ott_streaming_availability',
          value: `${p.providerName} (${p.category.toUpperCase()})`,
          methodologyNote: p.attribution,
          confidence: 'high',
        });
      });
    }
  });

  return {
    agent: 'OTTCatalogIntelligenceAgent',
    status: 'completed',
    providersByMovie,
    evidence,
    warnings,
    summary: `Verified India OTT availability across ${Object.keys(providersByMovie).length} titles without fabricating viewership figures.`,
    durationMs: Date.now() - start,
  };
}
