import {
  AgentResult,
  MoodConstraints,
  Movie,
  RecommendationItem,
  ScoreBreakdown,
} from '../../../src/types/aios';

export async function runRecommendationAgent(
  candidates: Movie[],
  constraints: MoodConstraints
): Promise<AgentResult<RecommendationItem>> {
  const start = Date.now();
  const retrievedAt = new Date().toISOString();

  const scored: RecommendationItem[] = candidates.map((movie) => {
    // 1. Mood & Genre Fit (40%)
    let moodGenreFit = 60;
    if (constraints.mood) {
      const moodKeyword = constraints.mood.toLowerCase().split(' ')[0];
      const moodMatch =
        movie.moodTags.some((t) => t.toLowerCase().includes(moodKeyword)) ||
        movie.synopsis.toLowerCase().includes(moodKeyword);
      moodGenreFit = moodMatch ? 95 : 55;
    }
    if (constraints.genre && constraints.genre !== 'All Genres') {
      const genreMatch = movie.genres.some((g) =>
        g.toLowerCase().includes(constraints.genre!.toLowerCase())
      );
      moodGenreFit = Math.min(
        100,
        Math.round((moodGenreFit + (genreMatch ? 100 : 40)) / 2)
      );
    }

    // 2. Language & Runtime Fit (30%)
    let languageRuntimeFit = 85;
    if (constraints.language && constraints.language !== 'All Languages') {
      languageRuntimeFit =
        movie.language.toLowerCase() === constraints.language.toLowerCase() ? 100 : 30;
    }
    if (
      constraints.maxRuntimeMinutes &&
      constraints.maxRuntimeMinutes > 0 &&
      movie.runtimeMinutes > 0
    ) {
      const diff = movie.runtimeMinutes - constraints.maxRuntimeMinutes;
      const runtimeScore = diff <= 0 ? 100 : Math.max(35, 100 - diff * 1.5);
      languageRuntimeFit = Math.round((languageRuntimeFit + runtimeScore) / 2);
    }

    // 3. Rating Quality (30%) — uses actual TMDB user rating + vote-count reliability
    const primaryRating = movie.ratings[0];
    const voteCount = movie.sourceVoteCount || 0;
    let ratingQuality = 50; // neutral baseline when unrated
    if (primaryRating && primaryRating.maxScore > 0) {
      const rawPct = (primaryRating.score / primaryRating.maxScore) * 100;
      const reliabilityWeight = Math.min(1, voteCount / 100);
      ratingQuality = Math.round(rawPct * reliabilityWeight + 50 * (1 - reliabilityWeight));
    }

    const matchScore = Math.round(
      moodGenreFit * 0.4 + languageRuntimeFit * 0.3 + ratingQuality * 0.3
    );

    const scoreBreakdown: ScoreBreakdown = {
      moodGenreFit,
      languageRuntimeFit,
      ratingQuality,
      trendSignal: 0,
      criticSentiment: 0,
    };

    const reasons: string[] = [];
    if (constraints.mood) {
      reasons.push(
        `CINEMIND Fit (${matchScore}%): Genre/mood alignment across ${movie.genres.join(', ')}.`
      );
    } else {
      reasons.push(
        `CINEMIND Fit (${matchScore}%): Matches ${movie.genres.join(', ')} in ${movie.language}.`
      );
    }

    if (primaryRating) {
      reasons.push(
        `${primaryRating.source} User Rating: ${primaryRating.score.toFixed(1)}/${
          primaryRating.maxScore
        } (${voteCount.toLocaleString()} votes).`
      );
    } else {
      reasons.push('TMDB User Rating: Not enough votes yet.');
    }

    const reviewInsight = primaryRating
      ? `Rated ${primaryRating.score.toFixed(1)}/10 by ${voteCount.toLocaleString()} TMDB users. Critic review data unavailable.`
      : 'No TMDB user rating consensus available yet. Critic review data unavailable.';

    return {
      movie,
      matchScore,
      scoreBreakdown,
      reasons,
      reviewInsight,
      availabilityNote: 'Catalog search links available (verified regional OTT not connected).',
    };
  });

  scored.sort((a, b) => b.matchScore - a.matchScore);

  return {
    agent: 'RecommendationAgent',
    status: scored.length > 0 ? 'completed' : 'partial',
    summary: `Computed transparent CINEMIND Fit Scores for ${scored.length} candidate(s) using genre, language, runtime, and TMDB user ratings.`,
    items: scored.slice(0, 6),
    evidence: [],
    warnings: [],
    retrievedAt,
    durationMs: Date.now() - start,
  };
}
