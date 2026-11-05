import {
  AgentExecutionLogEntry,
  EvidenceItem,
  MoodConstraints,
  Movie,
  OrchestratorResponse,
} from '../../src/types/aios';
import { discoverMovies, getMovieDetails, searchMovies } from '../services/tmdbService';
import { runMovieDiscoveryAgent } from './agents/discoveryAgent';
import { runIntentPlanningAgent } from './agents/intentAgent';
import { runRecommendationAgent } from './agents/recommendationAgent';
import { runReviewSentimentAgent } from './agents/reviewAgent';
import { generateContentWithRetry, getGeminiClient } from './geminiClient';

export async function runMoodRecommendationWorkflow(
  prompt: string,
  explicitConstraints?: MoodConstraints
): Promise<OrchestratorResponse> {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const retrievedAt = new Date().toISOString();
  const executionLog: AgentExecutionLogEntry[] = [];
  const allEvidence: EvidenceItem[] = [];
  const allWarnings: string[] = [];
  const unavailableCapabilities: string[] = [];
  let usedGemini = false;

  // Step 1: Intent & Planning
  const intentResult = await runIntentPlanningAgent(prompt, explicitConstraints);
  if (intentResult.usedGemini) usedGemini = true;
  const constraints = intentResult.items[0] || explicitConstraints || {};
  const intentType = constraints.intentType || 'mood_recommendation';

  executionLog.push({
    id: `${requestId}_step1`,
    step: 1,
    agent: intentResult.agent,
    action: 'Parse user intent, language & constraints',
    status: intentResult.status,
    durationMs: intentResult.durationMs,
    timestamp: intentResult.retrievedAt,
    summary: intentResult.summary,
    warnings: intentResult.warnings,
  });
  allWarnings.push(...intentResult.warnings);

  // Branch A: Movie Comparison
  if (
    intentType === 'movie_comparison' &&
    constraints.compareTitles &&
    constraints.compareTitles.length >= 2
  ) {
    const plan = [
      '1. IntentPlanningAgent: Detected movie comparison request.',
      '2. MovieDiscoveryAgent: Retrieve metadata & ratings for compared titles in parallel.',
    ];
    const compStart = Date.now();
    const titles = constraints.compareTitles.slice(0, 2);
    const searchResults = await Promise.all(titles.map((t) => searchMovies(t, 1)));
    const detailResults = await Promise.all(
      searchResults.map((sr) =>
        sr.movies[0] ? getMovieDetails(sr.movies[0].id) : Promise.resolve({ movie: null })
      )
    );
    const comparedMovies = detailResults
      .map((d) => d.movie)
      .filter((m): m is Movie => Boolean(m));

    executionLog.push({
      id: `${requestId}_step2`,
      step: 2,
      agent: 'MovieDiscoveryAgent',
      action: `Retrieve details for ${titles.join(' vs ')}`,
      status: comparedMovies.length >= 2 ? 'completed' : 'partial',
      durationMs: Date.now() - compStart,
      timestamp: new Date().toISOString(),
      summary: `Retrieved ${comparedMovies.length} of ${titles.length} requested titles from TMDB.`,
      warnings: [],
    });

    comparedMovies.forEach((m) => {
      allEvidence.push({
        sourceName: 'TMDB API v3',
        sourceUrl: `https://www.themoviedb.org/movie/${m.id}`,
        publishedAt: m.releaseDate || null,
        retrievedAt: new Date().toISOString(),
        territory: m.region || 'Worldwide',
        metric: 'tmdb_user_rating_and_runtime',
        value: m.sourceVoteAverage
          ? `${m.sourceVoteAverage.toFixed(1)}/10 (${m.sourceVoteCount} votes)`
          : 'Unrated',
        methodologyNote:
          'TMDB user rating and metadata. Critic review data and official awards are unavailable.',
        confidence: 'high',
      });
    });

    const answer =
      comparedMovies.length >= 2
        ? comparedMovies
            .map(
              (m) =>
                `**${m.title}** (${m.year}, ${m.language}, ${
                  m.runtimeMinutes ? `${m.runtimeMinutes}m` : 'Runtime N/A'
                }) — TMDB User Rating: ${
                  m.sourceVoteAverage
                    ? `${m.sourceVoteAverage.toFixed(1)}/10 (${m.sourceVoteCount?.toLocaleString()} votes)`
                    : 'N/A'
                }`
            )
            .join(' | ')
        : 'Could not find both titles on TMDB for comparison.';

    return {
      requestId,
      intent: intentType,
      constraints,
      plan,
      executionLog,
      recommendations: [],
      movies: comparedMovies,
      answer,
      evidence: allEvidence,
      warnings: allWarnings,
      retrievedAt,
      usedGemini,
    };
  }

  // Branch B: General Movie Research (History, Box-Office Success, Awards, 2027 Anticipation)
  if (intentType === 'general_research') {
    const lower = prompt.toLowerCase();
    const researchStart = Date.now();
    let relatedMovies: Movie[] = [];

    if (lower.includes('2027') || lower.includes('anticipated')) {
      const res2027 = await discoverMovies({
        releasePeriod: 'specific_year',
        specificYear: 2027,
        sortBy: 'popularity.desc',
        page: 1,
      });
      relatedMovies = res2027.movies.slice(0, 6);
      allEvidence.push({
        sourceName: 'TMDB Discover (2027)',
        sourceUrl: 'https://developer.themoviedb.org/docs',
        publishedAt: retrievedAt,
        retrievedAt,
        territory: 'Worldwide',
        metric: 'tmdb_popularity_2027',
        value: relatedMovies.length,
        methodologyNote:
          'Ranked by TMDB popularity for 2027 releases. Pre-release popularity is not a box-office guarantee.',
        confidence: 'medium',
      });
    } else if (lower.includes('oppenheimer')) {
      const sr = await searchMovies('Oppenheimer', 1);
      if (sr.movies[0]) {
        const det = await getMovieDetails(sr.movies[0].id);
        if (det.movie) {
          relatedMovies = [det.movie];
          allEvidence.push({
            sourceName: 'TMDB API v3',
            sourceUrl: `https://www.themoviedb.org/movie/${det.movie.id}`,
            publishedAt: det.movie.releaseDate || null,
            retrievedAt,
            territory: det.movie.region || 'Worldwide',
            metric: 'budget_and_worldwide_gross',
            value: det.movie.boxOffice
              ? `Budget: ${det.movie.boxOffice.budget || 'N/A'}, Gross: ${
                  det.movie.boxOffice.worldwideGross || 'N/A'
                }`
              : 'N/A',
            methodologyNote:
              'Reported by TMDB; gross revenue does not represent net studio profit.',
            confidence: 'high',
          });
        }
      }
    }

    if (lower.includes('award') || lower.includes('oscar')) {
      unavailableCapabilities.push(
        'AwardsIntelligenceAgent (Planned): Live official Academy Awards database is not connected; providing general historical context.'
      );
    }

    executionLog.push({
      id: `${requestId}_step2`,
      step: 2,
      agent: 'MovieDiscoveryAgent',
      action: 'Retrieve supporting TMDB records for research',
      status: 'completed',
      durationMs: Date.now() - researchStart,
      timestamp: new Date().toISOString(),
      summary: `Retrieved ${relatedMovies.length} supporting TMDB record(s).`,
      warnings: [],
    });

    let answer =
      'General movie research completed. See retrieved TMDB records and evidence below.';
    const ai = getGeminiClient();
    if (ai) {
      const synthStart = Date.now();
      const contextSnippet =
        relatedMovies.length > 0
          ? `Retrieved TMDB records: ${JSON.stringify(
              relatedMovies.map((m) => ({
                title: m.title,
                year: m.year,
                rating: m.sourceVoteAverage,
                votes: m.sourceVoteCount,
                boxOffice: m.boxOffice,
              }))
            )}`
          : 'No specific TMDB records queried.';

      const gemRes = await generateContentWithRetry(
        `You are CINEMIND AIOS, a factual movie intelligence assistant.
User question: "${prompt}"
${contextSnippet}
Rules:
1. Answer concisely in 2-4 sentences.
2. Clearly distinguish retrieved TMDB facts from general film-history context.
3. Do NOT invent Rotten Tomatoes scores, IMDb ratings, or unverified box-office/award numbers.
4. If live award or critic databases are unavailable, briefly note that limitation.`
      );
      if (gemRes.ok && gemRes.text) {
        answer = gemRes.text;
        usedGemini = true;
      }
      executionLog.push({
        id: `${requestId}_step3`,
        step: 3,
        agent: 'ReviewSentimentAgent',
        action: 'Synthesize evidence-backed research answer',
        status: gemRes.ok ? 'completed' : 'partial',
        durationMs: Date.now() - synthStart,
        timestamp: new Date().toISOString(),
        summary: gemRes.ok
          ? 'Synthesized grounded research response via Gemini.'
          : 'Gemini synthesis unavailable; returned retrieved TMDB records.',
        warnings: gemRes.ok ? [] : [gemRes.error || 'Gemini unavailable'],
      });
    }

    return {
      requestId,
      intent: intentType,
      constraints,
      plan: [
        '1. IntentPlanningAgent: Classified as general movie research.',
        '2. MovieDiscoveryAgent: Retrieved supporting TMDB records.',
      ],
      executionLog,
      recommendations: [],
      movies: relatedMovies,
      unavailableCapabilities:
        unavailableCapabilities.length > 0 ? unavailableCapabilities : undefined,
      answer,
      evidence: allEvidence,
      warnings: allWarnings,
      retrievedAt,
      usedGemini,
    };
  }

  // Branch C: OTT Availability or Cinema Discovery
  if (intentType === 'ott_availability') {
    unavailableCapabilities.push(
      'OTTAvailabilityAgent (Planned): Country-specific JustWatch streaming availability is not yet active. Catalog search links are provided on the movie card.'
    );
    const titleMatch = prompt.match(/watch\s+([a-zA-Z0-9\s:'-]+?)(?:\s+in\s+|\?|$)/i);
    const searchTitle = titleMatch ? titleMatch[1].trim() : prompt;
    const sr = await searchMovies(searchTitle, 1);
    const movies = sr.movies.slice(0, 3);
    if (movies[0]) {
      allEvidence.push({
        sourceName: 'TMDB API v3',
        sourceUrl: `https://www.themoviedb.org/movie/${movies[0].id}`,
        publishedAt: movies[0].releaseDate || null,
        retrievedAt,
        territory: 'Worldwide',
        metric: 'title_lookup',
        value: movies[0].title,
        methodologyNote:
          'Title matched on TMDB. Verified regional OTT availability requires OTTAvailabilityAgent.',
        confidence: 'medium',
      });
    }
    return {
      requestId,
      intent: intentType,
      constraints,
      plan: [
        '1. IntentPlanningAgent: Detected OTT availability request.',
        '2. MovieDiscoveryAgent: Matched title on TMDB; disclosed OTTAvailabilityAgent limitation.',
      ],
      executionLog,
      recommendations: [],
      movies,
      unavailableCapabilities,
      answer: movies[0]
        ? `Matched **${movies[0].title}** (${movies[0].year}). Verified regional streaming availability is not yet connected; open the movie card for catalog search links or visit Where to Watch.`
        : 'Could not find that title on TMDB.',
      evidence: allEvidence,
      warnings: allWarnings,
      retrievedAt,
      usedGemini,
    };
  }

  if (intentType === 'cinema_discovery') {
    unavailableCapabilities.push(
      'CinemaDiscoveryAgent (Planned): Live local cinema showtimes are not yet active. Use the In Theatres screen for regional ticketing portals.'
    );
  }

  // Step 2: Movie Discovery
  const discoveryResult = await runMovieDiscoveryAgent(constraints);
  executionLog.push({
    id: `${requestId}_step2`,
    step: 2,
    agent: discoveryResult.agent,
    action:
      intentType === 'all_time_ranking'
        ? 'Query TMDB Discover for all-time user-rating ranking'
        : 'Retrieve candidate films from TMDB',
    status: discoveryResult.status,
    durationMs: discoveryResult.durationMs,
    timestamp: discoveryResult.retrievedAt,
    summary: discoveryResult.summary,
    warnings: discoveryResult.warnings,
  });
  allEvidence.push(...discoveryResult.evidence);
  allWarnings.push(...discoveryResult.warnings);

  // Branch D: All-Time Ranking, Trending Query, or Global Discovery (no personalised match %)
  if (
    intentType === 'all_time_ranking' ||
    intentType === 'trending_query' ||
    intentType === 'global_discovery'
  ) {
    const plan = [
      '1. IntentPlanningAgent: Extract intent, language, genre, and ranking/period filters.',
      '2. MovieDiscoveryAgent: Query TMDB with strict filter enforcement.',
    ];
    const topMovies = discoveryResult.items.slice(0, 8);
    const sourceName = discoveryResult.evidence[0]?.sourceName || 'TMDB';

    if (discoveryResult.status === 'failed') {
      return {
        requestId,
        intent: intentType,
        constraints,
        plan,
        executionLog,
        recommendations: [],
        movies: [],
        answer: 'Unable to retrieve movie results right now. Please try again.',
        evidence: allEvidence,
        warnings: Array.from(new Set(allWarnings)),
        retrievedAt,
        usedGemini,
      };
    }

    let answer = discoveryResult.warnings[0] || 'No matching films found.';
    if (topMovies.length > 0) {
      const langLabel =
        constraints.language && constraints.language !== 'All Languages'
          ? `${constraints.language} `
          : '';
      const genreLabel = constraints.genre ? `${constraints.genre.toLowerCase()} ` : '';
      const listLines = topMovies
        .slice(0, 5)
        .map(
          (m, i) =>
            `${i + 1}. **${m.title}** (${m.year || 'TBA'}) — ${
              m.sourceVoteAverage ? `★ ${m.sourceVoteAverage.toFixed(1)}/10` : 'Unrated'
            }`
        )
        .join('\n');

      if (intentType === 'all_time_ranking') {
        answer = `Here are top-rated ${langLabel}${genreLabel}movies (sorted by TMDB user rating):\n${listLines}`;
      } else if (intentType === 'trending_query') {
        answer = `Trending worldwide (${
          constraints.trendingWindow === 'day' ? 'Today' : 'This Week'
        } · TMDB):\n${listLines}`;
      } else {
        answer = `Here are ${langLabel}${genreLabel}movies from TMDB:\n${listLines}`;
      }
    }

    return {
      requestId,
      intent: intentType,
      constraints,
      plan,
      executionLog,
      recommendations: [],
      movies: topMovies,
      unavailableCapabilities:
        unavailableCapabilities.length > 0 ? unavailableCapabilities : undefined,
      answer,
      evidence: allEvidence,
      warnings: Array.from(new Set(allWarnings)),
      retrievedAt,
      usedGemini,
    };
  }

  // Step 3: Recommendation Ranking (for mood_recommendation & similar_movies)
  const recResult = await runRecommendationAgent(discoveryResult.items, constraints);
  executionLog.push({
    id: `${requestId}_step3`,
    step: 3,
    agent: recResult.agent,
    action: 'Compute transparent CINEMIND Fit Scores',
    status: recResult.status === 'success' ? 'completed' : recResult.status,
    durationMs: recResult.durationMs,
    timestamp: recResult.retrievedAt,
    summary: recResult.summary,
    warnings: recResult.warnings,
  });
  allWarnings.push(...recResult.warnings);

  // Step 4: Review & Sentiment Analysis (only for mood_recommendation)
  let reviewResult = null;
  if (intentType === 'mood_recommendation' && recResult.items.length > 0) {
    reviewResult = await runReviewSentimentAgent(recResult.items, constraints);
    if (reviewResult.usedGemini) usedGemini = true;
    executionLog.push({
      id: `${requestId}_step4`,
      step: 4,
      agent: reviewResult.agent,
      action: 'Synthesize sourced TMDB audience consensus',
      status: reviewResult.status === 'success' ? 'completed' : reviewResult.status,
      durationMs: reviewResult.durationMs,
      timestamp: reviewResult.retrievedAt,
      summary: reviewResult.summary,
      warnings: reviewResult.warnings,
    });
    allEvidence.push(...reviewResult.evidence);
    allWarnings.push(...reviewResult.warnings);
  }

  const plan = [
    '1. IntentPlanningAgent: Extract intent, language, genre, and runtime constraints.',
    '2. MovieDiscoveryAgent: Retrieve matching candidate films from TMDB.',
    '3. RecommendationAgent: Compute transparent CINEMIND Fit Scores.',
    ...(reviewResult
      ? ['4. ReviewSentimentAgent: Synthesize sourced TMDB audience consensus.']
      : []),
  ];

  const top = recResult.items[0];
  const answer = top
    ? `Based on your request, CINEMIND recommends **${top.movie.title}** (${
        top.movie.year || 'TBA'
      }, ${top.movie.language}) — **CINEMIND Fit: ${top.matchScore}%**. ${top.reviewInsight}`
    : discoveryResult.warnings[0] || 'No matching films were found.';

  return {
    requestId,
    intent: intentType,
    constraints,
    plan,
    executionLog,
    recommendations: recResult.items,
    movies: recResult.items.map((r) => r.movie),
    unavailableCapabilities:
      unavailableCapabilities.length > 0 ? unavailableCapabilities : undefined,
    answer,
    evidence: allEvidence,
    warnings: Array.from(new Set(allWarnings)),
    retrievedAt,
    usedGemini,
  };
}
