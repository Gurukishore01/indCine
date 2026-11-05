import 'dotenv/config';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { AGENT_REGISTRY } from './server/aios/agentRegistry';
import { runMoodRecommendationWorkflow } from './server/aios/orchestrator';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health & AIOS status endpoint
  app.get('/api/health', async (_req, res) => {
    const { isTmdbConfigured } = await import('./server/services/tmdbService');
    res.json({
      status: 'ok',
      service: 'CINEMIND AIOS',
      geminiConfigured: Boolean(
        process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'
      ),
      tmdbConfigured: isTmdbConfigured(),
      timestamp: new Date().toISOString(),
    });
  });

  // TMDB Languages & Countries Configuration
  app.get('/api/movies/languages', async (_req, res) => {
    try {
      const { getTmdbLanguages, isTmdbConfigured } = await import(
        './server/services/tmdbService'
      );
      if (!isTmdbConfigured()) {
        return res.json({ configured: false, languages: [] });
      }
      const languages = await getTmdbLanguages();
      res.json({ configured: true, languages });
    } catch (err) {
      res.status(502).json({
        configured: true,
        languages: [],
        error: err instanceof Error ? err.message : 'Failed to fetch languages',
      });
    }
  });

  app.get('/api/movies/countries', async (_req, res) => {
    try {
      const { getTmdbCountries, isTmdbConfigured } = await import(
        './server/services/tmdbService'
      );
      if (!isTmdbConfigured()) {
        return res.json({ configured: false, countries: [] });
      }
      const countries = await getTmdbCountries();
      res.json({ configured: true, countries });
    } catch (err) {
      res.status(502).json({
        configured: true,
        countries: [],
        error: err instanceof Error ? err.message : 'Failed to fetch countries',
      });
    }
  });

  // TMDB Structured Discover
  app.get('/api/movies/discover', async (req, res) => {
    try {
      const { discoverMovies } = await import('./server/services/tmdbService');
      const genreIds = req.query.genres
        ? String(req.query.genres)
            .split(',')
            .map((n) => Number(n.trim()))
            .filter((n) => !Number.isNaN(n) && n > 0)
        : undefined;

      const data = await discoverMovies({
        query: req.query.q ? String(req.query.q) : undefined,
        originalLanguage: req.query.language ? String(req.query.language) : undefined,
        region: req.query.region ? String(req.query.region) : undefined,
        genreIds,
        maxRuntimeMinutes: req.query.maxRuntime ? Number(req.query.maxRuntime) : undefined,
        releasePeriod: req.query.releasePeriod
          ? (String(req.query.releasePeriod) as any)
          : undefined,
        specificYear: req.query.year ? Number(req.query.year) : undefined,
        releaseDateGte: req.query.dateGte ? String(req.query.dateGte) : undefined,
        releaseDateLte: req.query.dateLte ? String(req.query.dateLte) : undefined,
        sortBy: req.query.sortBy ? (String(req.query.sortBy) as any) : undefined,
        minVoteCount: req.query.minVotes ? Number(req.query.minVotes) : undefined,
        page: Math.max(1, Number(req.query.page) || 1),
      });
      res.json(data);
    } catch (err) {
      res.status(502).json({
        configured: true,
        movies: [],
        page: 1,
        totalPages: 0,
        totalResults: 0,
        error: err instanceof Error ? err.message : 'Failed to discover movies',
      });
    }
  });

  // TMDB Trending Movies (Day & Week)
  app.get('/api/movies/trending/day', async (req, res) => {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const { getTrendingDayMovies } = await import('./server/services/tmdbService');
      const data = await getTrendingDayMovies(page);
      res.json(data);
    } catch (err) {
      res.status(502).json({
        configured: true,
        movies: [],
        page: 1,
        totalPages: 0,
        totalResults: 0,
        error: err instanceof Error ? err.message : 'Failed to fetch daily trending movies',
      });
    }
  });

  app.get('/api/movies/trending/week', async (req, res) => {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const { getTrendingMovies } = await import('./server/services/tmdbService');
      const data = await getTrendingMovies(page);
      res.json(data);
    } catch (err) {
      res.status(502).json({
        configured: true,
        movies: [],
        page: 1,
        totalPages: 0,
        totalResults: 0,
        error: err instanceof Error ? err.message : 'Failed to fetch weekly trending movies',
      });
    }
  });

  app.get('/api/movies/trending', async (req, res) => {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const { getTrendingMovies } = await import('./server/services/tmdbService');
      const data = await getTrendingMovies(page);
      res.json(data);
    } catch (err) {
      res.status(502).json({
        configured: true,
        movies: [],
        page: 1,
        totalPages: 0,
        totalResults: 0,
        error: err instanceof Error ? err.message : 'Failed to fetch trending movies',
      });
    }
  });

  // TMDB Recent Releases
  app.get('/api/movies/recent', async (req, res) => {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const { discoverMovies } = await import('./server/services/tmdbService');
      const data = await discoverMovies({
        releasePeriod: 'this_month',
        sortBy: 'primary_release_date.desc',
        page,
      });
      res.json(data);
    } catch (err) {
      res.status(502).json({
        configured: true,
        movies: [],
        page: 1,
        totalPages: 0,
        totalResults: 0,
        error: err instanceof Error ? err.message : 'Failed to fetch recent releases',
      });
    }
  });

  // TMDB Popular Movies
  app.get('/api/movies/popular', async (req, res) => {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const { getPopularMovies } = await import('./server/services/tmdbService');
      const data = await getPopularMovies(page);
      res.json(data);
    } catch (err) {
      res.status(502).json({
        configured: true,
        movies: [],
        page: 1,
        totalPages: 0,
        totalResults: 0,
        error: err instanceof Error ? err.message : 'Failed to fetch popular movies',
      });
    }
  });

  // TMDB Upcoming Movies
  app.get('/api/movies/upcoming', async (req, res) => {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const { getUpcomingMovies } = await import('./server/services/tmdbService');
      const data = await getUpcomingMovies(page);
      res.json(data);
    } catch (err) {
      res.status(502).json({
        configured: true,
        movies: [],
        page: 1,
        totalPages: 0,
        totalResults: 0,
        error: err instanceof Error ? err.message : 'Failed to fetch upcoming movies',
      });
    }
  });

  // TMDB Search Movies
  app.get('/api/movies/search', async (req, res) => {
    try {
      const q = String(req.query.q || '');
      const page = Math.max(1, Number(req.query.page) || 1);
      const { searchMovies } = await import('./server/services/tmdbService');
      const data = await searchMovies(q, page);
      res.json(data);
    } catch (err) {
      res.status(502).json({
        configured: true,
        movies: [],
        page: 1,
        totalPages: 0,
        totalResults: 0,
        error: err instanceof Error ? err.message : 'Failed to search movies',
      });
    }
  });

  // TMDB Similar Movies
  app.get('/api/movies/:id/similar', async (req, res) => {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const { getSimilarMovies } = await import('./server/services/tmdbService');
      const data = await getSimilarMovies(req.params.id, page);
      res.json(data);
    } catch (err) {
      res.status(502).json({
        configured: true,
        movies: [],
        page: 1,
        totalPages: 0,
        totalResults: 0,
        error: err instanceof Error ? err.message : 'Failed to fetch similar movies',
      });
    }
  });

  // TMDB Movie Watch Providers (Regional OTT Availability)
  app.get('/api/movies/:id/availability', async (req, res) => {
    try {
      const region = String(req.query.region || 'IN').toUpperCase();
      const { getMovieWatchProviders } = await import('./server/services/tmdbService');
      const data = await getMovieWatchProviders(req.params.id, region);
      res.json(data);
    } catch (err) {
      res.status(502).json({
        configured: true,
        movieId: req.params.id,
        title: 'Unknown',
        region: String(req.query.region || 'IN').toUpperCase(),
        status: 'AVAILABILITY_UNKNOWN',
        tmdbWatchLink: null,
        flatrate: [],
        free: [],
        ads: [],
        rent: [],
        buy: [],
        cinemaVerified: false,
        cinemaNote: 'Unable to verify availability due to upstream API error.',
        attribution: 'Watch provider data powered by JustWatch via TMDB API v3.',
        retrievedAt: new Date().toISOString(),
        error: err instanceof Error ? err.message : 'Failed to fetch watch providers',
      });
    }
  });

  // TMDB Movie Details
  app.get('/api/movies/:id', async (req, res) => {
    try {
      const { getMovieDetails } = await import('./server/services/tmdbService');
      const data = await getMovieDetails(req.params.id);
      res.json(data);
    } catch (err) {
      res.status(502).json({
        configured: true,
        movie: null,
        error: err instanceof Error ? err.message : 'Failed to fetch movie details',
      });
    }
  });

  // Session-only Trend Observations
  app.get('/api/trends/observations', async (req, res) => {
    const window = req.query.window === 'week' ? 'week' : 'day';
    const { getObservedMovements } = await import('./server/services/trendObserver');
    res.json(getObservedMovements(window));
  });

  // Agent registry endpoint
  app.get('/api/agents', (_req, res) => {
    res.json({
      agents: AGENT_REGISTRY,
    });
  });

  // Minimal server-side Gemini connection test endpoint
  app.post('/api/aios/test-gemini', async (req, res) => {
    try {
      const { prompt = 'Reply exactly: CINEMIND AI ENGINE ONLINE' } = req.body || {};
      const { generateContentWithRetry } = await import('./server/aios/geminiClient');
      const result = await generateContentWithRetry(String(prompt));
      if (!result.ok) {
        return res.status(502).json(result);
      }
      return res.json(result);
    } catch (err) {
      return res.status(500).json({
        ok: false,
        error: err instanceof Error ? err.message : 'Unknown Gemini API error',
      });
    }
  });

  // Phase 2: Mood-based movie recommendation workflow
  app.post('/api/aios/recommend', async (req, res) => {
    try {
      const { prompt = '', constraints = {} } = req.body || {};
      const result = await runMoodRecommendationWorkflow(String(prompt), constraints);
      res.json(result);
    } catch (err) {
      res.status(500).json({
        error: 'AIOS Orchestrator failed to process recommendation request.',
        details: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  });

  // Ensure any unmatched /api/* route returns JSON instead of HTML
  app.all('/api/*', (req, res) => {
    res.status(404).json({
      error: `API route not found: ${req.method} ${req.path}`,
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CINEMIND AIOS server running on http://localhost:${PORT}`);
  });
}

startServer();
