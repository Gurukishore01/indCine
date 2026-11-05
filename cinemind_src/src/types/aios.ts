export type RouteId =
  | 'discover'
  | 'search'
  | 'details'
  | 'where-to-watch'
  | 'in-theatres'
  | 'quick-pick';

export interface SourcedRating {
  source: string;
  score: number;
  maxScore: number;
  voteCount?: string;
}

export interface StreamingProviderOption {
  provider: string;
  type: 'subscription' | 'rent' | 'buy' | 'free' | 'search_fallback';
  quality?: string;
  priceNote?: string;
  url: string;
  isVerifiedSearchFallback: boolean;
}

export interface BoxOfficeRecord {
  budget: string | null;
  worldwideGross: string | null;
  domesticGross: string | null;
  currency: string;
  status:
    | 'Commercial success'
    | 'Likely success (incomplete data)'
    | 'Break-even / mixed performance'
    | 'Underperforming'
    | 'Commercial failure'
    | 'Insufficient reliable data';
  sourceName: string;
  sourceUrl: string;
  methodologyNote: string;
}

export interface AwardRecord {
  body: string;
  year: number;
  category: string;
  status: 'winner' | 'nominee' | 'selection';
  sourceUrl: string;
}

export interface ReviewSummary {
  criticConsensus: string;
  audienceConsensus: string;
  sampleSize: string;
  sourceName: string;
  sourceUrl: string;
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
  originalLanguage?: string;
  metadataLanguage?: string;
  originCountries?: string[];
  releaseRegions?: string[];
  region: string;
  director: string;
  writers: string[];
  cast: { name: string; role: string }[];
  synopsis: string;
  moodTags: string[];
  posterUrl?: string | null;
  backdropUrl?: string | null;
  posterPath?: string | null;
  backdropPath?: string | null;
  posterGradient: string;
  posterAccent: string;
  ratings: SourcedRating[];
  sourcePopularity?: number;
  sourceVoteAverage?: number;
  sourceVoteCount?: number;
  trendScore: number;
  isTrending: boolean;
  isInTheatres: boolean;
  streamingProviders: StreamingProviderOption[];
  boxOffice: BoxOfficeRecord | null;
  awards: AwardRecord[];
  reviewSummary: ReviewSummary;
  dataSource: string;
  retrievedAt: string;
}

export interface TmdbLanguage {
  iso_639_1: string;
  english_name: string;
  name: string;
}

export interface TmdbCountry {
  iso_3166_1: string;
  english_name: string;
  native_name: string;
}

export type ReleasePeriodPreset =
  | 'any'
  | 'today'
  | 'this_week'
  | 'this_month'
  | 'this_year'
  | 'specific_year'
  | 'custom'
  | 'classics';

export interface DiscoverFilters {
  query?: string;
  originalLanguage?: string;
  region?: string;
  genreIds?: number[];
  maxRuntimeMinutes?: number;
  releasePeriod?: ReleasePeriodPreset;
  specificYear?: number;
  releaseDateGte?: string;
  releaseDateLte?: string;
  sortBy?:
    | 'popularity.desc'
    | 'vote_average.desc'
    | 'primary_release_date.desc'
    | 'vote_count.desc';
  minVoteCount?: number;
  page?: number;
}

export type TrendMovementStatus =
  | 'Rising'
  | 'Falling'
  | 'Stable'
  | 'New entry'
  | 'Insufficient history';

export interface TrendObservation {
  movieId: string;
  title: string;
  provider: string;
  observedAt: string;
  metricName: string;
  metricValue: number;
  rank: number | null;
  region: string;
  window: 'day' | 'week';
  sourceReference: string;
}

export interface TrendMovementItem {
  movieId: string;
  title: string;
  status: TrendMovementStatus;
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

export interface EvidenceItem {
  sourceName: string;
  sourceUrl: string;
  publishedAt: string | null;
  retrievedAt: string;
  territory: string;
  metric: string;
  value: string | number | null;
  currency?: string;
  methodologyNote: string;
  confidence: 'high' | 'medium' | 'low';
}

export type AgentStatus =
  | 'idle'
  | 'waiting'
  | 'planning'
  | 'running'
  | 'success'
  | 'completed'
  | 'partial'
  | 'unavailable'
  | 'failed'
  | 'skipped'
  | 'error';

export interface AgentResult<T = unknown> {
  agent: string;
  status: AgentStatus;
  summary: string;
  items: T[];
  evidence: EvidenceItem[];
  warnings: string[];
  retrievedAt: string;
  durationMs: number;
}

export interface AgentExecutionLogEntry {
  id: string;
  step: number;
  agent: string;
  action: string;
  status: AgentStatus;
  durationMs: number;
  timestamp: string;
  summary: string;
  warnings: string[];
}

export interface AgentRegistryEntry {
  id: string;
  name: string;
  responsibility: string;
  phaseStatus: 'active' | 'in_progress' | 'planned' | 'disabled' | 'failed';
  usesGemini: boolean;
}

export type AIOSIntentType =
  | 'mood_recommendation'
  | 'all_time_ranking'
  | 'global_discovery'
  | 'trending_query'
  | 'similar_movies'
  | 'movie_comparison'
  | 'general_research'
  | 'ott_availability'
  | 'cinema_discovery';

export interface MoodConstraints {
  intentType?: AIOSIntentType;
  mood?: string;
  genre?: string;
  genreIds?: number[];
  language?: string;
  originalLanguageCode?: string;
  maxRuntimeMinutes?: number;
  era?: string;
  releasePeriod?: ReleasePeriodPreset;
  specificYear?: number;
  rankBy?: 'vote_average.desc' | 'popularity.desc' | 'vote_count.desc';
  minVoteCount?: number;
  platform?: string;
  freeTextQuery?: string;
  region?: string;
  trendingWindow?: 'day' | 'week';
  similarToTitle?: string;
  compareTitles?: string[];
}

export interface ScoreBreakdown {
  moodGenreFit: number;
  languageRuntimeFit: number;
  ratingQuality: number;
  trendSignal: number;
  criticSentiment: number;
}

export interface RecommendationItem {
  movie: Movie;
  matchScore: number;
  scoreBreakdown: ScoreBreakdown;
  reasons: string[];
  reviewInsight: string;
  availabilityNote: string;
}

export interface OrchestratorResponse {
  requestId: string;
  intent: string;
  constraints: MoodConstraints;
  plan: string[];
  executionLog: AgentExecutionLogEntry[];
  recommendations: RecommendationItem[];
  movies?: Movie[];
  trendObservations?: TrendMovementItem[];
  unavailableCapabilities?: string[];
  answer: string;
  evidence: EvidenceItem[];
  warnings: string[];
  retrievedAt: string;
  usedGemini: boolean;
}

export type AvailabilityStatus =
  | 'OTT_AVAILABLE'
  | 'THEATRICAL_VERIFIED'
  | 'OTT_AND_THEATRICAL'
  | 'NO_OTT_LISTING'
  | 'AVAILABILITY_UNKNOWN'
  | 'UPCOMING_RELEASE';

export interface NormalizedWatchProvider {
  providerId: number;
  providerName: string;
  logoUrl: string | null;
  category: 'flatrate' | 'free' | 'ads' | 'rent' | 'buy';
  categoryLabel: string;
  destinationUrl: string;
  destinationType: 'tmdb_watch_link' | 'provider_search_fallback';
  actionLabel: string;
}

export interface MovieAvailabilityResponse {
  configured: boolean;
  movieId: string;
  title: string;
  region: string;
  status: AvailabilityStatus;
  tmdbWatchLink: string | null;
  flatrate: NormalizedWatchProvider[];
  free: NormalizedWatchProvider[];
  ads: NormalizedWatchProvider[];
  rent: NormalizedWatchProvider[];
  buy: NormalizedWatchProvider[];
  cinemaVerified: boolean;
  cinemaNote: string;
  attribution: string;
  retrievedAt: string;
  error?: string;
}
