import { AgentRegistryEntry } from '../../src/types/aios';

export const AGENT_REGISTRY: AgentRegistryEntry[] = [
  {
    id: 'IndianMovieDiscoveryAgent',
    name: 'Indian Movie Discovery Agent',
    responsibility:
      'Discovers and queries Indian films across Tamil, Telugu, Malayalam, Kannada, Hindi, Bengali, Marathi, and Punjabi industries with strict language boundary enforcement.',
    phaseStatus: 'implemented',
    usesGemini: false,
    category: 'discovery',
  },
  {
    id: 'OTTCatalogIntelligenceAgent',
    name: 'OTT Catalog Intelligence Agent',
    responsibility:
      'Resolves and verifies streaming provider availability in India (Netflix, Prime Video, JioHotstar, ZEE5, SonyLIV, Aha, Sun NXT) backed by JustWatch attribution.',
    phaseStatus: 'implemented',
    usesGemini: false,
    category: 'intelligence',
  },
  {
    id: 'TrendIntelligenceAgent',
    name: 'Trend Intelligence Agent',
    responsibility:
      'Tracks multi-snapshot popularity movement, prevents false trend claims, and enforces the rule requiring at least two comparable observations before declaring Rising/Falling.',
    phaseStatus: 'implemented',
    usesGemini: false,
    category: 'intelligence',
  },
  {
    id: 'AudienceCriticSentimentAgent',
    name: 'Audience & Critic Sentiment Agent',
    responsibility:
      'Separates audience praise/complaints from critical review consensus; synthesizes review themes with cited sample sizes.',
    phaseStatus: 'implemented',
    usesGemini: true,
    category: 'intelligence',
  },
  {
    id: 'BoxOfficeIntelligenceAgent',
    name: 'Box Office Intelligence Agent',
    responsibility:
      'Audits reported theatrical financial performance, distinguishing India Net, India Gross, Overseas Gross, and Worldwide collections without inferring profit from gross alone.',
    phaseStatus: 'implemented',
    usesGemini: false,
    category: 'intelligence',
  },
  {
    id: 'RootCauseAnalysisAgent',
    name: 'Root Cause Analysis Agent',
    responsibility:
      'Diagnoses theatrical and streaming performance factors (word of mouth, competition, ticket pricing, star draw, runtime) and clearly labels hypotheses vs facts.',
    phaseStatus: 'implemented',
    usesGemini: true,
    category: 'intelligence',
  },
  {
    id: 'PlatformIntelligenceAgent',
    name: 'Platform Intelligence Agent',
    responsibility:
      'Analyzes Indian OTT catalogue distribution by language, genre, and new releases without fabricating private streaming watch-hours or subscriber figures.',
    phaseStatus: 'implemented',
    usesGemini: false,
    category: 'intelligence',
  },
  {
    id: 'MovieResearchAgent',
    name: 'Movie Research Agent',
    responsibility:
      'Performs cross-industry film comparisons, director filmography evaluations, and deep title investigations.',
    phaseStatus: 'implemented',
    usesGemini: true,
    category: 'discovery',
  },
  {
    id: 'EvidenceValidationAgent',
    name: 'Evidence Validation Agent',
    responsibility:
      'Validates source credibility, tags data freshness, flags source disagreement, and blocks unsupported quantitative assertions.',
    phaseStatus: 'implemented',
    usesGemini: false,
    category: 'validation',
  },
  {
    id: 'ReportGenerationAgent',
    name: 'Report Generation Agent',
    responsibility:
      'Synthesizes structured cinema intelligence briefings, weekly executive digests, and ecosystem summaries with transparent audit trails.',
    phaseStatus: 'implemented',
    usesGemini: true,
    category: 'reporting',
  },
];
