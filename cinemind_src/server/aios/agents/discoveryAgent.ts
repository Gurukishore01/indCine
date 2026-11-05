import { AgentResult, EvidenceItem, MoodConstraints, Movie } from '../../../src/types/aios';
import {
  discoverMovies,
  getSimilarMovies,
  getTrendingDayMovies,
  getTrendingMovies,
  isTmdbConfigured,
  searchMovies,
  TMDB_MISSING_KEY_MESSAGE,
} from '../../services/tmdbService';

export async function runMovieDiscoveryAgent(
  constraints: MoodConstraints
): Promise<AgentResult<Movie>> {
  const start = Date.now();
  const retrievedAt = new Date().toISOString();
  const warnings: string[] = [];

  if (!isTmdbConfigured()) {
    return {
      agent: 'MovieDiscoveryAgent',
      status: 'unavailable',
      summary: 'TMDB_API_KEY is not configured on the server.',
      items: [],
      evidence: [],
      warnings: [TMDB_MISSING_KEY_MESSAGE],
      retrievedAt,
      durationMs: Date.now() - start,
    };
  }

  try {
    let candidates: Movie[] = [];
    let sourceLabel = 'TMDB Discover';

    if (constraints.intentType === 'trending_query') {
      const res =
        constraints.trendingWindow === 'day'
          ? await getTrendingDayMovies(1)
          : await getTrendingMovies(1);
      candidates = res.movies;
      sourceLabel = res.source || 'TMDB Trending';
    } else if (
      constraints.intentType === 'similar_movies' &&
      constraints.similarToTitle
    ) {
      const searchRes = await searchMovies(constraints.similarToTitle, 1);
      const seed = searchRes.movies[0];
      if (seed) {
        const simRes = await getSimilarMovies(seed.id, 1);
        candidates = simRes.movies;
        sourceLabel = `TMDB Similar to ${seed.title}`;
      } else {
        warnings.push(
          `Could not find seed movie "${constraints.similarToTitle}" on TMDB.`
        );
      }
    } else if (constraints.intentType === 'all_time_ranking') {
      const minVotes = constraints.minVoteCount ?? 300;
      const sortBy = constraints.rankBy || 'vote_average.desc';
      const res = await discoverMovies({
        originalLanguage: constraints.originalLanguageCode,
        genreIds: constraints.genreIds,
        sortBy,
        minVoteCount: minVotes,
        page: 1,
      });
      candidates = res.movies;
      sourceLabel = `TMDB User-Rating Ranking (min ${minVotes} votes, sorted by ${sortBy})`;
    } else {
      // Structured discovery via /discover/movie — strictly enforces originalLanguage
      const res = await discoverMovies({
        query:
          constraints.intentType === 'global_discovery' &&
          !constraints.originalLanguageCode &&
          (!constraints.genreIds || constraints.genreIds.length === 0) &&
          !constraints.releasePeriod &&
          !constraints.maxRuntimeMinutes
            ? constraints.freeTextQuery
            : undefined,
        originalLanguage: constraints.originalLanguageCode,
        genreIds: constraints.genreIds,
        maxRuntimeMinutes: constraints.maxRuntimeMinutes,
        releasePeriod: constraints.releasePeriod,
        specificYear: constraints.specificYear,
        sortBy:
          constraints.releasePeriod === 'this_week' ||
          constraints.releasePeriod === 'this_month' ||
          constraints.releasePeriod === 'this_year'
            ? 'primary_release_date.desc'
            : 'popularity.desc',
        page: 1,
      });
      candidates = res.movies;
      sourceLabel = res.source || 'TMDB Discover';
    }

    if (candidates.length === 0) {
      warnings.push(
        constraints.originalLanguageCode
          ? `No matching ${constraints.language || constraints.originalLanguageCode} films found for the specified filters.`
          : 'No matching films found for the specified filters.'
      );
    }

    const evidence: EvidenceItem[] = [
      {
        sourceName: sourceLabel,
        sourceUrl: 'https://developer.themoviedb.org/docs',
        publishedAt: retrievedAt,
        retrievedAt,
        territory: constraints.originalLanguageCode
          ? `lang:${constraints.originalLanguageCode}`
          : 'Worldwide',
        metric: 'candidate_pool_size',
        value: candidates.length,
        methodologyNote: `Retrieved live via ${sourceLabel} with strict filter enforcement.`,
        confidence: 'high',
      },
    ];

    return {
      agent: 'MovieDiscoveryAgent',
      status: candidates.length > 0 ? 'completed' : 'partial',
      summary: `Retrieved ${candidates.length} candidate film(s) via ${sourceLabel}.`,
      items: candidates,
      evidence,
      warnings,
      retrievedAt,
      durationMs: Date.now() - start,
    };
  } catch (err) {
    return {
      agent: 'MovieDiscoveryAgent',
      status: 'failed',
      summary: 'Failed to retrieve movies from TMDB.',
      items: [],
      evidence: [],
      warnings: [err instanceof Error ? err.message : 'TMDB request failed'],
      retrievedAt,
      durationMs: Date.now() - start,
    };
  }
}
