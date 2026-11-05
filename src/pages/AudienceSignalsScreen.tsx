import React from 'react';
import { Movie, RouteId } from '../types/aios';

interface AudienceSignalsScreenProps {
  movies: Movie[];
  onSelectMovie: (movie: Movie) => void;
  onNavigate: (route: RouteId) => void;
}

export const AudienceSignalsScreen: React.FC<AudienceSignalsScreenProps> = ({
  movies,
  onSelectMovie,
}) => {
  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <div>
        <h1 className="font-bold text-[22px] md:text-[26px] font-display text-white tracking-tight">
          Audience Lens
        </h1>
        <p className="text-[11px] text-[#8996a6] mt-0.5">
          Separated analysis of audience reception, critical consensus, praise clusters, and complaint themes.
        </p>
      </div>

      <div className="border border-[#ff365d]/30 bg-[#ff365d]/[0.05] rounded-[12px] p-4 text-[11px] text-[#c1c8d2] leading-relaxed">
        <b className="text-[#ff8197] font-bold">Methodological Separation:</b> IndCine never combines critic ratings and audience exit responses into an unexplained single score. Sample sizes and publication citations are always preserved.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {movies.slice(0, 6).map((movie) => (
          <article
            key={movie.id}
            onClick={() => onSelectMovie(movie)}
            className="bg-gradient-to-br from-[#171c26] to-[#11151d] border border-[#2c3745] hover:border-[#ff365d]/50 rounded-[14px] p-5 cursor-pointer transition-colors flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div>
                  <h3 className="font-bold text-[14px] font-display text-white">{movie.title}</h3>
                  <span className="text-[10px] text-[#8996a6] font-mono">
                    {movie.language} • {movie.year} • {movie.director}
                  </span>
                </div>
                <div className="flex gap-2">
                  {movie.reception.audienceScore && (
                    <span className="bg-[#51d6c2]/15 text-[#51d6c2] border border-[#51d6c2]/30 font-mono text-[10px] font-bold px-2 py-1 rounded-[5px]">
                      {movie.reception.audienceScore}% Audience
                    </span>
                  )}
                  {movie.reception.criticScore && (
                    <span className="bg-[#ff365d]/15 text-[#ff8197] border border-[#ff365d]/30 font-mono text-[10px] font-bold px-2 py-1 rounded-[5px]">
                      {movie.reception.criticScore}% Critic
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-3 mt-4 text-[11px]">
                <div>
                  <strong className="text-[#ff8197] text-[10px] font-mono uppercase block mb-1">
                    Critic Review Consensus:
                  </strong>
                  <p className="text-[#c1c8d2] leading-relaxed">
                    {movie.reception.criticConsensus}
                  </p>
                </div>

                <div>
                  <strong className="text-[#51d6c2] text-[10px] font-mono uppercase block mb-1">
                    Audience Feedback:
                  </strong>
                  <p className="text-[#c1c8d2] leading-relaxed">
                    {movie.reception.audienceConsensus}
                  </p>
                </div>

                {movie.reception.praiseThemes.length > 0 && (
                  <div>
                    <span className="text-[#8996a6] text-[9px] font-mono block mb-1">Praise Themes:</span>
                    <div className="flex gap-1.5 flex-wrap">
                      {movie.reception.praiseThemes.map((t, idx) => (
                        <span key={idx} className="bg-[#51d6c2]/10 text-[#51d6c2] border border-[#51d6c2]/20 text-[9px] px-2 py-0.5 rounded-[4px]">
                          ✓ {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/10 flex justify-between items-center text-[9px] text-[#8996a6] font-mono">
              <span>SOURCE: {movie.reception.sourceName}</span>
              <span className="text-[#ff8197]">Click to inspect profile →</span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};
