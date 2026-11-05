export type RouteId =
  | 'pulse'
  | 'explorer'
  | 'intelligence'
  | 'ott'
  | 'signals'
  | 'trends'
  | 'boxoffice'
  | 'analyst'
  | 'reports'
  | 'chat';

export interface SourcedRating {
  source: 'TMDB' | 'IMDb' | 'Audience Sample' | 'Critical Review Consensus' | 'Platform Proxy';
  score: number;
  maxScore: number;
  voteCount?: string;
  notes?: string;
}

export interface VerifiedOttProvider {
  providerId: number;
  providerName: string;
  category: 'flatrate' | 'rent' | 'buy' | 'free';
  displayPriority: number;
  logoPath?: string | null;
  region: string;
  verified: boolean;
  attribution: string;
  link?: string | null;
}

export interface BoxOfficeMetrics {
  indiaNetCrore: number | null;
  indiaGrossCrore: number | null;
  overseasGrossCrore: number | null;
  worldwideGrossCrore: number | null;
  budgetCrore: number | null;
  distributorShareCrore?: number | null;
  openingWeekendCrore?: number | null;
  reportedStatus:
    | 'All Time Blockbuster'
    | 'Blockbuster'
    | 'Super Hit'
    | 'Hit'
    | 'Average / Break-even'
    | 'Underperformed'
    | 'Commercial Underperformer'
    | 'Awaiting Data';
  sourceName: string;
  publicationDate?: string;
  methodologyNote: string;
  confidence: 'high' | 'moderate' | 'preliminary' | 'unverified';
  sourceDisagreement?: string;
}

export interface ReceptionAnalysis {
  criticConsensus: string;
  criticScore?: number | null;
  criticCount?: number;
  audienceConsensus: string;
  audienceScore?: number | null;
  audienceSampleNote: string;
  praiseThemes: string[];
  criticismThemes: string[];
  sourceName: string;
  sourceUrl?: string;
}

export interface Movie {
  id: string;
  title: string;
  originalTitle?: string;
  displayTitle?: string;
  year: number;
  releaseDate: string;
  runtimeMinutes: number;
  certification: string;
  genres: string[];
  language: string;
  originalLanguage: string; // ta, te, ml, kn, hi, bn, mr, pa, gu, etc.
  industry?: 'Kollywood' | 'Tollywood' | 'Mollywood' | 'Sandalwood' | 'Bollywood' | 'Bengali' | 'Marathi' | 'Punjabi' | 'Other';
  originCountries: string[];
  region: string;
  director: string;
  writers: string[];
  cast: { name: string; role: string }[];
  synopsis: string;
  moodTags: string[];
  posterUrl: string | null;
  backdropUrl: string | null;
  ratings: SourcedRating[];
  sourcePopularity?: number | null;
  sourceVoteAverage?: number;
  sourceVoteCount?: number;
  trendScore: number;
  isTrending: boolean;
  isInTheatres: boolean;
  verifiedOttProviders: VerifiedOttProvider[];
  boxOffice: BoxOfficeMetrics | null;
  reception: ReceptionAnalysis;
  evidenceConfidence: 'High' | 'Moderate' | 'Limited' | 'Pending verification';
  dataSource: string;
  provenance: 'live_tmdb' | 'curated_benchmark';
  retrievedAt: string;
}

export interface EvidenceItem {
  sourceName: string;
  sourceUrl: string;
  publishedAt: string | null;
  retrievedAt: string;
  territory: string;
  metric: string;
  value: string;
  methodologyNote: string;
  confidence: 'high' | 'moderate' | 'low';
}

export interface AgentExecutionLogEntry {
  id: string;
  step: number;
  agent: string;
  action: string;
  status: 'completed' | 'partial' | 'failed' | 'skipped';
  durationMs: number;
  timestamp: string;
  summary: string;
  evidenceProduced?: number;
  warnings?: string[];
}

export interface AgentRegistryEntry {
  id: string;
  name: string;
  responsibility: string;
  phaseStatus: 'implemented' | 'testing' | 'planned' | 'degraded' | 'unavailable' | 'active';
  usesGemini: boolean;
  category: 'discovery' | 'intelligence' | 'validation' | 'reporting';
}

export interface TrendObservation {
  id: string;
  movieId: string;
  title: string;
  originalLanguage: string;
  provider: string;
  observedAt: string;
  metricName: string;
  metricValue: number | null;
  rank: number | null;
  region: string;
  window: 'day' | 'week';
  sourceReference: string;
}

export interface TrendMovementItem {
  movieId: string;
  title: string;
  originalLanguage: string;
  status: 'Rising' | 'Falling' | 'Stable' | 'New entry' | 'Insufficient history';
  window: 'day' | 'week';
  currentRank: number | null;
  previousRank: number | null;
  rankDelta: number | null;
  currentValue: number;
  previousValue: number | null;
  percentageChange: number | null;
  observationCount: number;
  lastObservedAt: string;
  source: string;
}

export interface OrchestratorPlanStep {
  agentId: string;
  agentName: string;
  purpose: string;
  status: 'pending' | 'running' | 'completed' | 'skipped';
}

export interface OrchestratorResponse {
  requestId: string;
  query: string;
  intent: string;
  plan: string[];
  executionLog: AgentExecutionLogEntry[];
  movies?: Movie[];
  answer: string;
  evidence: EvidenceItem[];
  warnings: string[];
  confidence: 'High' | 'Moderate' | 'Low';
  retrievedAt: string;
  usedGemini: boolean;
  limitations?: string[];
}

export interface IntelligencePulseData {
  trackedMoviesCount: number;
  risingSignalsCount: number;
  ottPlatformsMonitored: number;
  evidenceCoverage: {
    verifiedCatalogCount: number;
    rightsVerifiedTitles: number;
    provenanceMode: 'live_tmdb' | 'curated_benchmark';
    methodologyNote: string;
  };
  lastRefreshedAt: string;
  sourceStatus: {
    tmdbConnected: boolean;
    geminiConnected: boolean;
    tmdbHealth?: {
      configured: boolean;
      state: 'successful' | 'rate-limited' | 'failed' | 'unavailable' | 'not-configured';
      lastSuccessfulRetrieval: string | null;
      lastAttemptAt: string | null;
      lastErrorMessage: string | null;
    };
    geminiHealth?: {
      configured: boolean;
      state: 'successful' | 'rate-limited' | 'failed' | 'unavailable' | 'not-configured';
      lastSuccessfulRetrieval: string | null;
      lastAttemptAt: string | null;
    };
    observationsLogged: number;
    mode: 'live_tmdb' | 'curated_benchmark';
  };
  topMovements: TrendMovementItem[];
  platformDistribution: {
    name: string;
    code: string;
    color: string;
    verifiedTitlesCount: number;
    pctOfTracked: number;
    status: string;
  }[];
  spotlightMovies: Movie[];
  recentActivity: {
    type: 'policy' | 'data' | 'source' | 'alert';
    title: string;
    description: string;
    timestamp: string;
    severity?: 'normal' | 'warn' | 'success';
  }[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  evidence?: {
    movieTitle?: string;
    source: string;
    metric?: string;
    verifiedAt: string;
  };
  movieId?: string;
}

export interface ChatQueryRequest {
  query: string;
  history?: Array<{ sender: 'user' | 'assistant'; text: string }>;
}

export interface ChatQueryResponse {
  answer: string;
  evidence?: {
    movieTitle?: string;
    source: string;
    metric?: string;
    verifiedAt: string;
  };
  movieId?: string;
  relatedMovie?: Movie;
}
