import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Globe2,
  Newspaper,
  Sparkles,
} from 'lucide-react';
import {
  AgentRegistryEntry,
  Movie,
  RouteId,
  TrendMovementItem,
} from '../types/aios';
import { MovieCard } from '../components/movie/MovieCard';
import { safeFetchJson } from '../utils/safeFetchJson';

interface HomePageProps {
  agents: AgentRegistryEntry[];
  onMoviesLoaded: (movies: Movie[]) => void;
  onSelectMovie: (movie: Movie) => void;
  onNavigate: (route: RouteId) => void;
}

type FeedMode =
  | 'trending_day'
  | 'trending_week'
  | 'recent'
  | 'upcoming'
  | 'audience_favourites';

const WORLD_SPOTLIGHTS = [
  { code: '', label: 'Worldwide' },
  { code: 'ta', label: 'Tamil' },
  { code: 'te', label: 'Telugu' },
  { code: 'ml', label: 'Malayalam' },
  { code: 'kn', label: 'Kannada' },
  { code: 'hi', label: 'Hindi' },
  { code: 'ko', label: 'Korean' },
  { code: 'ja', label: 'Japanese' },
  { code: 'fr', label: 'French' },
  { code: 'es', label: 'Spanish' },
  { code: 'de', label: 'German' },
];

export const HomePage: React.FC<HomePageProps> = ({
  agents,
  onMoviesLoaded,
  onSelectMovie,
  onNavigate,
}) => {
  const [feedMode, setFeedMode] = useState<FeedMode>('trending_day');
  const [spotlightLang, setSpotlightLang] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sourceLabel, setSourceLabel] = useState('TMDB Trending — Daily');
  const [retrievedAt, setRetrievedAt] = useState<string>('');
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tmdbConfigured, setTmdbConfigured] = useState(true);

  const [trendMovements, setTrendMovements] = useState<TrendMovementItem[]>([]);
  const [hasTrendHistory, setHasTrendHistory] = useState(false);
  const [trendDisclosure, setTrendDisclosure] = useState(
    'Session-only observation cache (resets when server restarts).'
  );

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    let url = `/api/movies/trending/day?page=${page}`;
    if (spotlightLang) {
      url = `/api/movies/discover?language=${encodeURIComponent(
        spotlightLang
      )}&sortBy=popularity.desc&page=${page}`;
    } else if (feedMode === 'trending_day') {
      url = `/api/movies/trending/day?page=${page}`;
    } else if (feedMode === 'trending_week') {
      url = `/api/movies/trending/week?page=${page}`;
    } else if (feedMode === 'recent') {
      url = `/api/movies/recent?page=${page}`;
    } else if (feedMode === 'upcoming') {
      url = `/api/movies/upcoming?page=${page}`;
    } else if (feedMode === 'audience_favourites') {
      url = `/api/movies/discover?sortBy=vote_average.desc&minVotes=500&page=${page}`;
    }

    safeFetchJson(url)
      .then((data) => {
        if (cancelled) return;
        setTmdbConfigured(data.configured !== false);
        if (data.error) {
          setError(data.error);
          setMovies([]);
        } else {
          const list = Array.isArray(data.movies) ? data.movies : [];
          setMovies(list);
          setTotalPages(data.totalPages || 1);
          setSourceLabel(data.source || 'TMDB API v3');
          setRetrievedAt(data.retrievedAt || new Date().toISOString());
          onMoviesLoaded(list);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load movies.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [feedMode, spotlightLang, page, onMoviesLoaded]);

  useEffect(() => {
    const windowParam = feedMode === 'trending_week' ? 'week' : 'day';
    safeFetchJson<{
      hasSufficientHistory?: boolean;
      disclosure?: string;
      movements?: TrendMovementItem[];
    }>(`/api/trends/observations?window=${windowParam}`)
      .then((data) => {
        setHasTrendHistory(Boolean(data.hasSufficientHistory));
        if (data.disclosure) setTrendDisclosure(data.disclosure);
        if (Array.isArray(data.movements)) {
          setTrendMovements(data.movements);
        }
      })
      .catch(() => {});
  }, [feedMode, movies]);

  const activeAgentsCount = agents.filter((a) => a.phaseStatus === 'active').length;
  const risingMovies = trendMovements.filter((m) => m.status === 'Rising').slice(0, 4);
  const fallingMovies = trendMovements.filter((m) => m.status === 'Falling').slice(0, 4);

  return (
    <div className="space-y-12">
      {/* Hero Banner */}
      <section className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#1b1b20] via-[#131318] to-[#0e0e13] border border-[#5c3f40]/30 p-7 md:p-12">
        <div className="max-w-3xl space-y-5">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#ffb95f]">
            <Globe2 className="w-4 h-4" />
            <span>Global Movie Intelligence Operating System</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold font-display tracking-tight text-[#e4e1e9] leading-[1.1]">
            Discover. Understand.{' '}
            <span className="text-[#e11d48]">Decide.</span> Watch.
          </h1>
          <p className="text-base text-[#e5bdbe]/85 leading-relaxed max-w-2xl">
            Every movie lover. Every language. Every film industry. Explore live worldwide
            trending charts, strict original-language discovery, and transparent multi-agent
            AIOS reasoning.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => onNavigate('quick-pick')}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#e11d48] to-[#be123c] text-[#fffaf9] text-sm font-semibold shadow-lg hover:brightness-110 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              Launch Quick Pick AIOS
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onNavigate('search')}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#2a292f] hover:bg-[#35343a] text-[#e4e1e9] text-sm font-semibold border border-[#5c3f40]/40 transition-colors cursor-pointer"
            >
              Global Discovery Matrix
            </button>
          </div>
        </div>
      </section>

      {/* Section A: Global Cinema Pulse */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#1b1b20] rounded-2xl p-4 border border-[#5c3f40]/25">
          <p className="text-[11px] uppercase tracking-wider text-[#ac8889]">
            Active Source
          </p>
          <p className="text-sm font-bold text-[#e4e1e9] mt-1 truncate">{sourceLabel}</p>
          <p className="text-[11px] text-[#ac8889] mt-1 font-mono-tabular">
            {retrievedAt ? new Date(retrievedAt).toLocaleTimeString() : 'Live'}
          </p>
        </div>
        <div className="bg-[#1b1b20] rounded-2xl p-4 border border-[#5c3f40]/25">
          <p className="text-[11px] uppercase tracking-wider text-[#ac8889]">
            Geographic Scope
          </p>
          <p className="text-sm font-bold text-[#e4e1e9] mt-1">
            {spotlightLang
              ? WORLD_SPOTLIGHTS.find((s) => s.code === spotlightLang)?.label ||
                spotlightLang.toUpperCase()
              : 'Worldwide'}
          </p>
          <p className="text-[11px] text-[#ac8889] mt-1">Strict original-language</p>
        </div>
        <div className="bg-[#1b1b20] rounded-2xl p-4 border border-[#5c3f40]/25">
          <p className="text-[11px] uppercase tracking-wider text-[#ac8889]">
            AIOS Active Agents
          </p>
          <p className="text-sm font-bold text-[#ffb95f] mt-1 font-mono-tabular">
            {activeAgentsCount} Active / {agents.length} Registered
          </p>
          <p className="text-[11px] text-[#ac8889] mt-1">Dynamic task routing</p>
        </div>
        <div className="bg-[#1b1b20] rounded-2xl p-4 border border-[#5c3f40]/25">
          <p className="text-[11px] uppercase tracking-wider text-[#ac8889]">
            Trend Observations
          </p>
          <p className="text-sm font-bold text-[#e4e1e9] mt-1">
            {hasTrendHistory ? `${trendMovements.length} Tracked` : 'Insufficient History'}
          </p>
          <p className="text-[11px] text-[#ac8889] mt-1">Session-only cache</p>
        </div>
      </section>

      {/* Section C: Explore World Cinema (Language Spotlights) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold font-display text-[#e4e1e9]">
            Explore World Cinema
          </h2>
          <span className="text-xs text-[#ac8889]">
            Dynamic TMDB original-language filters
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {WORLD_SPOTLIGHTS.map((item) => {
            const active = spotlightLang === item.code;
            return (
              <button
                key={item.code || 'world'}
                type="button"
                onClick={() => {
                  setSpotlightLang(item.code);
                  setPage(1);
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#e11d48] text-[#fffaf9]'
                    : 'bg-[#1b1b20] text-[#e5bdbe] border border-[#5c3f40]/30 hover:border-[#e11d48]/60'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Section B, D, E, F: Global Trending & Discovery Feed */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#5c3f40]/25 pb-4">
          <div>
            <h2 className="text-2xl font-bold font-display text-[#e4e1e9]">
              {spotlightLang
                ? `${
                    WORLD_SPOTLIGHTS.find((s) => s.code === spotlightLang)?.label ||
                    spotlightLang.toUpperCase()
                  } Cinema`
                : sourceLabel}
            </h2>
            <p className="text-xs text-[#ac8889] mt-0.5">
              Source: {sourceLabel} · {retrievedAt ? `Retrieved ${new Date(retrievedAt).toLocaleTimeString()}` : 'Live'}
            </p>
          </div>

          {!spotlightLang && (
            <div className="flex flex-wrap items-center gap-2">
              {(
                [
                  { id: 'trending_day', label: 'Trending Today' },
                  { id: 'trending_week', label: 'Trending Week' },
                  { id: 'recent', label: 'Recently Released' },
                  { id: 'upcoming', label: 'Upcoming' },
                  { id: 'audience_favourites', label: 'Audience Favourites' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setFeedMode(tab.id);
                    setPage(1);
                  }}
                  className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    feedMode === tab.id
                      ? 'bg-[#e11d48] text-[#fffaf9]'
                      : 'bg-[#1b1b20] text-[#e5bdbe]/80 hover:text-[#e4e1e9]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {!tmdbConfigured && (
          <div className="bg-[#2a292f] border border-[#ee9800]/50 rounded-2xl p-6 flex items-start gap-4">
            <AlertTriangle className="w-6 h-6 text-[#ffb95f] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-[#ffb95f]">
                TMDB API Key Required for Live Movie Data
              </h3>
              <p className="text-xs text-[#e5bdbe]/90 leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        {tmdbConfigured && error && (
          <div className="bg-[#93000a]/30 border border-[#ffb4ab]/40 rounded-2xl p-5 text-xs text-[#ffb4ab]">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {Array.from({ length: 10 }).map((_, idx) => (
              <div
                key={idx}
                className="aspect-[2/3] rounded-2xl bg-[#1b1b20] animate-pulse border border-[#5c3f40]/20"
              />
            ))}
          </div>
        ) : movies.length === 0 && !error ? (
          <div className="bg-[#1b1b20] rounded-2xl p-10 text-center border border-[#5c3f40]/25">
            <p className="text-sm text-[#ac8889]">No movies found for this selection.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
              {movies.map((movie) => (
                <MovieCard key={movie.id} movie={movie} onSelect={onSelectMovie} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 pt-4">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-[#1b1b20] border border-[#5c3f40]/40 text-xs font-semibold text-[#e4e1e9] disabled:opacity-40 hover:border-[#e11d48] cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                <span className="text-xs font-mono-tabular text-[#ac8889]">
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-[#1b1b20] border border-[#5c3f40]/40 text-xs font-semibold text-[#e4e1e9] disabled:opacity-40 hover:border-[#e11d48] cursor-pointer"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* Rising & Falling Worldwide (Honest Observation Foundation) */}
      <section className="bg-[#1b1b20] rounded-2xl p-6 border border-[#5c3f40]/25 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#ffb95f]" />
            <h2 className="text-lg font-bold font-display text-[#e4e1e9]">
              Rising & Falling Worldwide
            </h2>
          </div>
          <span className="text-[11px] text-[#ac8889]">{trendDisclosure}</span>
        </div>

        {!hasTrendHistory ? (
          <p className="text-xs text-[#ac8889] py-3">
            Historical observations are not yet sufficient to calculate this trend.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#0e0e13] rounded-xl p-4 border border-[#5c3f40]/20 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <ArrowUpRight className="w-4 h-4" />
                Rising
              </h3>
              {risingMovies.length === 0 ? (
                <p className="text-xs text-[#ac8889]">No rising movement observed yet.</p>
              ) : (
                risingMovies.map((m) => (
                  <div
                    key={m.movieId}
                    className="flex items-center justify-between text-xs text-[#e4e1e9]"
                  >
                    <span className="truncate">{m.title}</span>
                    <span className="font-mono-tabular text-emerald-400">
                      #{m.currentRank} ({m.percentageChange !== null ? `${m.percentageChange}%` : '—'})
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="bg-[#0e0e13] rounded-xl p-4 border border-[#5c3f40]/20 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#ffb4ab] flex items-center gap-1.5">
                <ArrowDownRight className="w-4 h-4" />
                Falling
              </h3>
              {fallingMovies.length === 0 ? (
                <p className="text-xs text-[#ac8889]">No falling movement observed yet.</p>
              ) : (
                fallingMovies.map((m) => (
                  <div
                    key={m.movieId}
                    className="flex items-center justify-between text-xs text-[#e4e1e9]"
                  >
                    <span className="truncate">{m.title}</span>
                    <span className="font-mono-tabular text-[#ffb4ab]">
                      #{m.currentRank} ({m.percentageChange !== null ? `${m.percentageChange}%` : '—'})
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </section>

      {/* Section G: Global Cinema Stories (Honest Empty State) */}
      <section className="bg-[#1b1b20] rounded-2xl p-6 border border-[#5c3f40]/25 space-y-2">
        <div className="flex items-center gap-2">
          <Newspaper className="w-5 h-5 text-[#e11d48]" />
          <h2 className="text-lg font-bold font-display text-[#e4e1e9]">
            Global Cinema Stories
          </h2>
        </div>
        <p className="text-xs text-[#ac8889]">
          No external editorial or industry news feed is connected yet. CINEMIND never fabricates cinema headlines.
        </p>
      </section>

      {/* AIOS Agent Registry Strip */}
      <section className="bg-[#1b1b20] rounded-2xl p-6 border border-[#5c3f40]/25 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-[#ffb95f]" />
            <h2 className="text-lg font-bold font-display text-[#e4e1e9]">
              CINEMIND AIOS Agent Registry
            </h2>
          </div>
          <span className="text-xs font-mono-tabular text-[#ac8889]">
            {activeAgentsCount} Active · {agents.length - activeAgentsCount} Planned
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {agents.slice(0, 8).map((agent) => (
            <div
              key={agent.id}
              className="bg-[#0e0e13] rounded-xl p-4 border border-[#5c3f40]/20 flex flex-col justify-between gap-2"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[#e4e1e9] truncate">
                    {agent.name}
                  </span>
                  <span
                    className={`text-[10px] font-mono-tabular uppercase px-2 py-0.5 rounded shrink-0 ${
                      agent.phaseStatus === 'active'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-[#2a292f] text-[#ac8889]'
                    }`}
                  >
                    {agent.phaseStatus === 'active' ? 'Active' : 'Planned'}
                  </span>
                </div>
                <p className="text-xs text-[#ac8889] mt-2 leading-relaxed">
                  {agent.responsibility}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
