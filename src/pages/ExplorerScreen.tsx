import React, { useEffect, useState } from 'react';
import { MovieCard } from '../components/movie/MovieCard';
import { Movie, RouteId } from '../types/aios';
import { safeFetchJson } from '../utils/safeFetchJson';

interface ExplorerScreenProps {
  onSelectMovie: (movie: Movie) => void;
  onNavigate: (route: RouteId) => void;
}

const INDIAN_LANGUAGES = [
  { code: 'all', label: 'All Industries' },
  { code: 'ta', label: 'Tamil (Kollywood)' },
  { code: 'te', label: 'Telugu (Tollywood)' },
  { code: 'ml', label: 'Malayalam (Mollywood)' },
  { code: 'kn', label: 'Kannada (Sandalwood)' },
  { code: 'hi', label: 'Hindi (Bollywood)' },
  { code: 'bn', label: 'Bengali' },
  { code: 'mr', label: 'Marathi' },
  { code: 'pa', label: 'Punjabi' },
];

export const ExplorerScreen: React.FC<ExplorerScreenProps> = ({ onSelectMovie }) => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [selectedLang, setSelectedLang] = useState('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMovies = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = '/api/movies/discover';
      const params = new URLSearchParams();

      if (searchQuery.trim()) {
        url = '/api/movies/search';
        params.set('q', searchQuery.trim());
      } else {
        if (selectedLang !== 'all') {
          params.set('language', selectedLang);
        }
        if (selectedYear !== 'all') {
          params.set('year', selectedYear);
        }
      }

      const queryString = params.toString();
      const fullUrl = queryString ? `${url}?${queryString}` : url;

      const res = await safeFetchJson<{ movies?: Movie[]; total?: number }>(fullUrl);
      if (Array.isArray(res.movies)) {
        setMovies(res.movies);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to retrieve Indian cinema records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, [selectedLang, selectedYear]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMovies();
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Header & Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-bold text-[22px] md:text-[26px] font-display text-white tracking-tight">
            Film Explorer
          </h1>
          <p className="text-[11px] text-[#8996a6] mt-0.5">
            Browse verified Indian cinema releases with strict language boundary isolation.
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full md:w-[340px]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search title, director, star..."
            className="flex-1 bg-[#111720] border border-[#29313e] focus:border-[#ff365d] rounded-[9px] px-3 py-2 text-[12px] text-white outline-none placeholder-[#5f6c7e]"
          />
          <button
            type="submit"
            className="bg-[#ff365d] hover:bg-[#e02047] text-white px-4 py-2 rounded-[9px] text-[11px] font-bold cursor-pointer transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {/* Language Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-none">
        {INDIAN_LANGUAGES.map((lang) => {
          const isSelected = selectedLang === lang.code;
          return (
            <button
              key={lang.code}
              onClick={() => {
                setSelectedLang(lang.code);
                setSearchQuery('');
              }}
              className={`px-3 py-1.5 rounded-[8px] text-[11px] font-medium whitespace-nowrap cursor-pointer transition-all ${
                isSelected
                  ? 'bg-[#ff365d] text-white font-semibold shadow-[0_2px_12px_rgba(255,54,93,0.3)]'
                  : 'bg-[#111720] border border-[#29313e] text-[#b5bdc9] hover:text-white hover:border-[#ff365d]/50'
              }`}
            >
              {lang.label}
            </button>
          );
        })}
      </div>

      {/* Secondary Year filter */}
      <div className="flex items-center gap-3 text-[11px] text-[#8996a6]">
        <span>Filter by Year:</span>
        {['all', '2024', '2023', '2022', '2021'].map((yr) => (
          <button
            key={yr}
            onClick={() => setSelectedYear(yr)}
            className={`px-2 py-0.5 rounded-[6px] font-mono cursor-pointer transition-colors ${
              selectedYear === yr
                ? 'bg-white/15 text-[#f4bd62] font-bold'
                : 'text-[#8996a6] hover:text-white'
            }`}
          >
            {yr === 'all' ? 'All Years' : yr}
          </button>
        ))}
      </div>

      {/* Loading & Error States */}
      {loading && (
        <div className="p-12 text-center text-[#8996a6] font-mono text-[12px]">
          Retrieving verified Indian cinema metadata...
        </div>
      )}

      {error && (
        <div className="border border-[#ff365d]/40 bg-[#ff365d]/10 text-[#ff8197] p-4 rounded-[12px] text-[11px]">
          {error}
        </div>
      )}

      {/* Movies Grid */}
      {!loading && movies.length === 0 && (
        <div className="border border-[#29313e] bg-[#111720] p-12 rounded-[15px] text-center text-[#8996a6] text-[12px]">
          No Indian cinema records found for the selected filter combination.
          <br />
          <span className="text-[10px] text-[#5f6c7e] mt-2 block font-mono">
            Strict policy: IndCine never broadens explicit language filters without user request.
          </span>
        </div>
      )}

      {!loading && movies.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {movies.map((movie, idx) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              rank={idx + 1}
              onSelect={onSelectMovie}
            />
          ))}
        </div>
      )}
    </div>
  );
};
