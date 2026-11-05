import { AgentRegistryEntry } from '../../src/types/aios';

export const AGENT_REGISTRY: AgentRegistryEntry[] = [
  {
    id: 'IntentPlanningAgent',
    name: 'Intent & Planning Agent',
    responsibility:
      'Parses natural-language requests into structured intent, original-language codes, genre IDs, release periods, and runtime constraints.',
    phaseStatus: 'active',
    usesGemini: true,
  },
  {
    id: 'MovieDiscoveryAgent',
    name: 'Movie Discovery Agent',
    responsibility:
      'Executes strict TMDB /discover/movie, /search/movie, /trending, and /similar queries without broadening explicit language constraints.',
    phaseStatus: 'active',
    usesGemini: false,
  },
  {
    id: 'RecommendationAgent',
    name: 'Recommendation Agent',
    responsibility:
      'Ranks candidates using explicit weighted scoring (language, runtime, genre, ratings, popularity) and explains fit.',
    phaseStatus: 'active',
    usesGemini: false,
  },
  {
    id: 'ReviewSentimentAgent',
    name: 'Review & Sentiment Agent',
    responsibility:
      'Synthesizes sourced TMDB audience/critic consensus with sample sizes and citations.',
    phaseStatus: 'active',
    usesGemini: true,
  },
  {
    id: 'TrendIntelligenceAgent',
    name: 'Trend Intelligence Agent',
    responsibility:
      'Analyses historical popularity and rank movement across observation windows.',
    phaseStatus: 'planned',
    usesGemini: false,
  },
  {
    id: 'GeneralMovieResearchAgent',
    name: 'General Movie Research Agent',
    responsibility:
      'Coordinates multi-source film research and comparative synthesis.',
    phaseStatus: 'planned',
    usesGemini: true,
  },
  {
    id: 'EvidenceValidationAgent',
    name: 'Evidence Validation Agent',
    responsibility:
      'Validates source quality, freshness, conflicts, and unsupported claims.',
    phaseStatus: 'planned',
    usesGemini: false,
  },
  {
    id: 'AwardsIntelligenceAgent',
    name: 'Awards Intelligence Agent',
    responsibility:
      'Verifies festival selections, nominees, and winners from official award bodies.',
    phaseStatus: 'planned',
    usesGemini: false,
  },
  {
    id: 'BoxOfficeAnalysisAgent',
    name: 'Box Office Analysis Agent',
    responsibility:
      'Evaluates sourced budget, gross, and commercial performance.',
    phaseStatus: 'planned',
    usesGemini: false,
  },
  {
    id: 'UpcomingDemandAgent',
    name: 'Upcoming Demand Agent',
    responsibility:
      'Analyses measurable pre-release anticipation signals.',
    phaseStatus: 'planned',
    usesGemini: false,
  },
  {
    id: 'OTTAvailabilityAgent',
    name: 'OTT Availability Agent',
    responsibility:
      'Resolves country-specific streaming providers and JustWatch-attributed links.',
    phaseStatus: 'planned',
    usesGemini: false,
  },
  {
    id: 'CinemaDiscoveryAgent',
    name: 'Cinema Discovery Agent',
    responsibility:
      'Finds cinemas and verified booking destinations for a user-selected location.',
    phaseStatus: 'planned',
    usesGemini: false,
  },
];
