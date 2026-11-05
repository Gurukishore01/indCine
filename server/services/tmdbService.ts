import {
  Movie,
  SourcedRating,
  VerifiedOttProvider,
} from '../../src/types/aios';
import { VERIFIED_INDIAN_MOVIES } from './indianCinemaData';
import { recordMovieObservations } from './observationStore';

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

export const INDIAN_LANGUAGE_MAP: Record<string, { name: string; industry: Movie['industry'] }> = {
  ta: { name: 'Tamil', industry: 'Kollywood' },
  te: { name: 'Telugu', industry: 'Tollywood' },
  ml: { name: 'Malayalam', industry: 'Mollywood' },
  kn: { name: 'Kannada', industry: 'Sandalwood' },
  hi: { name: 'Hindi', industry: 'Bollywood' },
  bn: { name: 'Bengali', industry: 'Bengali' },
  mr: { name: 'Marathi', industry: 'Marathi' },
  pa: { name: 'Punjabi', industry: 'Punjabi' },
  gu: { name: 'Gujarati', industry: 'Other' },
  en: { name: 'English', industry: 'Other' },
};

export interface TmdbHealthState {
  configured: boolean;
  state: 'successful' | 'rate-limited' | 'failed' | 'unavailable' | 'not-configured';
  lastSuccessfulRetrieval: string | null;
  lastAttemptAt: string | null;
  lastErrorMessage: string | null;
}

const tmdbHealth: TmdbHealthState = {
  configured: false,
  state: 'not-configured',
  lastSuccessfulRetrieval: null,
  lastAttemptAt: null,
  lastErrorMessage: null,
};

export function isTmdbConfigured(): boolean {
  const key = process.env.TMDB_API_KEY;
  return Boolean(key && key !== 'MY_TMDB_API_KEY' && key.trim() !== '');
}

export function getTmdbHealthState(): TmdbHealthState {
  const configured = isTmdbConfigured();
  return {
    ...tmdbHealth,
    configured,
    state: !configured ? 'not-configured' : tmdbHealth.state,
  };
}

export function recordTmdbOutcome(success: boolean, status?: number, errorMsg?: string): void {
  tmdbHealth.configured = isTmdbConfigured();
  tmdbHealth.lastAttemptAt = new Date().toISOString();
  if (success) {
    tmdbHealth.state = 'successful';
    tmdbHealth.lastSuccessfulRetrieval = new Date().toISOString();
    tmdbHealth.lastErrorMessage = null;
  } else if (status === 429) {
    tmdbHealth.state = 'rate-limited';
    tmdbHealth.lastErrorMessage = errorMsg || 'HTTP 429: TMDB rate limit encountered';
  } else if (!isTmdbConfigured()) {
    tmdbHealth.state = 'not-configured';
    tmdbHealth.lastErrorMessage = 'TMDB API key not configured on server';
  } else {
    tmdbHealth.state = 'failed';
    tmdbHealth.lastErrorMessage = errorMsg || `TMDB API request failed with status ${status || 'unknown'}`;
  }
}

export function resolveLanguageInfo(code: string): { name: string; industry?: Movie['industry'] } {
  if (!code) return { name: 'Unknown' };
  const lower = code.toLowerCase();
  if (INDIAN_LANGUAGE_MAP[lower]) {
    return INDIAN_LANGUAGE_MAP[lower];
  }
  return { name: code.toUpperCase() };
}

function mapTmdbToMovie(item: any, isTrending = false): Movie {
  const displayTitle = item.title || item.original_title || 'Untitled';
  const originalTitle = item.original_title || displayTitle;
  const releaseDate = item.release_date || '';
  const year = releaseDate ? Number(releaseDate.slice(0, 4)) || 0 : 0;
  const genres = Array.isArray(item.genre_ids)
    ? item.genre_ids.map((id: number) => TMDB_GENRE_MAP[id]).filter(Boolean)
    : [];
  const langCode = (item.original_language || 'hi').toLowerCase();
  const langInfo = resolveLanguageInfo(langCode);

  const ratings: SourcedRating[] = [];
  if (typeof item.vote_average === 'number' && item.vote_average > 0) {
    ratings.push({
      source: 'TMDB',
      score: Number(item.vote_average.toFixed(1)),
      maxScore: 10,
      voteCount: `${item.vote_count?.toLocaleString() || '0'} votes`,
      notes: 'TMDB registered user ratings only. Separate from critic reviews.',
    });
  }

  return {
    id: String(item.id),
    title: displayTitle,
    originalTitle,
    displayTitle,
    year,
    releaseDate,
    runtimeMinutes: item.runtime || 0,
    certification: item.adult ? 'A' : 'UA',
    genres: genres.length > 0 ? genres : ['Drama'],
    language: langInfo.name,
    originalLanguage: langCode,
    industry: langInfo.industry,
    originCountries: Array.isArray(item.origin_country) ? item.origin_country : ['IN'],
    region: 'India',
    director: item.director || 'See Profile Details',
    writers: [],
    cast: [],
    synopsis: item.overview || 'Overview not available in connected repository.',
    moodTags: genres,
    posterUrl: item.poster_path ? `${TMDB_IMAGE_BASE}/w500${item.poster_path}` : null,
    backdropUrl: item.backdrop_path ? `${TMDB_IMAGE_BASE}/w1280${item.backdrop_path}` : null,
    ratings,
    sourcePopularity:
      typeof item.popularity === 'number' && !Number.isNaN(item.popularity)
        ? Number(item.popularity.toFixed(2))
        : null,
    sourceVoteAverage: item.vote_average,
    sourceVoteCount: item.vote_count,
    trendScore: Math.min(100, Math.round((item.popularity || 10) * 1.5)),
    isTrending,
    isInTheatres: false,
    verifiedOttProviders: [],
    boxOffice: null,
    reception: {
      criticConsensus: 'Critic reviews pending dedicated validation for this title.',
      criticScore: null,
      audienceConsensus: item.vote_average
        ? `TMDB community average ${item.vote_average.toFixed(1)}/10 from ${item.vote_count} votes.`
        : 'Awaiting audience volume.',
      audienceScore: item.vote_average ? Math.round(item.vote_average * 10) : null,
      audienceSampleNote: 'Sourced from TMDB verified member ratings.',
      praiseThemes: [],
      criticismThemes: [],
      sourceName: 'TMDB Community Database',
    },
    evidenceConfidence: 'Moderate',
    dataSource: 'TMDB v3 API (Authorised Metadata)',
    provenance: 'live_tmdb',
    retrievedAt: new Date().toISOString(),
  };
}

export async function discoverIndianMovies(params: {
  language?: string;
  genreId?: number;
  year?: number;
  sortBy?: string;
  page?: number;
}): Promise<{ movies: Movie[]; total: number; page: number; totalPages: number }> {
  const page = params.page || 1;

  if (isTmdbConfigured()) {
    try {
      const apiKey = process.env.TMDB_API_KEY!;
      const url = new URL(`${TMDB_BASE_URL}/discover/movie`);
      url.searchParams.set('api_key', apiKey);
      url.searchParams.set('page', String(page));
      url.searchParams.set('region', 'IN');
      url.searchParams.set('include_adult', 'false');

      if (params.language) {
        url.searchParams.set('with_original_language', params.language.toLowerCase());
      } else {
        url.searchParams.set('with_original_language', 'ta|te|ml|kn|hi|bn|mr|pa');
      }

      if (params.genreId) {
        url.searchParams.set('with_genres', String(params.genreId));
      }
      if (params.year) {
        url.searchParams.set('primary_release_year', String(params.year));
      }
      url.searchParams.set('sort_by', params.sortBy || 'popularity.desc');

      const res = await fetch(url.toString());
      if (res.ok) {
        recordTmdbOutcome(true);
        const json = await res.json();
        const movies: Movie[] = (json.results || []).map((m: any) => mapTmdbToMovie(m));
        return {
          movies,
          total: json.total_results || movies.length,
          page: json.page || 1,
          totalPages: Math.min(json.total_pages || 1, 20),
        };
      } else {
        recordTmdbOutcome(false, res.status, res.statusText);
      }
    } catch (err: any) {
      recordTmdbOutcome(false, undefined, err?.message);
      console.error('TMDB Discover error, falling back to verified Indian movies:', err);
    }
  }

  // Filter verified Indian movies baseline
  let filtered = [...VERIFIED_INDIAN_MOVIES];
  if (params.language && params.language !== 'all') {
    filtered = filtered.filter(
      (m) =>
        m.originalLanguage.toLowerCase() === params.language?.toLowerCase() ||
        m.language.toLowerCase() === params.language?.toLowerCase()
    );
  }
  if (params.year) {
    filtered = filtered.filter((m) => m.year === params.year);
  }
  if (params.genreId && TMDB_GENRE_MAP[params.genreId]) {
    const genreName = TMDB_GENRE_MAP[params.genreId];
    filtered = filtered.filter((m) => m.genres.includes(genreName));
  }

  return {
    movies: filtered,
    total: filtered.length,
    page: 1,
    totalPages: 1,
  };
}

export async function searchIndianMovies(
  query: string,
  page = 1
): Promise<{ movies: Movie[]; total: number; page: number }> {
  if (!query.trim()) {
    return discoverIndianMovies({ page });
  }

  if (isTmdbConfigured()) {
    try {
      const apiKey = process.env.TMDB_API_KEY!;
      const url = new URL(`${TMDB_BASE_URL}/search/movie`);
      url.searchParams.set('api_key', apiKey);
      url.searchParams.set('query', query);
      url.searchParams.set('page', String(page));
      url.searchParams.set('region', 'IN');
      url.searchParams.set('include_adult', 'false');

      const res = await fetch(url.toString());
      if (res.ok) {
        recordTmdbOutcome(true);
        const json = await res.json();
        const movies: Movie[] = (json.results || []).map((m: any) => mapTmdbToMovie(m));
        return {
          movies,
          total: json.total_results || movies.length,
          page: json.page || 1,
        };
      } else {
        recordTmdbOutcome(false, res.status, res.statusText);
      }
    } catch (err: any) {
      recordTmdbOutcome(false, undefined, err?.message);
      console.error('TMDB Search error:', err);
    }
  }

  // Search local verified dataset
  const q = query.toLowerCase();
  const matched = VERIFIED_INDIAN_MOVIES.filter(
    (m) =>
      m.title.toLowerCase().includes(q) ||
      m.originalTitle?.toLowerCase().includes(q) ||
      m.director.toLowerCase().includes(q) ||
      m.cast.some((c) => c.name.toLowerCase().includes(q)) ||
      m.language.toLowerCase().includes(q)
  );

  return {
    movies: matched,
    total: matched.length,
    page: 1,
  };
}

export async function getIndianMovieDetails(id: string): Promise<Movie | null> {
  // Check local verified dataset first
  const localMatch = VERIFIED_INDIAN_MOVIES.find((m) => m.id === id);
  if (localMatch) {
    return localMatch;
  }

  if (isTmdbConfigured()) {
    try {
      const apiKey = process.env.TMDB_API_KEY!;
      const url = `${TMDB_BASE_URL}/movie/${id}?api_key=${apiKey}&append_to_response=credits,watch/providers,reviews`;
      const res = await fetch(url);
      if (res.ok) {
        recordTmdbOutcome(true);
        const data = await res.json();
        const movie = mapTmdbToMovie(data);

        // Parse cast & crew
        if (data.credits) {
          movie.director =
            data.credits.crew?.find((c: any) => c.job === 'Director')?.name || movie.director;
          movie.cast = (data.credits.cast || []).slice(0, 6).map((c: any) => ({
            name: c.name,
            role: c.character || 'Cast',
          }));
        }

        // Parse verified JustWatch providers for India
        const providersIn = data['watch/providers']?.results?.IN;
        if (providersIn) {
          const verifiedProviders: VerifiedOttProvider[] = [];
          if (Array.isArray(providersIn.flatrate)) {
            providersIn.flatrate.forEach((p: any) => {
              verifiedProviders.push({
                providerId: p.provider_id,
                providerName: p.provider_name,
                category: 'flatrate',
                displayPriority: p.display_priority,
                logoPath: p.logo_path,
                region: 'IN',
                verified: true,
                attribution: 'Powered by JustWatch via TMDB v3 Watch Providers API',
                link: providersIn.link || null,
              });
            });
          }
          movie.verifiedOttProviders = verifiedProviders;
        }

        // Sourced box office if available from TMDB
        if (data.revenue && data.revenue > 0) {
          const revCrore = Number((data.revenue / 10000000 / 0.12).toFixed(1)); // Approx INR crore conversion
          const budgetCrore = data.budget ? Number((data.budget / 10000000 / 0.12).toFixed(1)) : null;
          movie.boxOffice = {
            indiaNetCrore: null,
            indiaGrossCrore: null,
            overseasGrossCrore: null,
            worldwideGrossCrore: revCrore,
            budgetCrore,
            reportedStatus: revCrore > (budgetCrore || 0) * 2 ? 'Super Hit' : 'Average / Break-even',
            sourceName: 'TMDB Production & Distribution Disclosures',
            methodologyNote: 'Reported production budget and box office gross converted to INR Crores.',
            confidence: 'moderate',
          };
        }

        return movie;
      } else {
        recordTmdbOutcome(false, res.status, res.statusText);
      }
    } catch (err: any) {
      recordTmdbOutcome(false, undefined, err?.message);
      console.error('Error fetching TMDB details for id', id, err);
    }
  }

  return null;
}

export async function getTrendingIndianMovies(
  window: 'day' | 'week' = 'day'
): Promise<{ movies: Movie[]; total: number; mode: 'live_tmdb' | 'curated_benchmark' }> {
  const indianLangCodes = new Set(['ta', 'te', 'ml', 'kn', 'hi', 'bn', 'mr', 'pa', 'gu']);

  if (isTmdbConfigured()) {
    try {
      const apiKey = process.env.TMDB_API_KEY!;
      const url = `${TMDB_BASE_URL}/trending/movie/${window}?api_key=${apiKey}`;
      const res = await fetch(url);
      if (res.ok) {
        recordTmdbOutcome(true);
        const json = await res.json();
        const raw = json.results || [];
        // Filter live trending by Indian original languages
        const indianLive = raw
          .filter((m: any) => indianLangCodes.has((m.original_language || '').toLowerCase()))
          .map((m: any) => mapTmdbToMovie(m, true));

        if (indianLive.length > 0) {
          // Record observations strictly for live TMDB observations
          recordMovieObservations(indianLive, window, 'TMDB API v3 Trending (Filtered by Indian Original Languages)');
          return {
            movies: indianLive,
            total: indianLive.length,
            mode: 'live_tmdb',
          };
        }
      } else {
        recordTmdbOutcome(false, res.status, res.statusText);
      }
    } catch (err: any) {
      recordTmdbOutcome(false, undefined, err?.message);
      console.error('Error fetching TMDB trending:', err);
    }
  }

  // Fallback to verified benchmark only when live TMDB is unavailable, clearly labelled
  return {
    movies: VERIFIED_INDIAN_MOVIES,
    total: VERIFIED_INDIAN_MOVIES.length,
    mode: 'curated_benchmark',
  };
}
