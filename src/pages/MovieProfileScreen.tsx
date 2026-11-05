import React from 'react';
import { Movie, RouteId } from '../types/aios';

interface MovieProfileScreenProps {
  movie: Movie | null;
  onBack: () => void;
  onNavigate: (route: RouteId) => void;
  onRunAnalystQuery: (query: string) => void;
}

export const MovieProfileScreen: React.FC<MovieProfileScreenProps> = ({
  movie,
  onBack,
  onNavigate,
  onRunAnalystQuery,
}) => {
  if (!movie) {
    return (
      <div className="border border-[#29313e] bg-[#111720] p-12 rounded-[15px] text-center font-sans">
        <h3 className="font-bold text-[16px] text-white font-display">No movie selected</h3>
        <p className="text-[11px] text-[#8996a6] mt-2">
          Select a title from India Pulse or Film Explorer to view its full intelligence dossier.
        </p>
        <button
          onClick={() => onNavigate('explorer')}
          className="mt-4 bg-[#ff365d] hover:bg-[#e02047] text-white px-4 py-2 rounded-[8px] text-[11px] font-bold cursor-pointer transition-colors"
        >
          Open Film Explorer
        </button>
      </div>
    );
  }

  const bo = movie.boxOffice;

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Top back bar & Analyst launch */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[11px] text-[#ff8197] hover:text-[#ff365d] font-mono cursor-pointer transition-colors"
        >
          <span>←</span> Back to previous view
        </button>

        <button
          onClick={() => onRunAnalystQuery(`Analyse commercial performance and audience consensus for ${movie.title}`)}
          className="border border-[#ff365d]/40 bg-[#ff365d]/15 hover:bg-[#ff365d]/25 text-[#ff8197] px-3.5 py-1.5 rounded-[8px] text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
        >
          <span>✧</span> Ask AIOS Command Desk about {movie.title}
        </button>
      </div>

      {/* Hero Movie Banner */}
      <section className="relative overflow-hidden rounded-[19px] border border-[#29313e] bg-gradient-to-br from-[#171c26] to-[#11151d] p-6 md:p-8 flex flex-col md:flex-row gap-6 md:gap-8 shadow-[0_15px_40px_rgba(0,0,0,0.3)]">
        {/* Poster */}
        <div className="w-full md:w-[220px] h-[310px] rounded-[13px] overflow-hidden border border-white/10 shrink-0 bg-[#090b10] shadow-xl relative">
          {movie.posterUrl ? (
            <img
              src={movie.posterUrl}
              alt={movie.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full p-4 flex items-end font-extrabold text-[20px] font-display text-white bg-gradient-to-br from-[#572333] to-[#171b27]">
              {movie.title}
            </div>
          )}
        </div>

        {/* Identity & Metadata */}
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-mono text-[#f4bd62] uppercase tracking-wider mb-2">
              <span>{movie.industry || 'INDIAN CINEMA'}</span>
              <span>•</span>
              <span>{movie.language}</span>
              <span>•</span>
              <span>{movie.year}</span>
              <span>•</span>
              <span>{movie.certification}</span>
              {movie.provenance === 'curated_benchmark' && (
                <>
                  <span>•</span>
                  <span className="text-[#51d6c2]">BENCHMARK COHORT</span>
                </>
              )}
            </div>

            <h1 className="font-extrabold text-[28px] md:text-[36px] font-display text-white tracking-tight leading-tight">
              {movie.title}
            </h1>
            {movie.originalTitle && movie.originalTitle !== movie.title && (
              <div className="text-[12px] text-[#8996a6] font-mono mt-0.5">
                Original Title: {movie.originalTitle}
              </div>
            )}

            <p className="text-[13px] text-[#c1c8d2] leading-[1.8] mt-3.5 max-w-[760px]">
              {movie.synopsis}
            </p>

            <div className="flex gap-2 flex-wrap mt-4">
              {movie.genres.map((g) => (
                <span
                  key={g}
                  className="bg-[#111720] border border-[#29313e] text-[#d2d9e2] text-[10px] px-2.5 py-1 rounded-[6px]"
                >
                  {g}
                </span>
              ))}
              {movie.runtimeMinutes > 0 && (
                <span className="bg-[#111720] border border-[#29313e] text-[#d2d9e2] text-[10px] px-2.5 py-1 rounded-[6px] font-mono">
                  {movie.runtimeMinutes} min
                </span>
              )}
            </div>
          </div>

          {/* Credits */}
          <div className="mt-5 pt-4 border-t border-white/10 flex flex-wrap gap-x-6 gap-y-2 text-[11px]">
            <div>
              <span className="text-[#8996a6]">Director: </span>
              <strong className="text-white">{movie.director}</strong>
            </div>
            {movie.cast.length > 0 && (
              <div>
                <span className="text-[#8996a6]">Key Cast: </span>
                <span className="text-[#d2d9e2]">
                  {movie.cast.map((c) => c.name).join(', ')}
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Grid: Verified OTT Availability & Theatrical Box Office */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Verified India OTT Availability */}
        <article className="bg-gradient-to-br from-[#171c26] to-[#11151d] border border-[#2c3745] rounded-[14px] p-5">
          <div className="flex items-center justify-between mb-3">
            <strong className="font-bold text-[13px] font-display text-white">
              Verified India OTT Availability
            </strong>
            <span className="text-[9px] font-mono text-[#51d6c2] border border-[#51d6c2]/30 bg-[#51d6c2]/10 px-2 py-0.5 rounded-[4px]">
              JUSTWATCH CERTIFIED
            </span>
          </div>

          {movie.verifiedOttProviders.length > 0 ? (
            <div className="space-y-2.5 mt-3">
              {movie.verifiedOttProviders.map((p, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-[9px] bg-[#0b1017] border border-[#29313e]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-[8px] bg-[#1a2330] grid place-items-center text-[12px] font-bold text-white font-display">
                      {p.providerName[0]}
                    </div>
                    <div>
                      <strong className="block text-[12px] text-white">{p.providerName}</strong>
                      <span className="text-[9px] font-mono text-[#51d6c2] uppercase">
                        {p.category} · Territory: India (IN)
                      </span>
                    </div>
                  </div>

                  {p.link && (
                    <a
                      href={p.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-[#ff8197] hover:text-[#ff365d] border border-[#ff365d]/30 px-2.5 py-1 rounded-[6px]"
                    >
                      Stream ↗
                    </a>
                  )}
                </div>
              ))}
              <p className="text-[9px] text-[#8996a6] mt-2 font-mono">
                Attribution: Watch provider availability powered by JustWatch via TMDB API v3. Search fallback URLs are isolated and excluded.
              </p>
            </div>
          ) : (
            <div className="p-6 rounded-[9px] bg-[#0b1017] border border-[#29313e] text-center text-[#8996a6] text-[11px]">
              No confirmed streaming rights recorded in India for this title.
              <span className="block text-[10px] text-[#5f6c7e] mt-1 font-mono">
                Awaiting authorized provider license or theatrical-only windowing.
              </span>
            </div>
          )}
        </article>

        {/* Theatrical Box Office */}
        <article className="bg-gradient-to-br from-[#171c26] to-[#11151d] border border-[#2c3745] rounded-[14px] p-5">
          <div className="flex items-center justify-between mb-3">
            <strong className="font-bold text-[13px] font-display text-white">
              Reported Theatrical Performance
            </strong>
            <span className="text-[9px] font-mono text-[#f4bd62] border border-[#f4bd62]/30 bg-[#f4bd62]/10 px-2 py-0.5 rounded-[4px]">
              INR CRORES (₹)
            </span>
          </div>

          {bo ? (
            <div className="space-y-3 mt-3">
              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-[#0b1017] p-3 rounded-[9px] border border-[#29313e]">
                  <span className="text-[10px] text-[#8996a6] block font-mono">Worldwide Gross</span>
                  <b className="text-[17px] font-mono text-[#f4bd62]">
                    {bo.worldwideGrossCrore ? `₹${bo.worldwideGrossCrore} Cr` : 'Undisclosed'}
                  </b>
                </div>
                <div className="bg-[#0b1017] p-3 rounded-[9px] border border-[#29313e]">
                  <span className="text-[10px] text-[#8996a6] block font-mono">India Domestic Net</span>
                  <b className="text-[17px] font-mono text-white">
                    {bo.indiaNetCrore ? `₹${bo.indiaNetCrore} Cr` : '—'}
                  </b>
                </div>
                <div className="bg-[#0b1017] p-3 rounded-[9px] border border-[#29313e]">
                  <span className="text-[10px] text-[#8996a6] block font-mono">Estimated Budget</span>
                  <b className="text-[17px] font-mono text-[#d2d9e2]">
                    {bo.budgetCrore ? `₹${bo.budgetCrore} Cr` : '—'}
                  </b>
                </div>
                <div className="bg-[#0b1017] p-3 rounded-[9px] border border-[#29313e]">
                  <span className="text-[10px] text-[#8996a6] block font-mono">Classification</span>
                  <b className="text-[13px] font-display text-[#51d6c2] truncate block mt-0.5">
                    {bo.reportedStatus}
                  </b>
                </div>
              </div>

              <div className="text-[10px] text-[#a1aab8] bg-[#0b1017] p-3 rounded-[8px] border border-[#29313e] leading-relaxed">
                <b className="text-white">Methodology Note:</b> {bo.methodologyNote}
                <br />
                <span className="text-[#8996a6] font-mono text-[9px]">Source: {bo.sourceName}</span>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-[9px] bg-[#0b1017] border border-[#29313e] text-center text-[#8996a6] text-[11px]">
              Financial performance awaiting authenticated trade reporting.
              <span className="block text-[10px] text-[#5f6c7e] mt-1 font-mono">
                IndCine policy: Profit and commercial verdicts are never inferred without verified budget & share disclosures.
              </span>
            </div>
          )}
        </article>
      </div>

      {/* Disaggregated Audience vs Critic Consensus */}
      <section className="bg-gradient-to-br from-[#171c26] to-[#11151d] border border-[#2c3745] rounded-[14px] p-5">
        <h3 className="font-bold text-[14px] font-display text-white mb-4">
          Separated Reception Intelligence
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Critic Consensus */}
          <div className="bg-[#0b1017] p-4 rounded-[10px] border border-[#29313e]">
            <div className="flex items-center justify-between mb-2">
              <strong className="text-[12px] font-display text-[#ff8197]">Critic Consensus</strong>
              {movie.reception.criticScore && (
                <span className="text-[11px] font-mono font-bold text-[#ff8197]">
                  {movie.reception.criticScore}% Approval
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#c1c8d2] leading-relaxed">
              {movie.reception.criticConsensus}
            </p>
            {movie.reception.criticismThemes.length > 0 && (
              <div className="mt-3">
                <span className="text-[9px] font-mono text-[#8996a6] block mb-1">Critique Themes:</span>
                <div className="flex gap-1.5 flex-wrap">
                  {movie.reception.criticismThemes.map((t, idx) => (
                    <span key={idx} className="text-[9px] bg-[#f4bd62]/10 text-[#f4bd62] border border-[#f4bd62]/30 px-2 py-0.5 rounded-[4px]">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Audience Consensus */}
          <div className="bg-[#0b1017] p-4 rounded-[10px] border border-[#29313e]">
            <div className="flex items-center justify-between mb-2">
              <strong className="text-[12px] font-display text-[#51d6c2]">Audience Reception</strong>
              {movie.reception.audienceScore && (
                <span className="text-[11px] font-mono font-bold text-[#51d6c2]">
                  {movie.reception.audienceScore}% Positive
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#c1c8d2] leading-relaxed">
              {movie.reception.audienceConsensus}
            </p>
            {movie.reception.praiseThemes.length > 0 && (
              <div className="mt-3">
                <span className="text-[9px] font-mono text-[#8996a6] block mb-1">Praise Clusters:</span>
                <div className="flex gap-1.5 flex-wrap">
                  {movie.reception.praiseThemes.map((t, idx) => (
                    <span key={idx} className="text-[9px] bg-[#51d6c2]/10 text-[#51d6c2] border border-[#51d6c2]/30 px-2 py-0.5 rounded-[4px]">
                      ✓ {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Sourced Evidence Trail */}
      <section className="bg-[#0b1017] border border-[#29313e] rounded-[12px] p-4 text-[10px] text-[#8996a6] space-y-1 font-mono">
        <div className="text-[#d2d9e2] text-[11px] font-bold font-sans">Evidence Verification Audit Trail:</div>
        <div>• Data Source: {movie.dataSource} ({movie.provenance.toUpperCase()})</div>
        <div>• Confidence Classification: {movie.evidenceConfidence}</div>
        <div>• Retrieved: {movie.retrievedAt}</div>
      </section>
    </div>
  );
};
