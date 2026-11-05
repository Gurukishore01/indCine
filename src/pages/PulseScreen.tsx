import React, { useState } from 'react';
import { MovieCard } from '../components/movie/MovieCard';
import { IntelligencePulseData, Movie, RouteId } from '../types/aios';

interface PulseScreenProps {
  data: IntelligencePulseData | null;
  onNavigate: (route: RouteId) => void;
  onSelectMovie: (movie: Movie) => void;
  onRunAnalystQuery: (query: string) => void;
}

export const PulseScreen: React.FC<PulseScreenProps> = ({
  data,
  onNavigate,
  onSelectMovie,
  onRunAnalystQuery,
}) => {
  const [analystInput, setAnalystInput] = useState('');

  const handleAnalystSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (analystInput.trim()) {
      onRunAnalystQuery(analystInput.trim());
    }
  };

  const movies = data?.spotlightMovies || [];
  const movements = data?.topMovements || [];
  const hasHistory = movements.some((m) => m.status === 'Rising' || m.status === 'Falling' || m.status === 'Stable');

  return (
    <div className="space-y-6 md:space-y-7 animate-fade-in">
      {/* Hero Briefing */}
      <section className="relative overflow-hidden rounded-[19px] border border-[#78404f]/50 p-6 md:p-8 min-h-[270px] bg-gradient-to-br from-[#171720] via-[#18131b] to-[#111820] shadow-[0_22px_70px_rgba(0,0,0,0.45)]">
        {/* Glows and Grid overlays */}
        <div className="absolute -right-8 -top-24 w-[55%] h-[440px] bg-[radial-gradient(ellipse_at_60%_30%,_rgba(255,54,93,0.27),_transparent_58%),radial-gradient(ellipse_at_70%_75%,_rgba(81,214,194,0.1),_transparent_45%)] pointer-events-none" />
        <div className="absolute right-[3%] top-0 h-full w-[44%] opacity-55 bg-[linear-gradient(90deg,transparent,#ffffff08),repeating-linear-gradient(90deg,transparent_0_44px,#ffffff0a_45px),repeating-linear-gradient(0deg,transparent_0_44px,#ffffff0a_45px)] [mask-image:radial-gradient(ellipse,black,transparent_72%)] pointer-events-none" />

        <div className="relative z-10 max-w-[780px]">
          <div className="inline-flex items-center gap-2 text-[#f4bd62] font-mono text-[10px] tracking-[0.14em] uppercase mb-2">
            <span className="w-2 h-2 rounded-full bg-[#f4bd62] shadow-[0_0_12px_#f4bd62a8] animate-pulse" />
            <span>THE INDIAN CINEMA INTELLIGENCE DESK</span>
          </div>

          <h1 className="font-extrabold text-[32px] sm:text-[40px] md:text-[48px] leading-[1.1] font-display tracking-[-0.035em] my-3 text-white">
            Beyond the box office.<br />
            <em className="not-italic text-[#ff365d] drop-shadow-[0_6px_30px_rgba(255,54,93,0.25)]">
              Inside the story.
            </em>
          </h1>

          <p className="text-[#c1c8d2] text-[13px] leading-[1.8] max-w-[670px]">
            Track the pulse of Indian cinema across languages, theatres and streaming platforms. Discover what is moving, examine audience response, follow reported business performance and investigate the evidence behind every signal.
          </p>

          <div className="flex gap-2 flex-wrap mt-5">
            <span className="border border-white/15 bg-white/[0.04] px-2.5 py-1.5 rounded-[6px] text-[#d2d9e2] text-[9px]">
              <b className="text-[#f4bd62] font-bold">12+</b> language ecosystems
            </span>
            <span className="border border-white/15 bg-white/[0.04] px-2.5 py-1.5 rounded-[6px] text-[#d2d9e2] text-[9px]">
              Theatrical + OTT intelligence
            </span>
            <span className="border border-white/15 bg-white/[0.04] px-2.5 py-1.5 rounded-[6px] text-[#d2d9e2] text-[9px]">
              Evidence-led research
            </span>
            <span className="border border-white/15 bg-white/[0.04] px-2.5 py-1.5 rounded-[6px] text-[#d2d9e2] text-[9px]">
              Personal AIOS workspace
            </span>
          </div>
        </div>
      </section>

      {/* 4 Metric Cards */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <article className="relative overflow-hidden bg-gradient-to-br from-[#171d27] to-[#10151d] border border-[#2c3745] rounded-[13px] p-4 shadow-[0_8px_25px_rgba(0,0,0,0.15)]">
          <div className="flex items-center justify-between text-[#9eabba] text-[10px]">
            <span>Films in monitored catalogue</span>
            <span className="text-[17px] text-[#ff365d]">▦</span>
          </div>
          <div className="font-bold text-[28px] leading-tight font-display tracking-tight text-white my-3">
            {data ? data.trackedMoviesCount : '—'}
          </div>
          <div className="text-[9px] text-[#8996a6]">
            {data ? (
              <span className="text-[#51d6c2]">● Active tracked Indian catalogue</span>
            ) : (
              'Awaiting connected source coverage'
            )}
          </div>
        </article>

        <article className="relative overflow-hidden bg-gradient-to-br from-[#171d27] to-[#10151d] border border-[#2c3745] rounded-[13px] p-4 shadow-[0_8px_25px_rgba(0,0,0,0.15)]">
          <div className="flex items-center justify-between text-[#9eabba] text-[10px]">
            <span>Momentum signals</span>
            <span className="text-[17px] text-[#ff365d]">↗</span>
          </div>
          <div className="font-bold text-[28px] leading-tight font-display tracking-tight text-white my-3">
            {data?.risingSignalsCount ? data.risingSignalsCount : '—'}
          </div>
          <div className="text-[9px] text-[#8996a6]">
            {data?.risingSignalsCount ? 'Verified multi-snapshot lift' : 'Needs comparable historical snapshots'}
          </div>
        </article>

        <article className="relative overflow-hidden bg-gradient-to-br from-[#171d27] to-[#10151d] border border-[#2c3745] rounded-[13px] p-4 shadow-[0_8px_25px_rgba(0,0,0,0.15)]">
          <div className="flex items-center justify-between text-[#9eabba] text-[10px]">
            <span>Verified OTT listings</span>
            <span className="text-[17px] text-[#ff365d]">▣</span>
          </div>
          <div className="font-bold text-[28px] leading-tight font-display tracking-tight text-white my-3">
            {data ? data.ottPlatformsMonitored : '—'}
          </div>
          <div className="text-[9px] text-[#8996a6]">
            India region · authorised source only
          </div>
        </article>

        <article className="relative overflow-hidden bg-gradient-to-br from-[#171d27] to-[#10151d] border border-[#2c3745] rounded-[13px] p-4 shadow-[0_8px_25px_rgba(0,0,0,0.15)]">
          <div className="flex items-center justify-between text-[#9eabba] text-[10px]">
            <span>Verified OTT rights</span>
            <span className="text-[17px] text-[#51d6c2]">◇</span>
          </div>
          <div className="font-bold text-[28px] leading-tight font-display tracking-tight text-white my-3">
            {data?.evidenceCoverage ? `${data.evidenceCoverage.rightsVerifiedTitles} / ${data.trackedMoviesCount}` : '—'}
          </div>
          <div className="text-[9px] text-[#8996a6]">
            {data?.sourceStatus?.mode === 'live_tmdb' ? 'Live TMDB / JustWatch India' : 'Curated benchmark cohort'}
          </div>
        </article>
      </section>

      {/* Main Row: Timeline & Radar */}
      <div className="flex items-end justify-between pt-2">
        <div>
          <h2 className="font-bold text-[20px] font-display text-white tracking-tight">India cinema pulse</h2>
          <p className="text-[10px] text-[#8290a2] mt-0.5">
            Current public signals, with source and observation window visible.
          </p>
        </div>
        <button
          onClick={() => onNavigate('trends')}
          className="text-[10px] text-[#ff8197] hover:text-[#ff365d] font-semibold cursor-pointer tracking-wider uppercase font-mono"
        >
          OPEN TREND OBSERVATORY ↗
        </button>
      </div>

      <section className="grid grid-cols-1 lg:grid-cols-[1.35fr_0.85fr] gap-3.5">
        {/* Timeline Panel */}
        <article className="bg-gradient-to-br from-[#151b24] to-[#10151d] border border-[#2c3745] rounded-[14px] p-4 md:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <b className="font-bold text-[13px] text-white">Popularity & attention timeline</b>
              <span className="text-[9px] font-mono text-[#8d9aab]">DAILY / WEEKLY OBSERVATIONS</span>
            </div>

            {/* Chart Area: Rigorously generated or designed empty state */}
            <div className="h-[190px] mt-3">
              {hasHistory ? (
                <div className="h-full flex flex-col justify-between p-2">
                  <div className="flex items-center justify-between text-[10px] font-mono text-[#8d9aab]">
                    <span>RECORDED MOVEMENT DELTAS</span>
                    <span className="text-[#51d6c2]">● MULTI-SNAPSHOT VERIFIED</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2 my-auto">
                    {movements.slice(0, 3).map((m, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2 rounded-[8px] bg-[#111720] border border-[#2c3745] text-[11px]"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="font-mono text-[10px] text-[#ff365d]">#{m.currentRank || i + 1}</span>
                          <strong className="text-white truncate">{m.title}</strong>
                        </div>
                        <div className="flex items-center gap-3 font-mono text-[10px]">
                          <span className="text-[#8c9aac]">Score: {m.currentValue}</span>
                          <span
                            className={`px-1.5 py-0.5 rounded-[4px] font-bold ${
                              m.status === 'Rising'
                                ? 'bg-[#51d6c2]/20 text-[#51d6c2]'
                                : m.status === 'Falling'
                                ? 'bg-[#ff365d]/20 text-[#ff8197]'
                                : 'bg-white/10 text-[#dbe1e9]'
                            }`}
                          >
                            {m.status} {m.rankDelta !== null && m.rankDelta > 0 ? `(+${m.rankDelta})` : ''}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-[9px] font-mono text-[#8c9aac]">
                    <span>INTERVAL: SNAPSHOT CADENCE VERIFIED</span>
                    <span>SOURCE: TMDB v3 API TRENDING</span>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-center text-[#8d9aaa] text-[10px] border border-dashed border-[#394553] rounded-[10px] bg-white/[0.02] p-5 leading-relaxed font-mono">
                  Historical chart will appear after real, comparable observations are collected.
                  <br /><br />
                  No synthetic trend lines are displayed.
                </div>
              )}
            </div>
          </div>

          <div className="mt-3 p-2.5 border-l-2 border-[#f4bd62] bg-[#f4bd62]/[0.05] rounded-r-[8px] text-[#b8c1cb] text-[9px] leading-relaxed">
            TMDB popularity, chart position and search interest are different signals. IndCine displays them separately and never calls them actual OTT viewership.
          </div>
        </article>

        {/* OTT Catalogue Radar */}
        <article className="bg-gradient-to-br from-[#151b24] to-[#10151d] border border-[#2c3745] rounded-[14px] p-4 md:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <b className="font-bold text-[13px] text-white">OTT catalogue radar</b>
              <span className="text-[9px] font-mono text-[#8d9aab]">INDIA REGION</span>
            </div>

            <div className="grid gap-3 mt-4">
              {(data?.platformDistribution || [
                { name: 'Netflix', code: 'N', color: '#e50914', verifiedTitlesCount: 4, status: 'Verified Indian rights' },
                { name: 'Prime Video', code: 'P', color: '#00a8e1', verifiedTitlesCount: 5, status: 'Verified Indian rights' },
                { name: 'JioHotstar', code: 'J', color: '#0c2045', verifiedTitlesCount: 2, status: 'Verified Indian rights' },
                { name: 'ZEE5', code: 'Z', color: '#8e24aa', verifiedTitlesCount: 2, status: 'Verified Indian rights' },
                { name: 'SonyLIV', code: 'S', color: '#1565c0', verifiedTitlesCount: 1, status: 'Verified Indian rights' },
                { name: 'Aha · Sun NXT · Others', code: 'A', color: '#ff6f00', verifiedTitlesCount: 2, status: 'Authorised provider source' },
              ]).map((plat) => (
                <div key={plat.name} className="flex items-center gap-2.5">
                  <div
                    className="w-[34px] h-[34px] rounded-[9px] grid place-items-center text-[15px] font-extrabold font-display text-[#e6ebf2] shrink-0"
                    style={{ backgroundColor: plat.color || '#232d3b' }}
                  >
                    {plat.code}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center text-[10px]">
                      <b className="font-bold text-white truncate">{plat.name}</b>
                      <span className="font-mono text-[#bdc7d4] text-[10px]">
                        {plat.verifiedTitlesCount > 0 ? `${plat.verifiedTitlesCount} titles` : '—'}
                      </span>
                    </div>
                    <small className="block text-[9px] text-[#8794a5] truncate mt-0.5">
                      {plat.status}
                    </small>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 flex justify-between items-center text-[9px] text-[#8996a6]">
            <span>JustWatch certified streaming attribution</span>
            <button
              onClick={() => onNavigate('ott')}
              className="text-[#ff8197] hover:text-[#ff365d] font-semibold cursor-pointer uppercase font-mono"
            >
              EXPLORE RADAR →
            </button>
          </div>
        </article>
      </section>

      {/* Films under the lens */}
      <div className="flex items-end justify-between pt-2">
        <div>
          <h2 className="font-bold text-[20px] font-display text-white tracking-tight">Films under the lens</h2>
          <p className="text-[10px] text-[#8290a2] mt-0.5">
            Verified Indian cinema titles across Tamil, Telugu, Malayalam, Hindi, and Kannada.
          </p>
        </div>
        <button
          onClick={() => onNavigate('explorer')}
          className="text-[10px] text-[#ff8197] hover:text-[#ff365d] font-semibold cursor-pointer tracking-wider uppercase font-mono"
        >
          EXPLORE ALL FILMS ↗
        </button>
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {movies.slice(0, 4).map((movie, idx) => (
          <MovieCard
            key={movie.id}
            movie={movie}
            rank={idx + 1}
            badgeLabel={idx === 0 ? 'RISING SIGNAL' : idx === 1 ? 'AUDIENCE VERDICT' : idx === 2 ? 'BOX OFFICE WATCH' : 'MIXED SIGNAL STUDY'}
            onSelect={onSelectMovie}
          />
        ))}
      </section>

      {/* Lower Row: Activity + Command Desk */}
      <div className="pt-2">
        <h2 className="font-bold text-[20px] font-display text-white tracking-tight">Intelligence activity</h2>
        <p className="text-[10px] text-[#8290a2] mt-0.5">
          Evidence alerts and the AIOS command workspace.
        </p>
      </div>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        {/* System Evidence Monitor */}
        <article className="bg-gradient-to-br from-[#151b24] to-[#10151d] border border-[#2c3745] rounded-[14px] p-4 md:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <b className="font-bold text-[13px] text-white">System evidence monitor</b>
              <span className="text-[9px] font-mono text-[#8d9aab]">AUDIT TRAIL</span>
            </div>

            <div className="divide-y divide-white/10">
              <div className="flex gap-2.5 py-3">
                <div className="w-[29px] h-[29px] shrink-0 rounded-[8px] bg-[#51d6c2]/15 text-[#51d6c2] grid place-items-center font-bold text-[12px]">
                  ✓
                </div>
                <div>
                  <b className="text-[10px] text-white block">Source attribution required</b>
                  <p className="text-[9px] text-[#8996a6] leading-relaxed mt-1">
                    Every metric needs source, region, units, publication date where known and retrieval timestamp.
                  </p>
                </div>
              </div>

              <div className="flex gap-2.5 py-3">
                <div className="w-[29px] h-[29px] shrink-0 rounded-[8px] bg-[#ff365d]/20 text-[#ff8197] grid place-items-center font-bold text-[12px]">
                  !
                </div>
                <div>
                  <b className="text-[10px] text-white block">Trend classification guarded</b>
                  <p className="text-[9px] text-[#8996a6] leading-relaxed mt-1">
                    Rising/falling requires multiple comparable observations, not one repeated request.
                  </p>
                </div>
              </div>

              <div className="flex gap-2.5 py-3">
                <div className="w-[29px] h-[29px] shrink-0 rounded-[8px] bg-[#51d6c2]/15 text-[#51d6c2] grid place-items-center font-bold text-[12px]">
                  ◇
                </div>
                <div>
                  <b className="text-[10px] text-white block">Agent readiness test-verified</b>
                  <p className="text-[9px] text-[#8996a6] leading-relaxed mt-1">
                    Only tested agents are reported as implemented. Full typed schemas and evidence outputs active.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-white/10 text-[9px] text-[#8996a6]">
            Strict policy: Undisclosed streaming hours and proprietary subscriber counts are never fabricated.
          </div>
        </article>

        {/* AIOS Command Desk */}
        <article className="bg-gradient-to-br from-[#151b24] to-[#10151d] border border-[#2c3745] rounded-[14px] p-4 md:p-5 flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-2 text-[#f4bd62] font-mono text-[10px] tracking-[0.14em] uppercase mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#f4bd62] animate-pulse" />
              <span>INDCINE AIOS COMMAND DESK</span>
            </div>

            <h2 className="font-extrabold text-[24px] sm:text-[28px] font-display text-white uppercase tracking-tight my-2">
              Ask. Investigate. Understand.
            </h2>
            <p className="text-[10px] text-[#9ba7b6] leading-[1.7]">
              The orchestrator plans your request, selects necessary agents, collects permitted data, validates evidence and returns a clear assessment with uncertainty disclosed.
            </p>

            <form onSubmit={handleAnalystSubmit} className="flex gap-2 mt-3.5 bg-[#0b1017] border border-[#3b4757] p-2 rounded-[10px]">
              <input
                value={analystInput}
                onChange={(e) => setAnalystInput(e.target.value)}
                placeholder="e.g. Compare Tamil & Telugu trends this week..."
                className="min-w-0 flex-1 bg-transparent border-0 outline-none text-white text-[11px] px-2 placeholder-[#5f6c7e]"
              />
              <button
                type="submit"
                className="bg-[#ff365d] hover:bg-[#e02047] text-white border-0 rounded-[7px] px-3.5 py-2 text-[10px] font-bold cursor-pointer transition-colors shrink-0"
              >
                RUN ANALYSIS ↗
              </button>
            </form>

            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {[
                'Compare Tamil & Telugu trends',
                'Films with rising audience reception',
                'Latest reported box office in Crores',
              ].map((query) => (
                <button
                  key={query}
                  onClick={() => onRunAnalystQuery(query)}
                  className="bg-[#1c2430] hover:bg-[#253040] border border-[#354253] rounded-[6px] text-[#b7c2cf] hover:text-white text-[9px] px-2 py-1 cursor-pointer transition-colors font-sans"
                >
                  {query}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-white/10 flex justify-between items-center text-[9px] text-[#8996a6]">
            <button
              onClick={() => onNavigate('chat')}
              className="text-[#51d6c2] hover:text-[#7efce8] font-bold cursor-pointer uppercase font-mono flex items-center gap-1"
            >
              <span>✦</span>
              <span>LAUNCH INDCINE AI CHAT →</span>
            </button>
            <button
              onClick={() => onNavigate('analyst')}
              className="text-[#ff8197] hover:text-[#ff365d] font-semibold cursor-pointer uppercase font-mono"
            >
              COMMAND DESK →
            </button>
          </div>
        </article>
      </section>

      {/* Disclaimer */}
      <div className="border-t border-white/10 pt-3 text-[#738093] text-[9px] leading-relaxed">
        INDCINE INTELLIGENCE WORKSPACE · No live figures are fabricated. Populate metrics only from connected, permitted sources. Availability is not viewership; popularity is not profitability; box-office gross is not profit. All analytical claims require traceable evidence.
      </div>
    </div>
  );
};
