import 'dotenv/config';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { AGENT_REGISTRY } from './server/aios/agentRegistry';
import { runPlatformIntelligenceAgent } from './server/aios/agents/platformIntelligenceAgent';
import { processChatQuery } from './server/aios/chatEngine';
import { getGeminiHealthState } from './server/aios/geminiClient';
import { runAiosOrchestrator } from './server/aios/orchestrator';
import { VERIFIED_INDIAN_MOVIES } from './server/services/indianCinemaData';
import { getTotalObservationCount, getTrendMovements } from './server/services/observationStore';
import {
  discoverIndianMovies,
  getIndianMovieDetails,
  getTmdbHealthState,
  getTrendingIndianMovies,
  isTmdbConfigured,
  searchIndianMovies,
} from './server/services/tmdbService';

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // Health endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'IndCine AIOS — Indian Cinema Intelligence Operating System',
      geminiConfigured: Boolean(
        process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'
      ),
      tmdbConfigured: isTmdbConfigured(),
      totalObservations: getTotalObservationCount(),
      timestamp: new Date().toISOString(),
    });
  });

  // Intelligence Pulse Dashboard Data
  app.get('/api/pulse', async (_req, res) => {
    try {
      const trendingData = await getTrendingIndianMovies('day');
      const trendMov = getTrendMovements('day');
      const platRes = await runPlatformIntelligenceAgent(trendingData.movies);

      const risingCount = trendMov.movements.filter((m) => m.status === 'Rising').length;
      const trackedCount = trendingData.movies.length;

      const tmdbHealth = getTmdbHealthState();
      const geminiHealth = getGeminiHealthState();

      res.json({
        trackedMoviesCount: trackedCount,
        risingSignalsCount: risingCount,
        ottPlatformsMonitored: platRes.platforms.length,
        evidenceCoverage: {
          verifiedCatalogCount: trackedCount,
          rightsVerifiedTitles: trendingData.movies.filter((m) => m.verifiedOttProviders.length > 0).length,
          provenanceMode: trendingData.mode,
          methodologyNote:
            trendingData.mode === 'live_tmdb'
              ? 'Direct TMDB v3 API and JustWatch India (IN) stream verification. No fabricated synthetic metrics.'
              : 'Curated Benchmark Cohort (Reference Data) across major Indian cinema industries. Not claimed as live trending.',
        },
        lastRefreshedAt: new Date().toISOString(),
        sourceStatus: {
          tmdbConnected: tmdbHealth.state === 'successful',
          geminiConnected: geminiHealth.state === 'successful',
          tmdbHealth,
          geminiHealth,
          observationsLogged: getTotalObservationCount(),
          mode: trendingData.mode,
        },
        topMovements: trendMov.movements.slice(0, 5),
        platformDistribution: platRes.platforms.map((p) => ({
          name: p.providerName,
          code: p.code,
          color: p.color,
          verifiedTitlesCount: p.catalogCount,
          pctOfTracked: trackedCount > 0 ? Math.round((p.catalogCount / trackedCount) * 100) : 0,
          status: p.catalogCount > 0 ? 'Verified Indian rights' : 'Awaiting authorised data',
        })),
        spotlightMovies: trendingData.movies.slice(0, 4),
        recentActivity: [
          {
            type: 'policy',
            title: 'Evidence-first monitoring enabled',
            description: 'Every reported metric retains its source, region, unit and retrieval time.',
            timestamp: 'POLICY',
            severity: 'normal',
          },
          {
            type: 'data',
            title: trendMov.hasSufficientHistory
              ? 'Multi-snapshot trend verification active'
              : 'Multi-observation history requirement',
            description: trendMov.disclosure,
            timestamp: 'DATA',
            severity: trendMov.hasSufficientHistory ? 'success' : 'warn',
          },
          {
            type: 'source',
            title: isTmdbConfigured()
              ? 'TMDB v3 & JustWatch live pipeline connected'
              : 'Benchmark Indian cinema verified registry active',
            description: isTmdbConfigured()
              ? 'Real-time Indian cinema queries streaming from TMDB API.'
              : 'Curated Kollywood, Tollywood, Mollywood, Bollywood, and Sandalwood verification records active.',
            timestamp: 'SOURCE',
            severity: 'normal',
          },
        ],
      });
    } catch (err) {
      res.status(500).json({
        error: 'Failed to aggregate Intelligence Pulse data',
        details: err instanceof Error ? err.message : String(err),
      });
    }
  });

  // Movie Discovery
  app.get('/api/movies/discover', async (req, res) => {
    try {
      const language = req.query.language ? String(req.query.language) : undefined;
      const genreId = req.query.genreId ? Number(req.query.genreId) : undefined;
      const year = req.query.year ? Number(req.query.year) : undefined;
      const sortBy = req.query.sortBy ? String(req.query.sortBy) : undefined;
      const page = req.query.page ? Number(req.query.page) : 1;

      const data = await discoverIndianMovies({ language, genreId, year, sortBy, page });
      res.json(data);
    } catch (err) {
      res.status(502).json({
        movies: [],
        total: 0,
        page: 1,
        totalPages: 0,
        error: err instanceof Error ? err.message : 'Failed to discover movies',
      });
    }
  });

  // Movie Search
  app.get('/api/movies/search', async (req, res) => {
    try {
      const q = String(req.query.q || '');
      const page = req.query.page ? Number(req.query.page) : 1;
      const data = await searchIndianMovies(q, page);
      res.json(data);
    } catch (err) {
      res.status(502).json({
        movies: [],
        total: 0,
        page: 1,
        error: err instanceof Error ? err.message : 'Failed to search movies',
      });
    }
  });

  // Movie Details
  app.get('/api/movies/:id', async (req, res) => {
    try {
      const movie = await getIndianMovieDetails(req.params.id);
      if (!movie) {
        return res.status(404).json({ error: 'Movie not found in verified registry' });
      }
      res.json({ movie });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch movie details' });
    }
  });

  // Trend Observations
  app.get('/api/trends/observations', (req, res) => {
    const window = req.query.window === 'week' ? 'week' : 'day';
    res.json(getTrendMovements(window));
  });

  // OTT Platforms Catalogue breakdown
  app.get('/api/platforms', async (_req, res) => {
    try {
      const result = await runPlatformIntelligenceAgent();
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: 'Failed to retrieve platform intelligence' });
    }
  });

  // Agent Registry
  app.get('/api/agents', (_req, res) => {
    res.json({ agents: AGENT_REGISTRY });
  });

  // Natural Language AIOS Orchestrator
  app.post('/api/aios/query', async (req, res) => {
    try {
      const { query } = req.body || {};
      if (!query || typeof query !== 'string' || !query.trim()) {
        return res.status(400).json({ error: 'Query string is required.' });
      }
      const result = await runAiosOrchestrator(query.trim());
      res.json(result);
    } catch (err) {
      res.status(500).json({
        error: 'AIOS Orchestrator failure',
        details: err instanceof Error ? err.message : String(err),
      });
    }
  });

  // IndCine AI Chatbot Endpoint — Concise Answer-Only Intelligence
  app.post('/api/chat', async (req, res) => {
    try {
      const { query } = req.body || {};
      if (!query || typeof query !== 'string' || !query.trim()) {
        return res.status(400).json({ error: 'Query string is required.' });
      }
      const response = await processChatQuery(query.trim());
      res.json(response);
    } catch (err) {
      res.status(500).json({
        answer: 'Reliable data is currently unavailable.',
        error: err instanceof Error ? err.message : String(err),
      });
    }
  });

  // Unmatched API routes return JSON
  app.all('/api/*', (req, res) => {
    res.status(404).json({ error: `Endpoint not found: ${req.method} ${req.path}` });
  });

  // Vite middleware in dev; static dist in production
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
    console.log(`IndCine AIOS running on port ${PORT}`);
  });
}

startServer();
