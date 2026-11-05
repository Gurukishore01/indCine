import { EvidenceItem, Movie } from '../../../src/types/aios';
import { discoverIndianMovies, searchIndianMovies } from '../../services/tmdbService';

export interface DiscoveryAgentResult {
  agent: string;
  status: 'completed' | 'partial' | 'failed';
  movies: Movie[];
  evidence: EvidenceItem[];
  warnings: string[];
  summary: string;
  durationMs: number;
}

export async function runIndianMovieDiscoveryAgent(params: {
  query?: string;
  language?: string;
  genreId?: number;
  year?: number;
}): Promise<DiscoveryAgentResult> {
  const start = Date.now();
  const evidence: EvidenceItem[] = [];
  const warnings: string[] = [];

  let result;
  if (params.query && params.query.trim()) {
    result = await searchIndianMovies(params.query.trim(), 1);
  } else {
    result = await discoverIndianMovies({
      language: params.language,
      genreId: params.genreId,
      year: params.year,
    });
  }

  const movies = result.movies;

  if (movies.length === 0) {
    warnings.push(`No Indian cinema records found for criteria: ${JSON.stringify(params)}`);
  }

  movies.forEach((m) => {
    evidence.push({
      sourceName: m.dataSource,
      sourceUrl: `https://www.themoviedb.org/movie/${m.id}`,
      publishedAt: m.releaseDate || null,
      retrievedAt: new Date().toISOString(),
      territory: 'India (IN)',
      metric: 'movie_record',
      value: `${m.title} (${m.year}) - ${m.language}`,
      methodologyNote: `Retrieved via Indian Cinema Discovery pipeline. Strict language: ${m.language}.`,
      confidence: 'high',
    });
  });

  return {
    agent: 'IndianMovieDiscoveryAgent',
    status: movies.length > 0 ? 'completed' : 'partial',
    movies,
    evidence,
    warnings,
    summary: `Identified ${movies.length} Indian cinema records matching query criteria.`,
    durationMs: Date.now() - start,
  };
}
