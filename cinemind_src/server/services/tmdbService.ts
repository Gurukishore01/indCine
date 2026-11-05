import {
  DiscoverFilters,
  Movie,
  ReleasePeriodPreset,
  TmdbCountry,
  TmdbLanguage,
} from '../../src/types/aios';
import { recordTrendingObservations } from './trendObserver';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

export const TMDB_GENRE_MAP: Record<number, string> = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Sci-Fi',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western',
};

const FALLBACK_LANGUAGE_MAP: Record<string, string> = {
  en: 'English',
  ta: 'Tamil',
  te: 'Telugu',
  ml: 'Malayalam',
  kn: 'Kannada',
  hi: 'Hindi',
  bn: 'Bengali',
  mr: 'Marathi',
  pa: 'Punjabi',
  gu: 'Gujarati',
  ko: 'Korean',
  ja: 'Japanese',
  zh: 'Chinese',
  fr: 'French',
  es: 'Spanish',
  de: 'German',
  it: 'Italian',
  ar: 'Arabic',
  pt: 'Portuguese',
  ru: 'Russian',
};

let cachedLanguages: { data: TmdbLanguage[]; expiresAt: number } | null = null;
let cachedCountries: { data: TmdbCountry[]; expiresAt: number } | null = null;
const CONFIG_TTL_MS = 24 * 60 * 60 * 1000;

function resolveLanguageName(code: string): string {
  if (!code) return 'Unknown';
  const lower = code.toLowerCase();
  if (cachedLanguages) {
    const found = cachedLanguages.data.find((l) => l.iso_639_1.toLowerCase() === lower);
    if (found) return found.english_name;
  }
  return FALLBACK_LANGUAGE_MAP[lower] || code.toUpperCase();
}

export function isTmdbConfigured(): boolean {
  const key = process.env.TMDB_API_KEY;
  return Boolean(key && key !== 'MY_TMDB_API_KEY' && key.trim() !== '');
}

export const TMDB_MISSING_KEY_MESSAGE =
  'TMDB_API_KEY is not configured on the server. Add a free non-commercial TMDB API key (from themoviedb.org/settings/api) to your Google AI Studio Secrets panel as TMDB_API_KEY.';

function buildSearchFallbackProviders(title: string): Movie['streamingProviders'] {
  const q = encodeURIComponent(title);
  return [
    {
      provider: 'Netflix',
      type: 'search_fallback',
      quality: 'Catalog Search',
      url: `https://www.netflix.com/search?q=${q}`,
      isVerifiedSearchFallback: true,
    },
    {
      provider: 'Prime Video',
      type: 'search_fallback',
      quality: 'Catalog Search',
      url: `https://www.primevideo.com/search/ref=atv_nb_sr?phrase=${q}`,
      isVerifiedSearchFallback: true,
    },
    {
      provider: 'JioHotstar',
      type: 'search_fallback',
      quality: 'Catalog Search',
      url: `https://www.hotstar.com/in/explore?search_query=${q}`,
      isVerifiedSearchFallback: true,
    },
    {
      provider: 'Apple TV',
      type: 'search_fallback',
      quality: 'Store Search',
      url: `https://tv.apple.com/search?term=${q}`,
      isVerifiedSearchFallback: true,
    },
  ];
}

function mapTmdbSummaryToMovie(item: any, isTrending = false): Movie {
  const displayTitle = item.title || item.original_title || 'Untitled';
  const originalTitle = item.original_title || displayTitle;
  const releaseDate = item.release_date || '';
  const year = releaseDate ? Number(releaseDate.slice(0, 4)) || 0 : 0;
  const genres = Array.isArray(item.genre_ids)
    ? item.genre_ids.map((id: number) => TMDB_GENRE_MAP[id]).filter(Boolean)
    : [];
  const langCode = (item.original_language || 'en').toLowerCase();
  const language = resolveLanguageName(langCode);
  const originCountries: string[] = Array.isArray(item.origin_country)
    ? item.origin_country
    : [];
  const primaryOrigin = originCountries[0] || 'Worldwide';

  return {
    id: String(item.id),
    title: displayTitle,
    originalTitle,
    displayTitle,
    year,
    releaseDate,
    runtimeMinutes: 0,
    certification: item.adult ? 'R' : 'NR',
    genres: genres.length > 0 ? genres : ['Drama'],
    language,
    originalLanguage: langCode,
    metadataLanguage: 'en',
    originCountries,
    releaseRegions: originCountries,
    region: primaryOrigin,
    director: 'See Details',
    writers: [],
    cast: [],
    synopsis: item.overview || 'No synopsis available.',
    moodTags: genres,
    posterUrl: item.poster_path ? `${TMDB_IMAGE_BASE}/w500${item.poster_path}` : null,
    backdropUrl: item.backdrop_path ? `${TMDB_IMAGE_BASE}/w1280${item.backdrop_path}` : null,
    posterPath: item.poster_path || null,
    backdropPath: item.backdrop_path || null,
    posterGradient: 'from-slate-900 via-zinc-900 to-neutral-950',
    posterAccent: '#e11d48',
    ratings:
      typeof item.vote_average === 'number' && item.vote_average > 0
        ? [
            {
              source: 'TMDB',
              score: Number(item.vote_average.toFixed(1)),
              maxScore: 10,
              voteCount: item.vote_count ? `${item.vote_count} votes` : undefined,
            },
          ]
        : [],
    sourcePopularity: typeof item.popularity === 'number' ? item.popularity : 0,
    sourceVoteAverage: typeof item.vote_average === 'number' ? item.vote_average : 0,
    sourceVoteCount: typeof item.vote_count === 'number' ? item.vote_count : 0,
    trendScore: 0,
    isTrending,
    isInTheatres: false,
    streamingProviders: buildSearchFallbackProviders(displayTitle),
    boxOffice: null,
    awards: [],
    reviewSummary: {
      criticConsensus: 'Critic review data unavailable',
      audienceConsensus:
        typeof item.vote_average === 'number' && item.vote_average > 0
          ? `Rated ${item.vote_average.toFixed(1)}/10 by ${item.vote_count || 0} TMDB users.`
          : 'No TMDB user rating consensus available yet.',
      sampleSize: `${item.vote_count || 0} TMDB votes`,
      sourceName: 'TMDB',
      sourceUrl: `https://www.themoviedb.org/movie/${item.id}`,
    },
    dataSource: 'TMDB API v3',
    retrievedAt: new Date().toISOString(),
  };
}

export interface TmdbListResponse {
  configured: boolean;
  movies: Movie[];
  page: number;
  totalPages: number;
  totalResults: number;
  source?: string;
  window?: string;
  retrievedAt?: string;
  error?: string;
}

async function fetchTmdb(endpoint: string): Promise<any> {
  const rawKey = (process.env.TMDB_API_KEY || '').trim().replace(/^["']|["']$/g, '');
  const isBearer = rawKey.startsWith('eyJ');
  const separator = endpoint.includes('?') ? '&' : '?';
  const url = isBearer
    ? `${TMDB_BASE_URL}${endpoint}`
    : `${TMDB_BASE_URL}${endpoint}${separator}api_key=${encodeURIComponent(rawKey)}`;
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (isBearer) {
    headers.Authorization = `Bearer ${rawKey}`;
  }
  const res = await fetch(url, {
    headers,
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`TMDB API error (${res.status}): ${text.slice(0, 200)}`);
  }
  return res.json();
}

export async function getTmdbLanguages(): Promise<TmdbLanguage[]> {
  if (!isTmdbConfigured()) return [];
  if (cachedLanguages && Date.now() < cachedLanguages.expiresAt) {
    return cachedLanguages.data;
  }
  const data = await fetchTmdb('/configuration/languages');
  const list: TmdbLanguage[] = Array.isArray(data)
    ? data
        .filter((l: any) => l.iso_639_1 && l.english_name)
        .sort((a: TmdbLanguage, b: TmdbLanguage) =>
          a.english_name.localeCompare(b.english_name)
        )
    : [];
  cachedLanguages = { data: list, expiresAt: Date.now() + CONFIG_TTL_MS };
  return list;
}

export async function getTmdbCountries(): Promise<TmdbCountry[]> {
  if (!isTmdbConfigured()) return [];
  if (cachedCountries && Date.now() < cachedCountries.expiresAt) {
    return cachedCountries.data;
  }
  const data = await fetchTmdb('/configuration/countries');
  const list: TmdbCountry[] = Array.isArray(data)
    ? data
        .filter((c: any) => c.iso_3166_1 && c.english_name)
        .sort((a: TmdbCountry, b: TmdbCountry) =>
          a.english_name.localeCompare(b.english_name)
        )
    : [];
  cachedCountries = { data: list, expiresAt: Date.now() + CONFIG_TTL_MS };
  return list;
}

export async function getTrendingDayMovies(page = 1): Promise<TmdbListResponse> {
  if (!isTmdbConfigured()) {
    return {
      configured: false,
      movies: [],
      page: 1,
      totalPages: 0,
      totalResults: 0,
      error: TMDB_MISSING_KEY_MESSAGE,
    };
  }
  const data = await fetchTmdb(`/trending/movie/day?page=${page}`);
  const movies = (data.results || []).map((m: any) => mapTmdbSummaryToMovie(m, true));
  if (page === 1 && movies.length > 0) {
    recordTrendingObservations(movies, 'day');
  }
  return {
    configured: true,
    movies,
    page: data.page || page,
    totalPages: Math.min(data.total_pages || 1, 500),
    totalResults: data.total_results || 0,
    source: 'TMDB Trending — Daily',
    window: 'day',
    retrievedAt: new Date().toISOString(),
  };
}

export async function getTrendingMovies(page = 1): Promise<TmdbListResponse> {
  if (!isTmdbConfigured()) {
    return {
      configured: false,
      movies: [],
      page: 1,
      totalPages: 0,
      totalResults: 0,
      error: TMDB_MISSING_KEY_MESSAGE,
    };
  }
  const data = await fetchTmdb(`/trending/movie/week?page=${page}`);
  const movies = (data.results || []).map((m: any) => mapTmdbSummaryToMovie(m, true));
  if (page === 1 && movies.length > 0) {
    recordTrendingObservations(movies, 'week');
  }
  return {
    configured: true,
    movies,
    page: data.page || page,
    totalPages: Math.min(data.total_pages || 1, 500),
    totalResults: data.total_results || 0,
    source: 'TMDB Trending — Weekly',
    window: 'week',
    retrievedAt: new Date().toISOString(),
  };
}

export async function getPopularMovies(page = 1): Promise<TmdbListResponse> {
  if (!isTmdbConfigured()) {
    return {
      configured: false,
      movies: [],
      page: 1,
      totalPages: 0,
      totalResults: 0,
      error: TMDB_MISSING_KEY_MESSAGE,
    };
  }
  const data = await fetchTmdb(`/movie/popular?page=${page}`);
  return {
    configured: true,
    movies: (data.results || []).map((m: any) => mapTmdbSummaryToMovie(m, false)),
    page: data.page || page,
    totalPages: Math.min(data.total_pages || 1, 500),
    totalResults: data.total_results || 0,
    source: 'TMDB Popular',
    retrievedAt: new Date().toISOString(),
  };
}

export async function getUpcomingMovies(page = 1): Promise<TmdbListResponse> {
  if (!isTmdbConfigured()) {
    return {
      configured: false,
      movies: [],
      page: 1,
      totalPages: 0,
      totalResults: 0,
      error: TMDB_MISSING_KEY_MESSAGE,
    };
  }
  const data = await fetchTmdb(`/movie/upcoming?page=${page}`);
  return {
    configured: true,
    movies: (data.results || []).map((m: any) => mapTmdbSummaryToMovie(m, false)),
    page: data.page || page,
    totalPages: Math.min(data.total_pages || 1, 500),
    totalResults: data.total_results || 0,
    source: 'TMDB Upcoming',
    retrievedAt: new Date().toISOString(),
  };
}

function computeDateRange(
  releasePeriod?: ReleasePeriodPreset,
  specificYear?: number,
  customGte?: string,
  customLte?: string
): { gte?: string; lte?: string } {
  const now = new Date();
  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  if (customGte || customLte) {
    return { gte: customGte, lte: customLte };
  }
  if (!releasePeriod || releasePeriod === 'any') {
    return {};
  }
  if (releasePeriod === 'today') {
    const today = fmt(now);
    return { gte: today, lte: today };
  }
  if (releasePeriod === 'this_week') {
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return { gte: fmt(weekAgo), lte: fmt(now) };
  }
  if (releasePeriod === 'this_month') {
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return { gte: fmt(monthAgo), lte: fmt(now) };
  }
  if (releasePeriod === 'this_year') {
    const year = now.getUTCFullYear();
    return { gte: `${year}-01-01`, lte: fmt(now) };
  }
  if (releasePeriod === 'specific_year' && specificYear) {
    return { gte: `${specificYear}-01-01`, lte: `${specificYear}-12-31` };
  }
  if (releasePeriod === 'classics') {
    return { lte: '2005-12-31' };
  }
  return {};
}

export async function discoverMovies(filters: DiscoverFilters): Promise<TmdbListResponse> {
  if (!isTmdbConfigured()) {
    return {
      configured: false,
      movies: [],
      page: 1,
      totalPages: 0,
      totalResults: 0,
      error: TMDB_MISSING_KEY_MESSAGE,
    };
  }

  const page = Math.max(1, filters.page || 1);

  // If a free-text title query is provided without structured-only filters, use /search/movie
  if (filters.query && filters.query.trim()) {
    const params = new URLSearchParams({
      query: filters.query.trim(),
      page: String(page),
      include_adult: 'false',
    });
    if (filters.region) params.set('region', filters.region);
    if (filters.specificYear) params.set('year', String(filters.specificYear));

    const data = await fetchTmdb(`/search/movie?${params.toString()}`);
    let movies: Movie[] = (data.results || []).map((m: any) =>
      mapTmdbSummaryToMovie(m, false)
    );

    // Strictly enforce originalLanguage if specified — never broaden!
    if (filters.originalLanguage) {
      const targetLang = filters.originalLanguage.toLowerCase();
      movies = movies.filter((m) => m.originalLanguage === targetLang);
    }

    return {
      configured: true,
      movies,
      page: data.page || page,
      totalPages: Math.min(data.total_pages || 1, 500),
      totalResults: data.total_results || 0,
      source: 'TMDB Search',
      retrievedAt: new Date().toISOString(),
    };
  }

  // Structured discovery via /discover/movie
  const params = new URLSearchParams({
    page: String(page),
    include_adult: 'false',
    sort_by: filters.sortBy || 'popularity.desc',
  });

  if (filters.originalLanguage) {
    params.set('with_original_language', filters.originalLanguage.toLowerCase());
  }
  if (filters.region) {
    params.set('region', filters.region.toUpperCase());
  }
  if (filters.genreIds && filters.genreIds.length > 0) {
    params.set('with_genres', filters.genreIds.join(','));
  }
  if (filters.maxRuntimeMinutes && filters.maxRuntimeMinutes > 0) {
    params.set('with_runtime.lte', String(filters.maxRuntimeMinutes));
  }
  if (filters.minVoteCount && filters.minVoteCount > 0) {
    params.set('vote_count.gte', String(filters.minVoteCount));
  }

  const { gte, lte } = computeDateRange(
    filters.releasePeriod,
    filters.specificYear,
    filters.releaseDateGte,
    filters.releaseDateLte
  );
  if (gte) params.set('primary_release_date.gte', gte);
  if (lte) params.set('primary_release_date.lte', lte);

  const data = await fetchTmdb(`/discover/movie?${params.toString()}`);
  return {
    configured: true,
    movies: (data.results || []).map((m: any) => mapTmdbSummaryToMovie(m, false)),
    page: data.page || page,
    totalPages: Math.min(data.total_pages || 1, 500),
    totalResults: data.total_results || 0,
    source: 'TMDB Discover',
    retrievedAt: new Date().toISOString(),
  };
}

export async function getSimilarMovies(id: string, page = 1): Promise<TmdbListResponse> {
  if (!isTmdbConfigured()) {
    return {
      configured: false,
      movies: [],
      page: 1,
      totalPages: 0,
      totalResults: 0,
      error: TMDB_MISSING_KEY_MESSAGE,
    };
  }
  const data = await fetchTmdb(`/movie/${encodeURIComponent(id)}/similar?page=${page}`);
  return {
    configured: true,
    movies: (data.results || []).map((m: any) => mapTmdbSummaryToMovie(m, false)),
    page: data.page || page,
    totalPages: Math.min(data.total_pages || 1, 500),
    totalResults: data.total_results || 0,
    source: 'TMDB Similar Movies',
    retrievedAt: new Date().toISOString(),
  };
}

export async function searchMovies(query: string, page = 1): Promise<TmdbListResponse> {
  return discoverMovies({ query, page });
}

export async function getMovieDetails(id: string): Promise<{
  configured: boolean;
  movie: Movie | null;
  error?: string;
}> {
  if (!isTmdbConfigured()) {
    return {
      configured: false,
      movie: null,
      error: TMDB_MISSING_KEY_MESSAGE,
    };
  }
  const item = await fetchTmdb(`/movie/${encodeURIComponent(id)}?append_to_response=credits`);
  const displayTitle = item.title || item.original_title || 'Untitled';
  const originalTitle = item.original_title || displayTitle;
  const releaseDate = item.release_date || '';
  const year = releaseDate ? Number(releaseDate.slice(0, 4)) || 0 : 0;
  const genres = Array.isArray(item.genres)
    ? item.genres.map((g: { name: string }) => g.name)
    : [];
  const langCode = (item.original_language || 'en').toLowerCase();
  const language = resolveLanguageName(langCode);
  const originCountries: string[] = Array.isArray(item.production_countries)
    ? item.production_countries.map((c: any) => c.iso_3166_1).filter(Boolean)
    : Array.isArray(item.origin_country)
      ? item.origin_country
      : [];
  const primaryOrigin = originCountries[0] || 'Worldwide';

  const crew = item.credits?.crew || [];
  const directorObj = crew.find((c: any) => c.job === 'Director');
  const writers = crew
    .filter((c: any) => c.department === 'Writing')
    .slice(0, 3)
    .map((c: any) => c.name);
  const cast = (item.credits?.cast || []).slice(0, 8).map((c: any) => ({
    name: c.name,
    role: c.character || 'Cast',
  }));

  const budgetVal =
    typeof item.budget === 'number' && item.budget > 0
      ? `$${(item.budget / 1_000_000).toFixed(1)}M`
      : null;
  const revenueVal =
    typeof item.revenue === 'number' && item.revenue > 0
      ? `$${(item.revenue / 1_000_000).toFixed(1)}M`
      : null;

  const movie: Movie = {
    id: String(item.id),
    title: displayTitle,
    originalTitle,
    displayTitle,
    year,
    releaseDate,
    runtimeMinutes: item.runtime || 0,
    certification: item.adult ? 'R' : 'NR',
    genres: genres.length > 0 ? genres : ['Drama'],
    language,
    originalLanguage: langCode,
    metadataLanguage: 'en',
    originCountries,
    releaseRegions: originCountries,
    region: primaryOrigin,
    director: directorObj?.name || 'Unknown',
    writers,
    cast,
    synopsis: item.overview || 'No synopsis available.',
    moodTags: genres,
    posterUrl: item.poster_path ? `${TMDB_IMAGE_BASE}/w500${item.poster_path}` : null,
    backdropUrl: item.backdrop_path ? `${TMDB_IMAGE_BASE}/w1280${item.backdrop_path}` : null,
    posterPath: item.poster_path || null,
    backdropPath: item.backdrop_path || null,
    posterGradient: 'from-slate-900 via-zinc-900 to-neutral-950',
    posterAccent: '#e11d48',
    ratings:
      typeof item.vote_average === 'number' && item.vote_average > 0
        ? [
            {
              source: 'TMDB',
              score: Number(item.vote_average.toFixed(1)),
              maxScore: 10,
              voteCount: item.vote_count ? `${item.vote_count} votes` : undefined,
            },
          ]
        : [],
    sourcePopularity: typeof item.popularity === 'number' ? item.popularity : 0,
    sourceVoteAverage: typeof item.vote_average === 'number' ? item.vote_average : 0,
    sourceVoteCount: typeof item.vote_count === 'number' ? item.vote_count : 0,
    trendScore: 0,
    isTrending: false,
    isInTheatres: false,
    streamingProviders: [],
    boxOffice:
      budgetVal || revenueVal
        ? {
            budget: budgetVal,
            worldwideGross: revenueVal,
            domesticGross: null,
            currency: 'USD',
            status: 'Insufficient reliable data',
            sourceName: 'TMDB API v3',
            sourceUrl: `https://www.themoviedb.org/movie/${item.id}`,
            methodologyNote:
              'Reported by TMDB; gross revenue does not represent net studio profit.',
          }
        : null,
    awards: [],
    reviewSummary: {
      criticConsensus: 'Critic review data unavailable',
      audienceConsensus:
        typeof item.vote_average === 'number' && item.vote_average > 0
          ? `Rated ${item.vote_average.toFixed(1)}/10 by ${item.vote_count || 0} TMDB users.`
          : 'No TMDB user rating consensus available yet.',
      sampleSize: `${item.vote_count || 0} TMDB votes`,
      sourceName: 'TMDB',
      sourceUrl: `https://www.themoviedb.org/movie/${item.id}`,
    },
    dataSource: 'TMDB API v3',
    retrievedAt: new Date().toISOString(),
  };

  return { configured: true, movie };
}

const availabilityCache = new Map<
  string,
  { data: import('../../src/types/aios').MovieAvailabilityResponse; expiresAt: number }
>();
const AVAILABILITY_TTL_MS = 15 * 60 * 1000;

function buildProviderFallbackUrl(providerName: string, title: string): string {
  const q = encodeURIComponent(title);
  const lower = providerName.toLowerCase();
  if (lower.includes('netflix')) return `https://www.netflix.com/search?q=${q}`;
  if (lower.includes('prime') || lower.includes('amazon')) {
    return `https://www.primevideo.com/search/ref=atv_nb_sr?phrase=${q}`;
  }
  if (lower.includes('hotstar') || lower.includes('jio')) {
    return `https://www.hotstar.com/in/explore?search_query=${q}`;
  }
  if (lower.includes('apple')) return `https://tv.apple.com/search?term=${q}`;
  if (lower.includes('zee5')) return `https://www.zee5.com/search?q=${q}`;
  if (lower.includes('sonyliv') || lower.includes('sony')) {
    return `https://www.sonyliv.com/search?searchTerm=${q}`;
  }
  if (lower.includes('youtube')) {
    return `https://www.youtube.com/results?search_query=${q}+movie`;
  }
  if (lower.includes('google play')) {
    return `https://play.google.com/store/search?q=${q}&c=movies`;
  }
  return `https://www.google.com/search?q=${encodeURIComponent(`${title} ${providerName}`)}`;
}

export async function getMovieWatchProviders(
  id: string,
  region = 'IN'
): Promise<import('../../src/types/aios').MovieAvailabilityResponse> {
  const cleanRegion = (region || 'IN').toUpperCase();
  const retrievedAt = new Date().toISOString();

  if (!isTmdbConfigured()) {
    return {
      configured: false,
      movieId: id,
      title: 'Unknown',
      region: cleanRegion,
      status: 'AVAILABILITY_UNKNOWN',
      tmdbWatchLink: null,
      flatrate: [],
      free: [],
      ads: [],
      rent: [],
      buy: [],
      cinemaVerified: false,
      cinemaNote: 'TMDB_API_KEY is not configured.',
      attribution: 'Watch provider data powered by JustWatch via TMDB API v3.',
      retrievedAt,
      error: TMDB_MISSING_KEY_MESSAGE,
    };
  }

  const cacheKey = `${id}:${cleanRegion}`;
  const cached = availabilityCache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.data;
  }

  const [details, providersRes, releaseDatesRes] = await Promise.all([
    fetchTmdb(`/movie/${encodeURIComponent(id)}`),
    fetchTmdb(`/movie/${encodeURIComponent(id)}/watch/providers`),
    fetchTmdb(`/movie/${encodeURIComponent(id)}/release_dates`).catch(() => null),
  ]);

  const title = details.title || details.original_title || 'Untitled';

  // Validate watch/providers response structure; never turn malformed responses into NO_OTT_LISTING
  if (
    !providersRes ||
    typeof providersRes !== 'object' ||
    !providersRes.results ||
    typeof providersRes.results !== 'object' ||
    Array.isArray(providersRes.results)
  ) {
    return {
      configured: true,
      movieId: String(details.id || id),
      title,
      region: cleanRegion,
      status: 'AVAILABILITY_UNKNOWN',
      tmdbWatchLink: null,
      flatrate: [],
      free: [],
      ads: [],
      rent: [],
      buy: [],
      cinemaVerified: false,
      cinemaNote:
        'Upstream watch-provider response was incomplete or malformed. Availability could not be verified.',
      attribution: 'Watch provider data powered by JustWatch via TMDB API v3.',
      retrievedAt,
      error: 'Incomplete or malformed watch-provider response from TMDB.',
    };
  }

  // Check territory-specific THEATRICAL release dates (TMDB type 2 = Theatrical limited, 3 = Theatrical)
  const regionalEntry = Array.isArray(releaseDatesRes?.results)
    ? releaseDatesRes.results.find((r: any) => r.iso_3166_1 === cleanRegion)
    : null;
  const regionalTheatricalDates: number[] = Array.isArray(regionalEntry?.release_dates)
    ? regionalEntry.release_dates
        .filter((d: any) => d.type === 2 || d.type === 3)
        .map((d: any) => (d.release_date ? new Date(d.release_date).getTime() : NaN))
        .filter((t: number) => !Number.isNaN(t))
    : [];
  const earliestRegionalTheatrical =
    regionalTheatricalDates.length > 0 ? Math.min(...regionalTheatricalDates) : null;
  const isUpcomingInRegion =
    earliestRegionalTheatrical !== null && earliestRegionalTheatrical > Date.now();

  const regionData = providersRes?.results?.[cleanRegion] || null;
  const tmdbWatchLink: string | null = regionData?.link || null;

  const normalizeList = (
    list: any[] | undefined,
    category: import('../../src/types/aios').NormalizedWatchProvider['category'],
    categoryLabel: string
  ): import('../../src/types/aios').NormalizedWatchProvider[] => {
    if (!Array.isArray(list)) return [];
    const seenIds = new Set<number>();
    const normalized: import('../../src/types/aios').NormalizedWatchProvider[] = [];

    for (const p of list) {
      const providerId = Number(p.provider_id);
      if (seenIds.has(providerId)) continue;
      seenIds.add(providerId);

      const providerName = p.provider_name || 'Unknown Provider';
      const destinationUrl =
        tmdbWatchLink || buildProviderFallbackUrl(providerName, title);
      const destinationType = tmdbWatchLink
        ? 'tmdb_watch_link'
        : 'provider_search_fallback';
      const actionLabel = tmdbWatchLink
        ? 'View availability on TMDB'
        : `Search on ${providerName}`;

      normalized.push({
        providerId,
        providerName,
        logoUrl: p.logo_path ? `${TMDB_IMAGE_BASE}/original${p.logo_path}` : null,
        category,
        categoryLabel,
        destinationUrl,
        destinationType,
        actionLabel,
      });
    }
    return normalized;
  };

  const flatrate = normalizeList(
    regionData?.flatrate,
    'flatrate',
    'Subscription Streaming'
  );
  const free = normalizeList(regionData?.free, 'free', 'Free Streaming');
  const ads = normalizeList(regionData?.ads, 'ads', 'Ad-Supported Streaming');
  const rent = normalizeList(regionData?.rent, 'rent', 'Rent');
  const buy = normalizeList(regionData?.buy, 'buy', 'Buy');

  const totalProviders =
    flatrate.length + free.length + ads.length + rent.length + buy.length;

  let status: import('../../src/types/aios').AvailabilityStatus = 'NO_OTT_LISTING';
  if (totalProviders > 0) {
    status = 'OTT_AVAILABLE';
  } else if (isUpcomingInRegion) {
    status = 'UPCOMING_RELEASE';
  }

  const result: import('../../src/types/aios').MovieAvailabilityResponse = {
    configured: true,
    movieId: String(details.id || id),
    title,
    region: cleanRegion,
    status,
    tmdbWatchLink,
    flatrate,
    free,
    ads,
    rent,
    buy,
    cinemaVerified: false,
    cinemaNote:
      'No verified live cinema showtime API connected. Use external ticket-booking search below to check local listings.',
    attribution: 'Watch provider data powered by JustWatch via TMDB API v3.',
    retrievedAt,
  };

  availabilityCache.set(cacheKey, {
    data: result,
    expiresAt: Date.now() + AVAILABILITY_TTL_MS,
  });

  return result;
}
