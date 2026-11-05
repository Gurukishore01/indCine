import React from 'react';
import { Film, Star } from 'lucide-react';
import { Movie } from '../../types/aios';

interface MovieCardProps {
  movie: Movie;
  matchScore?: number;
  onSelect: (movie: Movie) => void;
}

export const MovieCard: React.FC<MovieCardProps> = ({
  movie,
  matchScore,
  onSelect,
}) => {
  const primaryRating = movie.ratings[0];

  return (
    <article
      onClick={() => onSelect(movie)}
      className="group bg-[#1b1b20] rounded-2xl overflow-hidden border border-[#5c3f40]/25 hover:border-[#e11d48]/60 transition-all duration-200 hover:-translate-y-1 flex flex-col cursor-pointer"
    >
      {/* 2:3 Cinematic Poster Frame */}
      <div className="relative aspect-[2/3] w-full bg-[#0e0e13] overflow-hidden">
        {movie.posterUrl ? (
          <img
            src={movie.posterUrl}
            alt={movie.title}
            referrerPolicy="no-referrer"
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div
            className={`w-full h-full bg-gradient-to-br ${movie.posterGradient} p-4 flex flex-col items-center justify-center text-center gap-2`}
          >
            <Film className="w-8 h-8 text-[#ac8889]" />
            <span className="text-xs text-[#ac8889]">No Poster</span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e13] via-transparent to-black/30 pointer-events-none" />

        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between text-xs font-mono-tabular">
          <span className="px-2 py-0.5 rounded bg-black/75 text-[#e4e1e9] font-semibold">
            {movie.year || 'TBA'}
          </span>
          {matchScore !== undefined && (
            <span className="px-2 py-0.5 rounded bg-[#ee9800] text-[#2a1700] font-bold">
              {matchScore}% Match
            </span>
          )}
        </div>

        <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-xs">
          <span className="text-[#e5bdbe] font-medium truncate">
            {movie.language}
          </span>
          {primaryRating && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-black/75 text-[#ffb95f] font-mono-tabular font-semibold">
              <Star className="w-3 h-3 fill-current" />
              {primaryRating.score.toFixed(1)}
            </span>
          )}
        </div>
      </div>

      {/* Unboxed Metadata */}
      <div className="p-3.5 flex flex-col gap-1 flex-1 justify-between">
        <div>
          <h3 className="text-base font-semibold text-[#e4e1e9] group-hover:text-[#ffb3b6] transition-colors truncate">
            {movie.title}
          </h3>
          <p className="text-xs text-[#ac8889] mt-0.5 truncate">
            {movie.runtimeMinutes > 0 ? `${movie.runtimeMinutes}m · ` : ''}
            {movie.genres.slice(0, 2).join(' / ')}
          </p>
        </div>
      </div>
    </article>
  );
};
