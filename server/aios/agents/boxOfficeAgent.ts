import { BoxOfficeMetrics, EvidenceItem, Movie } from '../../../src/types/aios';

export interface BoxOfficeAgentResult {
  agent: string;
  status: 'completed' | 'partial' | 'failed';
  reportsByMovie: Record<string, BoxOfficeMetrics | null>;
  evidence: EvidenceItem[];
  warnings: string[];
  summary: string;
  durationMs: number;
}

export async function runBoxOfficeAgent(movies: Movie[]): Promise<BoxOfficeAgentResult> {
  const start = Date.now();
  const reportsByMovie: Record<string, BoxOfficeMetrics | null> = {};
  const evidence: EvidenceItem[] = [];
  const warnings: string[] = [];

  movies.forEach((m) => {
    reportsByMovie[m.id] = m.boxOffice;

    if (!m.boxOffice) {
      warnings.push(`Theatrical collections unverified or not publicly disclosed for "${m.title}".`);
    } else {
      evidence.push({
        sourceName: m.boxOffice.sourceName,
        sourceUrl: 'https://www.sacnilk.com',
        publishedAt: m.boxOffice.publicationDate || null,
        retrievedAt: new Date().toISOString(),
        territory: 'India & Overseas',
        metric: 'theatrical_box_office_collections',
        value: `India Net: ₹${m.boxOffice.indiaNetCrore ?? 'N/A'} Cr | Worldwide: ₹${
          m.boxOffice.worldwideGrossCrore ?? 'N/A'
        } Cr | Budget: ₹${m.boxOffice.budgetCrore ?? 'N/A'} Cr`,
        methodologyNote: `${m.boxOffice.methodologyNote} Reported Status: ${m.boxOffice.reportedStatus}.`,
        confidence:
          m.boxOffice.confidence === 'high'
            ? 'high'
            : m.boxOffice.confidence === 'moderate'
            ? 'moderate'
            : 'low',
      });
    }
  });

  return {
    agent: 'BoxOfficeIntelligenceAgent',
    status: 'completed',
    reportsByMovie,
    evidence,
    warnings,
    summary: `Compiled theatrical collection metrics for ${
      Object.values(reportsByMovie).filter(Boolean).length
    } Indian films with distinct gross, net, and budget definitions.`,
    durationMs: Date.now() - start,
  };
}
