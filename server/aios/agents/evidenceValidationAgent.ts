import { EvidenceItem } from '../../../src/types/aios';

export interface ValidationAgentResult {
  agent: string;
  status: 'completed' | 'partial' | 'failed';
  verifiedCount: number;
  flaggedCount: number;
  validatedEvidence: EvidenceItem[];
  warnings: string[];
  summary: string;
  durationMs: number;
}

export async function runEvidenceValidationAgent(evidenceList: EvidenceItem[]): Promise<ValidationAgentResult> {
  const start = Date.now();
  const validatedEvidence: EvidenceItem[] = [];
  const warnings: string[] = [];
  let flaggedCount = 0;

  evidenceList.forEach((item) => {
    // Check for banned unsupported claims or un-attributed sources
    if (!item.sourceName || item.sourceName.trim() === '') {
      warnings.push(`Evidence item rejected: Missing source attribution.`);
      flaggedCount++;
      return;
    }

    if (item.metric.includes('streaming_hours') || item.metric.includes('viewer_count')) {
      warnings.push(`Evidence flag: Private streaming viewership metrics cannot be independently verified.`);
      flaggedCount++;
      item.confidence = 'low';
    }

    validatedEvidence.push(item);
  });

  return {
    agent: 'EvidenceValidationAgent',
    status: 'completed',
    verifiedCount: validatedEvidence.length,
    flaggedCount,
    validatedEvidence,
    warnings,
    summary: `Validated ${validatedEvidence.length} evidence artifacts; ${flaggedCount} flagged for review or methodology caveats.`,
    durationMs: Date.now() - start,
  };
}
