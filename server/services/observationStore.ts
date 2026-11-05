import fs from 'fs';
import path from 'path';
import { TrendMovementItem, TrendObservation } from '../../src/types/aios';

const DATA_DIR = path.resolve(process.cwd(), 'server', 'data');
const DATA_FILE = path.join(DATA_DIR, 'observations.json');
const MAX_OBSERVATIONS_PER_MOVIE = 30;
// Minimum 10-minute cadence between recorded snapshots for the same movie window to ensure genuine temporal separation
const SNAPSHOT_CADENCE_MS = 10 * 60 * 1000;

interface StoredObservationData {
  observations: Record<string, TrendObservation[]>;
  totalSnapshotsTaken: number;
  lastSnapshotAt: string | null;
}

function loadData(): StoredObservationData {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Failed to load observation store, initializing memory store:', err);
  }
  return {
    observations: {},
    totalSnapshotsTaken: 0,
    lastSnapshotAt: null,
  };
}

let store: StoredObservationData = loadData();

function persistData(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to persist observation store:', err);
  }
}

export function recordMovieObservations(
  movies: Array<{
    id: string;
    title: string;
    originalLanguage?: string;
    sourcePopularity?: number | null;
  }>,
  window: 'day' | 'week',
  sourceLabel = 'TMDB API v3 Trending (Filtered by Indian Original Languages)'
): void {
  const observedAt = new Date().toISOString();
  let anyRecorded = false;

  movies.forEach((movie, index) => {
    const key = `${window}:${movie.id}`;
    const list = store.observations[key] || [];

    // Explicit rank only from official trending order
    const rank = index + 1;
    // Missing popularity preserved as null, never forced to zero
    const metricValue =
      typeof movie.sourcePopularity === 'number' && !Number.isNaN(movie.sourcePopularity)
        ? Number(movie.sourcePopularity.toFixed(1))
        : null;

    // Check cadence: ignore if within SNAPSHOT_CADENCE_MS
    const last = list[list.length - 1];
    if (last && Date.now() - new Date(last.observedAt).getTime() < SNAPSHOT_CADENCE_MS) {
      return;
    }

    list.push({
      id: `obs_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      movieId: movie.id,
      title: movie.title,
      originalLanguage: movie.originalLanguage || 'unknown',
      provider: sourceLabel,
      observedAt,
      metricName: 'tmdb_popularity_index',
      metricValue,
      rank,
      region: 'Global / Indian Languages (ta, te, ml, kn, hi, bn, mr, pa)',
      window,
      sourceReference: `https://api.themoviedb.org/3/trending/movie/${window}`,
    });

    if (list.length > MAX_OBSERVATIONS_PER_MOVIE) {
      list.shift();
    }
    store.observations[key] = list;
    anyRecorded = true;
  });

  if (anyRecorded) {
    store.lastSnapshotAt = observedAt;
    store.totalSnapshotsTaken += 1;
    persistData();
  }
}

export function getTrendMovements(window: 'day' | 'week' = 'day'): {
  hasSufficientHistory: boolean;
  disclosure: string;
  totalLoggedSnapshots: number;
  lastSnapshotAt: string | null;
  movements: TrendMovementItem[];
} {
  const movements: TrendMovementItem[] = [];
  let sufficientCount = 0;

  for (const [key, list] of Object.entries(store.observations)) {
    if (!key.startsWith(`${window}:`) || list.length === 0) continue;
    const current = list[list.length - 1];
    const previous = list.length >= 2 ? list[list.length - 2] : null;

    if (!previous || previous.metricValue === null || current.metricValue === null) {
      movements.push({
        movieId: current.movieId,
        title: current.title,
        originalLanguage: current.originalLanguage,
        status: 'Insufficient history',
        window,
        currentRank: current.rank,
        previousRank: null,
        rankDelta: null,
        currentValue: current.metricValue ?? 0,
        previousValue: null,
        percentageChange: null,
        observationCount: list.length,
        lastObservedAt: current.observedAt,
        source: current.provider,
      });
      continue;
    }

    // Verify source and region compatibility
    if (current.provider !== previous.provider) {
      movements.push({
        movieId: current.movieId,
        title: current.title,
        originalLanguage: current.originalLanguage,
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
        source: `${current.provider} (Source mismatch flagged)`,
      });
      continue;
    }

    sufficientCount++;
    const rankDelta =
      previous.rank !== null && current.rank !== null
        ? previous.rank - current.rank
        : null;

    let percentageChange: number | null = null;
    if (previous.metricValue && previous.metricValue > 0) {
      percentageChange = Number(
        (((current.metricValue - previous.metricValue) / previous.metricValue) * 100).toFixed(1)
      );
    }

    // Non-contradictory trend classification
    let status: TrendMovementItem['status'] = 'Stable';
    const rankIsRising = rankDelta !== null && rankDelta > 0;
    const rankIsFalling = rankDelta !== null && rankDelta < 0;
    const metricIsRising = percentageChange !== null && percentageChange >= 2.5;
    const metricIsFalling = percentageChange !== null && percentageChange <= -2.5;

    if ((rankIsRising && !metricIsFalling) || (metricIsRising && !rankIsFalling)) {
      status = 'Rising';
    } else if ((rankIsFalling && !metricIsRising) || (metricIsFalling && !rankIsRising)) {
      status = 'Falling';
    } else {
      status = 'Stable';
    }

    movements.push({
      movieId: current.movieId,
      title: current.title,
      originalLanguage: current.originalLanguage,
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
      source: current.provider,
    });
  }

  // Sort: Rising first, then by current rank
  movements.sort((a, b) => {
    if (a.status === 'Rising' && b.status !== 'Rising') return -1;
    if (b.status === 'Rising' && a.status !== 'Rising') return 1;
    return (a.currentRank || 999) - (b.currentRank || 999);
  });

  return {
    hasSufficientHistory: sufficientCount > 0,
    disclosure:
      'IndCine Evidence Rule: Trend trajectory (Rising/Falling) requires at least two comparable timestamped snapshots with compatible source provenance. Single observations remain tagged as "Insufficient history".',
    totalLoggedSnapshots: store.totalSnapshotsTaken,
    lastSnapshotAt: store.lastSnapshotAt,
    movements,
  };
}

export function getTotalObservationCount(): number {
  return Object.values(store.observations).reduce((acc, list) => acc + list.length, 0);
}
