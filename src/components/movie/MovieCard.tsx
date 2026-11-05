import React from 'react';
import { Movie } from '../../types/aios';

interface MovieCardProps {
  movie: Movie;
  rank?: number;
  onSelect: (movie: Movie) => void;
  badgeLabel?: string;
}

export const MovieCard: React.FC<MovieCardProps> = ({
  movie,
  rank,
  onSelect,
  badgeLabel,
}) => {
  const rating = movie.ratings.find((r) => r.source === 'TMDB')?.score || movie.sourceVoteAverage;
  const topProvider = movie.verifiedOttProviders[0]?.providerName;
  const boxOfficeWorldwide = movie.boxOffice?.worldwideGrossCrore;

  const fallbackGradients = [
    'linear-gradient(145deg, #572333, #171b27 55%, #b57c45)',
    'linear-gradient(145deg, #174b56, #171b27 58%, #b47d43)',
    'linear-gradient(145deg, #563d20, #171b27 58%, #a52343)',
    'linear-gradient(145deg, #34204c, #171b27 58%, #247b73)',
  ];
  const bgGradient = fallbackGradients[(movie.id.charCodeAt(0) || 0) % fallbackGradients.length];

  return (
    <article
      onClick={() => onSelect(movie)}
      className="group relative overflow-hidden rounded-[14px] border border-[#2c3745] bg-gradient-to-br from-[#151b24] to-[#10151d] cursor-pointer transition-all duration-200 hover:border-[#ff365d]/60 hover:shadow-[0_8px_30px_rgba(255,54,93,0.18)] flex flex-col justify-between"
    >
      {/* Art / Poster Area */}
      <div
        className="h-[180px] relative flex items-end p-3.5 bg-cover bg-center overflow-hidden"
        style={{
          background: movie.posterUrl
            ? `url(${movie.posterUrl}) center/cover no-repeat`
            : bgGradient,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-[#07090d]/95 via-[#07090d]/40 to-transparent pointer-events-none" />
        <div className="absolute inset-[8px] border border-white/10 rounded-[8px] pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-10">
          <small className="font-mono text-[8px] bg-[#07090d]/85 text-[#e7ebf0] px-2 py-1 border border-white/20 rounded-[5px] uppercase">
            {rank ? `${String(rank).padStart(2, '0')} · ` : ''}
            {movie.language.toUpperCase()}
          </small>

          {badgeLabel && (
            <span className="font-mono text-[8px] font-bold bg-[#ff365d]/25 text-[#ff8197] border border-[#ff365d]/50 px-2 py-0.5 rounded-[5px] uppercase">
              {badgeLabel}
            </span>
          )}
        </div>

        {/* Fallback title if poster unavailable */}
        {!movie.posterUrl && (
          <span className="relative z-10 font-extrabold text-[20px] leading-tight font-display text-white tracking-tight drop-shadow-md">
            {movie.title}
          </span>
        )}
      </div>

      {/* Movie Details Info */}
      <div className="p-3 flex-1 flex flex-col justify-between">
        <div>
          <b className="font-bold text-[12px] font-display text-white truncate block group-hover:text-[#ff8197] transition-colors">
            {movie.title}
          </b>
          <p className="text-[9px] text-[#8996a6] my-1 truncate font-sans">
            {movie.language} • {movie.year || 'TBA'} • {movie.genres.slice(0, 2).join(', ')}
          </p>
        </div>

        {/* Tags */}
        <div className="flex gap-1.5 mt-2 flex-wrap">
          {rating ? (
            <span className="text-[8px] px-1.5 py-0.5 rounded-[4px] bg-[#51d6c2]/15 text-[#51d6c2] font-mono font-medium">
              ★ {rating.toFixed(1)} TMDB
            </span>
          ) : (
            <span className="text-[8px] px-1.5 py-0.5 rounded-[4px] bg-white/5 text-[#8996a6]">
              Unrated
            </span>
          )}

          {topProvider && (
            <span className="text-[8px] px-1.5 py-0.5 rounded-[4px] bg-[#1a2330] text-[#7ca9ff] border border-[#7ca9ff]/20 truncate max-w-[110px]">
              {topProvider}
            </span>
          )}

          {movie.boxOffice?.reportedStatus && (
            <span className="text-[8px] px-1.5 py-0.5 rounded-[4px] bg-[#f4bd62]/15 text-[#f4bd62]">
              {movie.boxOffice.reportedStatus}
            </span>
          )}

          {movie.provenance === 'curated_benchmark' && (
            <span className="text-[8px] px-1.5 py-0.5 rounded-[4px] bg-white/5 text-[#8996a6] font-mono">
              BENCHMARK
            </span>
          )}
        </div>
      </div>

      {/* Movie Footer */}
      <div className="px-3 py-2 border-t border-white/10 text-[#8b98a8] font-mono text-[9px] flex items-center justify-between bg-[#0e1218]">
        <span className="truncate max-w-[130px]">{movie.director || 'Indian Cinema'}</span>
        <span className="text-[#f4bd62] font-bold">
          {boxOfficeWorldwide
            ? `₹${boxOfficeWorldwide} Cr`
            : movie.verifiedOttProviders.length > 0
            ? 'Verified OTT'
            : 'Audited'}
        </span>
      </div>
    </article>
  );
};
