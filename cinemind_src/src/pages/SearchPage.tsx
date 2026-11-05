import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw, Search } from 'lucide-react';
import {
  Movie,
  ReleasePeriodPreset,
  TmdbCountry,
  TmdbLanguage,
} from '../types/aios';
import { MovieCard } from '../components/movie/MovieCard';
import { safeFetchJson } from '../utils/safeFetchJson';

interface SearchPageProps {
  onSelectMovie: (movie: Movie) => void;
}

const GENRE_OPTIONS = [
  { id: '', label: 'All Genres' },
  { id: '28', label: 'Action' },
  { id: '12', label: 'Adventure' },
  { id: '16', label: 'Animation' },
  { id: '35', label: 'Comedy' },
  { id: '80', label: 'Crime' },
  { id: '99', label: 'Documentary' },
  { id: '18', label: 'Drama' },
  { id: '10751', label: 'Family' },
  { id: '14', label: 'Fantasy' },
  { id: '36', label: 'History' },
  { id: '27', label: 'Horror' },
  { id: '9648', label: 'Mystery' },
  { id: '10749', label: 'Romance' },
  { id: '878', label: 'Sci-Fi' },
  { id: '53', label: 'Thriller' },
  { id: '10752', label: 'War' },
];

const FEATURED_LANGUAGES: TmdbLanguage[] = [
  { iso_639_1: 'ta', english_name: 'Tamil', name: 'தமிழ்' },
  { iso_639_1: 'te', english_name: 'Telugu', name: 'తెలుగు' },
  { iso_639_1: 'ml', english_name: 'Malayalam', name: 'മലയാളം' },
  { iso_639_1: 'kn', english_name: 'Kannada', name: 'ಕನ್ನಡ' },
  { iso_639_1: 'hi', english_name: 'Hindi', name: 'हिन्दी' },
  { iso_639_1: 'bn', english_name: 'Bengali', name: 'বাংলা' },
  { iso_639_1: 'en', english_name: 'English', name: 'English' },
  { iso_639_1: 'ko', english_name: 'Korean', name: '한국어' },
  { iso_639_1: 'ja', english_name: 'Japanese', name: '日本語' },
  { iso_639_1: 'zh', english_name: 'Chinese', name: '中文' },
  { iso_639_1: 'fr', english_name: 'French', name: 'Français' },
  { iso_639_1: 'es', english_name: 'Spanish', name: 'Español' },
  { iso_639_1: 'de', english_name: 'German', name: 'Deutsch' },
  { iso_639_1: 'it', english_name: 'Italian', name: 'Italiano' },
  { iso_639_1: 'ar', english_name: 'Arabic', name: 'العربية' },
];

export const SearchPage: React.FC<SearchPageProps> = ({ onSelectMovie }) => {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [language, setLanguage] = useState('');
  const [region, setRegion] = useState('');
  const [genreId, setGenreId] = useState('');
  const [releasePeriod, setReleasePeriod] = useState<ReleasePeriodPreset>('any');
  const [specificYear, setSpecificYear] = useState('');
  const [maxRuntime, setMaxRuntime] = useState('');
  const [sortBy, setSortBy] = useState('popularity.desc');

  const [languages, setLanguages] = useState<TmdbLanguage[]>(FEATURED_LANGUAGES);
  const [countries, setCountries] = useState<TmdbCountry[]>([]);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    safeFetchJson<{ languages?: TmdbLanguage[] }>('/api/movies/languages')
      .then((data) => {
        if (Array.isArray(data.languages) && data.languages.length > 0) {
          setLanguages(data.languages);
        }
      })
      .catch(() => {});

    safeFetchJson<{ countries?: TmdbCountry[] }>('/api/movies/countries')
      .then((data) => {
        if (Array.isArray(data.countries)) {
          setCountries(data.countries);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    const params = new URLSearchParams({
      page: String(page),
      sortBy,
    });
    if (debouncedQuery.trim()) params.set('q', debouncedQuery.trim());
    if (language) params.set('language', language);
    if (region) params.set('region', region);
    if (genreId) params.set('genres', genreId);
    if (releasePeriod !== 'any') params.set('releasePeriod', releasePeriod);
    if (releasePeriod === 'specific_year' && specificYear) {
      params.set('year', specificYear);
    }
    if (maxRuntime) params.set('maxRuntime', maxRuntime);

    safeFetchJson(`/api/movies/discover?${params.toString()}`)
      .then((data) => {
        if (cancelled) return;
        if (data.error) {
          setError(data.error);
          setMovies([]);
        } else {
          setMovies(Array.isArray(data.movies) ? data.movies : []);
          setTotalPages(data.totalPages || 1);
          setTotalResults(data.totalResults || 0);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Discovery failed.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    debouncedQuery,
    language,
    region,
    genreId,
    releasePeriod,
    specificYear,
    maxRuntime,
    sortBy,
    page,
  ]);

  const handleResetFilters = () => {
    setQuery('');
    setDebouncedQuery('');
    setLanguage('');
    setRegion('');
    setGenreId('');
    setReleasePeriod('any');
    setSpecificYear('');
    setMaxRuntime('');
    setSortBy('popularity.desc');
    setPage(1);
  };

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-display text-[#e4e1e9]">
              Global Discovery Matrix
            </h1>
            <p className="text-sm text-[#e5bdbe]/80 mt-1">
              Worldwide TMDB discovery with strict original-language, genre, release-period, and runtime filters.
            </p>
          </div>
          <button
            type="button"
            onClick={handleResetFilters}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2a292f] hover:bg-[#35343a] text-xs font-medium text-[#e5bdbe] cursor-pointer self-start sm:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Clear Filters
          </button>
        </div>

        <div className="relative">
          <Search className="w-5 h-5 text-[#ac8889] absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by movie title (e.g., Interstellar, Vikram, Parasite, Spirited Away)..."
            className="w-full bg-[#1b1b20] border border-[#5c3f40]/40 focus:border-[#e11d48] rounded-xl pl-12 pr-4 py-3.5 text-sm text-[#e4e1e9] placeholder-[#ac8889] outline-none transition-colors"
          />
        </div>

        {/* Structured Discovery Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 bg-[#1b1b20] p-4 rounded-xl border border-[#5c3f40]/25">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#ac8889] mb-1">
              Original Language
            </label>
            <select
              value={language}
              onChange={(e) => {
                setLanguage(e.target.value);
                setPage(1);
              }}
              className="w-full bg-[#0e0e13] border border-[#5c3f40]/40 rounded-lg px-2.5 py-2 text-xs text-[#e4e1e9] outline-none focus:border-[#e11d48]"
            >
              <option value="">All Languages (Worldwide)</option>
              {languages.map((l) => (
                <option key={l.iso_639_1} value={l.iso_639_1}>
                  {l.english_name} ({l.iso_639_1})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#ac8889] mb-1">
              Genre
            </label>
            <select
              value={genreId}
              onChange={(e) => {
                setGenreId(e.target.value);
                setPage(1);
              }}
              className="w-full bg-[#0e0e13] border border-[#5c3f40]/40 rounded-lg px-2.5 py-2 text-xs text-[#e4e1e9] outline-none focus:border-[#e11d48]"
            >
              {GENRE_OPTIONS.map((g) => (
                <option key={g.id || 'all'} value={g.id}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#ac8889] mb-1">
              Release Period
            </label>
            <select
              value={releasePeriod}
              onChange={(e) => {
                const val = e.target.value as ReleasePeriodPreset;
                setReleasePeriod(val);
                if (val === 'specific_year' && !specificYear) {
                  setSpecificYear('2025');
                }
                setPage(1);
              }}
              className="w-full bg-[#0e0e13] border border-[#5c3f40]/40 rounded-lg px-2.5 py-2 text-xs text-[#e4e1e9] outline-none focus:border-[#e11d48]"
            >
              <option value="any">Any Period</option>
              <option value="today">Today</option>
              <option value="this_week">This Week</option>
              <option value="this_month">Recent (Last 30 Days)</option>
              <option value="this_year">This Year</option>
              <option value="specific_year">Specific Year</option>
              <option value="classics">Classics (Pre-2006)</option>
            </select>
          </div>

          {releasePeriod === 'specific_year' ? (
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#ac8889] mb-1">
                Year
              </label>
              <input
                type="number"
                min="1900"
                max="2030"
                value={specificYear}
                onChange={(e) => {
                  setSpecificYear(e.target.value);
                  setPage(1);
                }}
                placeholder="e.g. 2025"
                className="w-full bg-[#0e0e13] border border-[#5c3f40]/40 rounded-lg px-2.5 py-2 text-xs text-[#e4e1e9] outline-none focus:border-[#e11d48]"
              />
            </div>
          ) : (
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#ac8889] mb-1">
                Max Runtime
              </label>
              <select
                value={maxRuntime}
                onChange={(e) => {
                  setMaxRuntime(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-[#0e0e13] border border-[#5c3f40]/40 rounded-lg px-2.5 py-2 text-xs text-[#e4e1e9] outline-none focus:border-[#e11d48]"
              >
                <option value="">Any Runtime</option>
                <option value="90">Under 90 mins</option>
                <option value="120">Under 2 hours (120m)</option>
                <option value="150">Under 150 mins</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#ac8889] mb-1">
              Release Region
            </label>
            <select
              value={region}
              onChange={(e) => {
                setRegion(e.target.value);
                setPage(1);
              }}
              className="w-full bg-[#0e0e13] border border-[#5c3f40]/40 rounded-lg px-2.5 py-2 text-xs text-[#e4e1e9] outline-none focus:border-[#e11d48]"
            >
              <option value="">Worldwide</option>
              {countries.map((c) => (
                <option key={c.iso_3166_1} value={c.iso_3166_1}>
                  {c.english_name} ({c.iso_3166_1})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#ac8889] mb-1">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              className="w-full bg-[#0e0e13] border border-[#5c3f40]/40 rounded-lg px-2.5 py-2 text-xs text-[#e4e1e9] outline-none focus:border-[#e11d48]"
            >
              <option value="popularity.desc">TMDB Popularity</option>
              <option value="vote_average.desc">Highest Rated</option>
              <option value="primary_release_date.desc">Newest Releases</option>
              <option value="vote_count.desc">Most Voted</option>
            </select>
          </div>
        </div>
      </section>

      {error && (
        <div className="bg-[#93000a]/30 border border-[#ffb4ab]/40 rounded-xl p-4 text-xs text-[#ffb4ab]">
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
      ) : movies.length === 0 ? (
        <div className="bg-[#1b1b20] rounded-2xl p-10 text-center border border-[#5c3f40]/25 space-y-2">
          <p className="text-base font-semibold text-[#e4e1e9]">
            No matching films found
          </p>
          <p className="text-xs text-[#ac8889]">
            Strict filter enforcement is active — try adjusting your language, genre, or release-period filters.
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between text-xs text-[#ac8889] font-mono-tabular">
            <span>{totalResults.toLocaleString()} results on TMDB</span>
            <span>
              Page {page} of {totalPages}
            </span>
          </div>

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
                {page} / {totalPages}
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
    </div>
  );
};
