import { Movie, TrendMovementItem, TrendObservation } from '../../src/types/aios';

const MAX_OBSERVATIONS_PER_MOVIE = 20;
const observationStore = new Map<string, TrendObservation[]>();

export function recordTrendingObservations(
  movies: Movie[],
  window: 'day' | 'week'
): void {
  const observedAt = new Date().toISOString();
  movies.forEach((movie, index) => {
    const key = `${window}:${movie.id}`;
    const list = observationStore.get(key) || [];
    const rank = index + 1;
    const metricValue =
      typeof movie.sourcePopularity === 'number' ? movie.sourcePopularity : 0;

    // Avoid duplicate observations within 15 seconds
    const last = list[list.length - 1];
    if (last && Date.now() - new Date(last.observedAt).getTime() < 15000) {
      return;
    }

    list.push({
      movieId: movie.id,
      title: movie.title,
      provider: 'TMDB API v3',
      observedAt,
      metricName: 'popularity',
      metricValue,
      rank,
      region: 'Worldwide',
      window,
      sourceReference: `https://api.themoviedb.org/3/trending/movie/${window}`,
    });

    if (list.length > MAX_OBSERVATIONS_PER_MOVIE) {
      list.shift();
    }
    observationStore.set(key, list);
  });
}

export function getObservedMovements(window: 'day' | 'week' = 'day'): {
  hasSufficientHistory: boolean;
  disclosure: string;
  movements: TrendMovementItem[];
} {
  const movements: TrendMovementItem[] = [];
  let sufficientCount = 0;

  for (const [key, list] of observationStore.entries()) {
    if (!key.startsWith(`${window}:`) || list.length === 0) continue;
    const current = list[list.length - 1];
    const previous = list.length >= 2 ? list[list.length - 2] : null;

    if (!previous) {
      movements.push({
        movieId: current.movieId,
        title: current.title,
        status: 'Insufficient history',
        window,
        currentRank: current.rank,
        previousRank: null,
        rankDelta: null,
        currentValue: current.metricValue,
        previousValue: null,
        percentageChange: null,
        observationCount: list.length,
        lastObservedAt: current.observedAt,
        source: `TMDB Trending (${window === 'day' ? 'Daily' : 'Weekly'})`,
      });
      continue;
    }

    sufficientCount++;
    const rankDelta =
      previous.rank !== null && current.rank !== null
        ? previous.rank - current.rank
        : null;

    let percentageChange: number | null = null;
    if (previous.metricValue > 0) {
      percentageChange = Number(
        (((current.metricValue - previous.metricValue) / previous.metricValue) * 100).toFixed(2)
      );
    }

    let status: TrendMovementItem['status'] = 'Stable';
    if (
      (rankDelta !== null && rankDelta > 0) ||
      (percentageChange !== null && percentageChange >= 2)
    ) {
      status = 'Rising';
    } else if (
      (rankDelta !== null && rankDelta < 0) ||
      (percentageChange !== null && percentageChange <= -2)
    ) {
      status = 'Falling';
    }

    movements.push({
      movieId: current.movieId,
      title: current.title,
      status,
      window,
      currentRank: current.rank,
      previousRank: previous.rank,
      rankDelta,
      currentValue: current.metricValue,
      previousValue: previous.metricValue,
      percentageChange,
      observationCount: list.length,
      lastObservedAt: current.observedAt,
      source: `TMDB Trending (${window === 'day' ? 'Daily' : 'Weekly'})`,
    });
  }

  return {
    hasSufficientHistory: sufficientCount > 0,
    disclosure:
      'Session-only observation cache (resets when server restarts). Rising/Falling requires at least 2 comparable observations.',
    movements,
  };
}
