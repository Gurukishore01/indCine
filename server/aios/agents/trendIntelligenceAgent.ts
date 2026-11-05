import { EvidenceItem, TrendMovementItem } from '../../../src/types/aios';
import { getTrendMovements } from '../../services/observationStore';

export interface TrendAgentResult {
  agent: string;
  status: 'completed' | 'partial' | 'failed';
  movements: TrendMovementItem[];
  hasSufficientHistory: boolean;
  disclosure: string;
  evidence: EvidenceItem[];
  warnings: string[];
  summary: string;
  durationMs: number;
}

export async function runTrendIntelligenceAgent(window: 'day' | 'week' = 'day'): Promise<TrendAgentResult> {
  const start = Date.now();
  const data = getTrendMovements(window);
  const evidence: EvidenceItem[] = [];
  const warnings: string[] = [];

  if (!data.hasSufficientHistory) {
    warnings.push(
      'Insufficient observation history: Trend trajectory (Rising/Falling) requires at least two recorded snapshots.'
    );
  }

  data.movements.forEach((m) => {
    evidence.push({
      sourceName: m.source,
      sourceUrl: 'https://api.themoviedb.org/3/trending/movie/' + window,
      publishedAt: null,
      retrievedAt: m.lastObservedAt,
      territory: 'India / Global',
      metric: 'popularity_trend_signal',
      value: `${m.title}: ${m.status} (Delta: ${m.rankDelta ?? 'N/A'}, Change: ${m.percentageChange ?? 'N/A'}%)`,
      methodologyNote: data.disclosure,
      confidence: m.status === 'Insufficient history' ? 'low' : 'high',
    });
  });

  return {
    agent: 'TrendIntelligenceAgent',
    status: 'completed',
    movements: data.movements,
    hasSufficientHistory: data.hasSufficientHistory,
    disclosure: data.disclosure,
    evidence,
    warnings,
    summary: `Processed ${data.movements.length} trend signals. ${
      data.hasSufficientHistory ? 'Historical movement verified.' : 'Awaiting additional snapshot intervals.'
    }`,
    durationMs: Date.now() - start,
  };
}
