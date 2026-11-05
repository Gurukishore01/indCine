import { Movie } from '../../src/types/aios';
import { VERIFIED_INDIAN_MOVIES } from '../services/indianCinemaData';
import { getTrendMovements } from '../services/observationStore';
import {
  discoverIndianMovies,
  getIndianMovieDetails,
  getTrendingIndianMovies,
  INDIAN_LANGUAGE_MAP,
  isTmdbConfigured,
  searchIndianMovies,
} from '../services/tmdbService';
import { generateContentWithRetry } from './geminiClient';

export interface ChatAnswerResult {
  answer: string;
  evidence?: {
    movieTitle?: string;
    source: string;
    metric?: string;
    verifiedAt: string;
  };
  movieId?: string;
  relatedMovie?: Movie;
}

interface ParsedChatQuery {
  intent:
    | 'booming_trending'
    | 'flop_underperformer'
    | 'highest_rated'
    | 'hit_blockbuster'
    | 'ott_availability'
    | 'movie_profile'
    | 'general';
  languageCode?: string;
  languageName?: string;
  year?: number;
  explicitImdbRequested: boolean;
  rawQuery: string;
}

function parseQuery(q: string): ParsedChatQuery {
  const lower = q.toLowerCase();

  // Language detection
  let languageCode: string | undefined;
  let languageName: string | undefined;

  if (lower.includes('tamil') || lower.includes('kollywood')) {
    languageCode = 'ta';
    languageName = 'Tamil';
  } else if (lower.includes('telugu') || lower.includes('tollywood')) {
    languageCode = 'te';
    languageName = 'Telugu';
  } else if (lower.includes('malayalam') || lower.includes('mollywood')) {
    languageCode = 'ml';
    languageName = 'Malayalam';
  } else if (lower.includes('kannada') || lower.includes('sandalwood')) {
    languageCode = 'kn';
    languageName = 'Kannada';
  } else if (lower.includes('hindi') || lower.includes('bollywood')) {
    languageCode = 'hi';
    languageName = 'Hindi';
  } else if (lower.includes('bengali')) {
    languageCode = 'bn';
    languageName = 'Bengali';
  } else if (lower.includes('marathi')) {
    languageCode = 'mr';
    languageName = 'Marathi';
  } else if (lower.includes('punjabi')) {
    languageCode = 'pa';
    languageName = 'Punjabi';
  }

  // Year detection
  let year: number | undefined;
  const yearMatch = lower.match(/\b(202[0-9])\b/);
  if (yearMatch) {
    year = Number(yearMatch[1]);
  }

  const explicitImdbRequested = lower.includes('imdb');

  // Intent classification
  let intent: ParsedChatQuery['intent'] = 'general';

  if (
    lower.includes('booming') ||
    lower.includes('trending') ||
    lower.includes('buzzing') ||
    lower.includes('sensation') ||
    lower.includes('viral') ||
    lower.includes('popular now') ||
    lower.includes('right now')
  ) {
    intent = 'booming_trending';
  } else if (
    lower.includes('flop') ||
    lower.includes('disaster') ||
    lower.includes('underperformer') ||
    lower.includes('lost money') ||
    lower.includes('biggest loss')
  ) {
    intent = 'flop_underperformer';
  } else if (
    lower.includes('highest rating') ||
    lower.includes('highest rated') ||
    lower.includes('top rated') ||
    lower.includes('highest imdb') ||
    lower.includes('top imdb') ||
    lower.includes('best reviewed')
  ) {
    intent = 'highest_rated';
  } else if (
    lower.includes('highest grossing') ||
    lower.includes('biggest hit') ||
    lower.includes('blockbuster') ||
    lower.includes('top collection')
  ) {
    intent = 'hit_blockbuster';
  } else if (
    lower.includes('where to watch') ||
    lower.includes('ott') ||
    lower.includes('streaming') ||
    lower.includes('which platform')
  ) {
    intent = 'ott_availability';
  }

  return {
    intent,
    languageCode,
    languageName,
    year,
    explicitImdbRequested,
    rawQuery: q,
  };
}

function getRatingString(movie: Movie, preferImdb = false): { label: string; score: string; source: string } {
  const imdbRating = movie.ratings?.find((r) => r.source === 'IMDb');
  const tmdbRating = movie.ratings?.find((r) => r.source === 'TMDB');

  if (imdbRating && preferImdb) {
    return {
      label: `IMDb ${imdbRating.score}/10`,
      score: `${imdbRating.score}/10`,
      source: 'IMDb Verified',
    };
  }

  if (imdbRating) {
    return {
      label: `IMDb ${imdbRating.score}/10`,
      score: `${imdbRating.score}/10`,
      source: 'IMDb Verified',
    };
  }

  if (tmdbRating) {
    return {
      label: `TMDB ${tmdbRating.score}/10`,
      score: `${tmdbRating.score}/10`,
      source: 'TMDB Community Rating',
    };
  }

  if (movie.sourceVoteAverage) {
    return {
      label: `TMDB ${movie.sourceVoteAverage.toFixed(1)}/10`,
      score: `${movie.sourceVoteAverage.toFixed(1)}/10`,
      source: 'TMDB v3 API',
    };
  }

  return {
    label: 'Rating unrecorded',
    score: 'N/A',
    source: 'Unverified',
  };
}

export async function processChatQuery(userQuery: string): Promise<ChatAnswerResult> {
  const parsed = parseQuery(userQuery);
  const nowIso = new Date().toISOString();

  // 1. INTENT: FLOP / UNDERPERFORMER
  if (parsed.intent === 'flop_underperformer') {
    // If asking about 2026:
    if (parsed.year === 2026) {
      const langText = parsed.languageName ? `${parsed.languageName} cinema` : 'Indian cinema';
      return {
        answer: `Reliable commercial flop data for ${langText} in 2026 is currently unavailable.`,
        evidence: {
          source: 'Trade Audit Standard',
          metric: 'Theatrical distribution recovery audit',
          verifiedAt: nowIso,
        },
      };
    }

    // Look in verified benchmark records for commercial underperformers
    let candidates = VERIFIED_INDIAN_MOVIES.filter(
      (m) =>
        m.boxOffice &&
        (m.boxOffice.reportedStatus === 'Commercial Underperformer' ||
          m.boxOffice.reportedStatus === 'Underperformed' ||
          (m.boxOffice.budgetCrore &&
            m.boxOffice.worldwideGrossCrore &&
            m.boxOffice.worldwideGrossCrore < m.boxOffice.budgetCrore))
    );

    if (parsed.languageCode) {
      candidates = candidates.filter(
        (m) => m.originalLanguage.toLowerCase() === parsed.languageCode?.toLowerCase()
      );
    }
    if (parsed.year) {
      candidates = candidates.filter((m) => m.year === parsed.year);
    }

    if (candidates.length > 0) {
      const flop = candidates[0];
      const bo = flop.boxOffice!;
      const classification = bo.reportedStatus || 'Commercial underperformer';
      const budgetNote = bo.budgetCrore ? ` (Budget: ₹${bo.budgetCrore} Cr vs Worldwide Gross: ₹${bo.worldwideGrossCrore} Cr)` : '';
      return {
        answer: `${flop.title} (${flop.year}) — ${classification}${budgetNote}.`,
        evidence: {
          movieTitle: flop.title,
          source: bo.sourceName || 'Trade Aggregate & Box Office India',
          metric: 'Theatrical box-office recovery deficit',
          verifiedAt: flop.retrievedAt || nowIso,
        },
        movieId: flop.id,
        relatedMovie: flop,
      };
    }

    return {
      answer: 'Reliable data is currently unavailable.',
      evidence: {
        source: 'Trade Verification Registry',
        metric: 'Commercial performance audit',
        verifiedAt: nowIso,
      },
    };
  }

  // 2. INTENT: HIGHEST RATED
  if (parsed.intent === 'highest_rated') {
    let pool: Movie[] = [...VERIFIED_INDIAN_MOVIES];

    if (parsed.languageCode) {
      pool = pool.filter(
        (m) => m.originalLanguage.toLowerCase() === parsed.languageCode?.toLowerCase()
      );
    }
    if (parsed.year) {
      pool = pool.filter((m) => m.year === parsed.year);
    }

    // If explicit year 2026 and pool has no rated records, query live TMDB discover
    if (parsed.year === 2026 && isTmdbConfigured()) {
      try {
        const liveRes = await discoverIndianMovies({
          language: parsed.languageCode,
          year: 2026,
          sortBy: 'vote_average.desc',
        });
        const liveWithVotes = liveRes.movies.filter(
          (m) => (m.sourceVoteCount || 0) >= 5 && m.sourceVoteAverage
        );
        if (liveWithVotes.length > 0) {
          const topLive = liveWithVotes[0];
          return {
            answer: `${topLive.title} — TMDB ${topLive.sourceVoteAverage?.toFixed(1)}/10. (Note: IMDb verified score pending for 2026 releases).`,
            evidence: {
              movieTitle: topLive.title,
              source: 'TMDB v3 API (IN)',
              metric: 'Vote average',
              verifiedAt: nowIso,
            },
            movieId: topLive.id,
            relatedMovie: topLive,
          };
        } else if (parsed.explicitImdbRequested) {
          const langText = parsed.languageName ? `in ${parsed.languageName} cinema` : 'in Indian cinema';
          return {
            answer: `Reliable IMDb rating data for 2026 ${langText} is currently unavailable.`,
            evidence: {
              source: 'Authorised Rating Aggregators',
              metric: 'Audited IMDb vote threshold',
              verifiedAt: nowIso,
            },
          };
        }
      } catch (err) {
        console.error('Discover error for highest rated:', err);
      }
    }

    if (pool.length > 0) {
      // Find highest rating (IMDb preferred if explicit or available)
      const sorted = [...pool].sort((a, b) => {
        const aScore =
          a.ratings?.find((r) => r.source === 'IMDb')?.score || a.sourceVoteAverage || 0;
        const bScore =
          b.ratings?.find((r) => r.source === 'IMDb')?.score || b.sourceVoteAverage || 0;
        return bScore - aScore;
      });

      const top = sorted[0];
      const ratingInfo = getRatingString(top, parsed.explicitImdbRequested);
      return {
        answer: `${top.title} — ${ratingInfo.label}.`,
        evidence: {
          movieTitle: top.title,
          source: ratingInfo.source,
          metric: 'Audience / Review rating',
          verifiedAt: top.retrievedAt || nowIso,
        },
        movieId: top.id,
        relatedMovie: top,
      };
    }

    return {
      answer: 'Reliable data is currently unavailable.',
      evidence: {
        source: 'IndCine Database',
        metric: 'Rating index',
        verifiedAt: nowIso,
      },
    };
  }

  // 3. INTENT: BOOMING / TRENDING NOW
  if (parsed.intent === 'booming_trending') {
    // 1. Check live TMDB trending
    const trending = await getTrendingIndianMovies('day');
    let candidateList = trending.movies;

    if (parsed.languageCode) {
      candidateList = candidateList.filter(
        (m) => m.originalLanguage.toLowerCase() === parsed.languageCode?.toLowerCase()
      );
    }

    // If live trending has matching candidates:
    if (candidateList.length > 0) {
      const topTrending = candidateList[0];
      const ratingInfo = getRatingString(topTrending, parsed.explicitImdbRequested);
      const isImdb = ratingInfo.label.includes('IMDb');
      const ratingLabel = isImdb ? ratingInfo.label : `${ratingInfo.label} (TMDB)`;

      return {
        answer: `${topTrending.title} — ${ratingLabel}.`,
        evidence: {
          movieTitle: topTrending.title,
          source: 'TMDB v3 Trending API (India Region)',
          metric: 'Day trending rank #1',
          verifiedAt: topTrending.retrievedAt || nowIso,
        },
        movieId: topTrending.id,
        relatedMovie: topTrending,
      };
    }

    // 2. Fallback to observation store momentum
    const movements = getTrendMovements('day');
    const rising = movements.movements.filter(
      (m) =>
        m.status === 'Rising' &&
        (!parsed.languageCode || m.originalLanguage.toLowerCase() === parsed.languageCode)
    );

    if (rising.length > 0) {
      const topRising = rising[0];
      const matched = VERIFIED_INDIAN_MOVIES.find((m) => m.id === topRising.movieId);
      if (matched) {
        const ratingInfo = getRatingString(matched, parsed.explicitImdbRequested);
        return {
          answer: `${matched.title} — ${ratingInfo.label}.`,
          evidence: {
            movieTitle: matched.title,
            source: topRising.source,
            metric: `Movement delta ${topRising.rankDelta ? `+${topRising.rankDelta}` : 'Rising'}`,
            verifiedAt: topRising.lastObservedAt,
          },
          movieId: matched.id,
          relatedMovie: matched,
        };
      }
    }

    // 3. Benchmark trending fallback for specified language
    const benchmarkMatches = VERIFIED_INDIAN_MOVIES.filter(
      (m) =>
        m.isTrending &&
        (!parsed.languageCode || m.originalLanguage.toLowerCase() === parsed.languageCode)
    );

    if (benchmarkMatches.length > 0) {
      const match = benchmarkMatches[0];
      const ratingInfo = getRatingString(match, parsed.explicitImdbRequested);
      return {
        answer: `${match.title} — ${ratingInfo.label}.`,
        evidence: {
          movieTitle: match.title,
          source: 'IndCine Verified Benchmark Cohort',
          metric: 'Public interest trend benchmark',
          verifiedAt: match.retrievedAt || nowIso,
        },
        movieId: match.id,
        relatedMovie: match,
      };
    }

    const langLabel = parsed.languageName ? `for ${parsed.languageName} cinema` : 'in Indian cinema';
    return {
      answer: `Reliable current trend data ${langLabel} is currently unavailable.`,
      evidence: {
        source: 'Observation Pipeline',
        metric: 'Multi-snapshot trend verification',
        verifiedAt: nowIso,
      },
    };
  }

  // 4. INTENT: OTT / WHERE TO WATCH
  if (parsed.intent === 'ott_availability') {
    let targetMovie: Movie | null = null;
    const queryLower = userQuery.toLowerCase();

    // Check direct match against verified catalog
    for (const bm of VERIFIED_INDIAN_MOVIES) {
      if (
        queryLower.includes(bm.title.toLowerCase()) ||
        (bm.originalTitle && queryLower.includes(bm.originalTitle.toLowerCase()))
      ) {
        targetMovie = bm;
        break;
      }
    }

    if (!targetMovie) {
      const cleanQ = userQuery
        .replace(
          /where to watch|how to watch|can i watch|where can i stream|ott|streaming|watch|on netflix|on hotstar|on prime|stream|in india|online|available/gi,
          ''
        )
        .trim();
      if (cleanQ.length > 2) {
        const searchRes = await searchIndianMovies(cleanQ);
        if (searchRes.movies.length > 0) {
          targetMovie = searchRes.movies[0];
          if (isTmdbConfigured()) {
            const details = await getIndianMovieDetails(targetMovie.id);
            if (details) targetMovie = details;
          }
        }
      }
    }

    if (targetMovie) {
      // If movie has verified providers
      if (targetMovie.verifiedOttProviders && targetMovie.verifiedOttProviders.length > 0) {
        const platforms = targetMovie.verifiedOttProviders.map((p) => p.providerName).join(', ');
        return {
          answer: `${targetMovie.title} — Streaming on ${platforms} in India.`,
          evidence: {
            movieTitle: targetMovie.title,
            source: 'JustWatch via TMDB Watch Providers (IN)',
            metric: 'Authorized streaming license',
            verifiedAt: targetMovie.retrievedAt || nowIso,
          },
          movieId: targetMovie.id,
          relatedMovie: targetMovie,
        };
      } else {
        return {
          answer: `${targetMovie.title} — No confirmed Indian streaming rights recorded.`,
          evidence: {
            movieTitle: targetMovie.title,
            source: 'JustWatch via TMDB Watch Providers (IN)',
            metric: 'Catalogue verification',
            verifiedAt: targetMovie.retrievedAt || nowIso,
          },
          movieId: targetMovie.id,
          relatedMovie: targetMovie,
        };
      }
    }
  }

  // 5. INTENT: HIT / BLOCKBUSTER
  if (parsed.intent === 'hit_blockbuster') {
    let pool = VERIFIED_INDIAN_MOVIES.filter((m) => m.boxOffice && m.boxOffice.worldwideGrossCrore);
    if (parsed.languageCode) {
      pool = pool.filter((m) => m.originalLanguage.toLowerCase() === parsed.languageCode);
    }
    if (parsed.year) {
      pool = pool.filter((m) => m.year === parsed.year);
    }

    if (pool.length > 0) {
      const top = [...pool].sort(
        (a, b) => (b.boxOffice?.worldwideGrossCrore || 0) - (a.boxOffice?.worldwideGrossCrore || 0)
      )[0];
      const bo = top.boxOffice!;
      return {
        answer: `${top.title} (${top.year}) — ₹${bo.worldwideGrossCrore} Cr Worldwide Gross (${bo.reportedStatus}).`,
        evidence: {
          movieTitle: top.title,
          source: bo.sourceName,
          metric: 'Worldwide Gross (INR Crores)',
          verifiedAt: top.retrievedAt || nowIso,
        },
        movieId: top.id,
        relatedMovie: top,
      };
    }
  }

  // 6. SPECIFIC TITLE OR NATURAL LANGUAGE SYNTHESIS WITH GEMINI
  // Try to find a matching movie first
  const searchMatch = await searchIndianMovies(userQuery);
  const candidateMovie = searchMatch.movies.length > 0 ? searchMatch.movies[0] : null;

  // If a candidate movie is found, get its details
  let richMovie: Movie | null = candidateMovie;
  if (candidateMovie && isTmdbConfigured()) {
    const details = await getIndianMovieDetails(candidateMovie.id);
    if (details) richMovie = details;
  }

  // Use Gemini to produce an ultra-concise, answer-only response using strict ground truth facts
  const factSheet = richMovie
    ? `Title: ${richMovie.title} (${richMovie.year})
Language: ${richMovie.language} (${richMovie.industry || 'India'})
Ratings: ${richMovie.ratings?.map((r) => `${r.source}: ${r.score}/${r.maxScore}`).join(', ') || `TMDB: ${richMovie.sourceVoteAverage || 'N/A'}/10`}
Box Office: ${richMovie.boxOffice ? `Worldwide Gross: ₹${richMovie.boxOffice.worldwideGrossCrore} Cr, India Net: ₹${richMovie.boxOffice.indiaNetCrore || 'N/A'} Cr, Budget: ₹${richMovie.boxOffice.budgetCrore || 'N/A'} Cr, Status: ${richMovie.boxOffice.reportedStatus}` : 'No verified financial reporting'}
OTT Providers (India): ${richMovie.verifiedOttProviders?.map((p) => p.providerName).join(', ') || 'No confirmed streaming provider'}
Reception: Critic Consensus: ${richMovie.reception?.criticConsensus || 'N/A'}; Audience Score: ${richMovie.reception?.audienceScore || 'N/A'}%`
    : `No specific movie matched in catalogue. Available verified benchmark titles: ${VERIFIED_INDIAN_MOVIES.map((m) => m.title).join(', ')}.`;

  const prompt = `You are IndCine AI, an ultra-concise Indian cinema intelligence assistant.
Answer the user's exact question using ONLY the verified facts below.

STRICT CONSTRAINTS:
1. Provide ONLY the direct, concise answer.
2. Default format: ONE short sentence or ONE compact result.
3. DO NOT include greetings, introductions, explanations, paragraphs, or follow-up questions.
4. If asked about a movie's rating, respond with: "[Title] — [IMDb/TMDB rating]". Never confuse IMDb and TMDB.
5. If the requested information is absent or cannot be verified from the facts, respond EXACTLY: "Reliable data is currently unavailable."

VERIFIED FACTS:
${factSheet}

USER QUESTION:
${userQuery}

CONCISE ANSWER:`;

  const geminiRes = await generateContentWithRetry(prompt, 6000);

  if (geminiRes.ok && geminiRes.text.trim()) {
    let cleanText = geminiRes.text.trim().replace(/^["']|["']$/g, '');
    // Ensure brevity: if it generated more than 2 sentences, keep only the first sentence
    const sentences = cleanText.split(/(?<=[.!?])\s+/);
    if (sentences.length > 2) {
      cleanText = sentences.slice(0, 2).join(' ');
    }

    return {
      answer: cleanText,
      evidence: richMovie
        ? {
            movieTitle: richMovie.title,
            source: richMovie.dataSource || 'TMDB v3 API & JustWatch India',
            metric: 'Verified movie metadata',
            verifiedAt: nowIso,
          }
        : undefined,
      movieId: richMovie?.id,
      relatedMovie: richMovie || undefined,
    };
  }

  // Deterministic fallback if Gemini is offline
  if (richMovie) {
    const rInfo = getRatingString(richMovie);
    return {
      answer: `${richMovie.title} (${richMovie.year}) — ${rInfo.label}.`,
      evidence: {
        movieTitle: richMovie.title,
        source: richMovie.dataSource,
        metric: 'Verified catalogue profile',
        verifiedAt: richMovie.retrievedAt || nowIso,
      },
      movieId: richMovie.id,
      relatedMovie: richMovie,
    };
  }

  return {
    answer: 'Reliable data is currently unavailable.',
    evidence: {
      source: 'IndCine AIOS Registry',
      metric: 'Source verification search',
      verifiedAt: nowIso,
    },
  };
}
