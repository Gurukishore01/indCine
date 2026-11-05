import React from 'react';
import { Movie, RouteId } from '../types/aios';

interface BoxOfficeScreenProps {
  movies: Movie[];
  onSelectMovie: (movie: Movie) => void;
  onNavigate: (route: RouteId) => void;
}

export const BoxOfficeScreen: React.FC<BoxOfficeScreenProps> = ({
  movies,
  onSelectMovie,
}) => {
  const boMovies = movies.filter((m) => m.boxOffice);

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <div>
        <h1 className="font-bold text-[22px] md:text-[26px] font-display text-white tracking-tight">
          Box Office Tracker
        </h1>
        <p className="text-[11px] text-[#8996a6] mt-0.5">
          Sourced Indian theatrical collections, distinguishing India Net, India Gross, Worldwide Gross, and Budget context.
        </p>
      </div>

      <div className="border border-[#f4bd62]/30 bg-[#f4bd62]/[0.05] rounded-[12px] p-4 text-[11px] text-[#c1c8d2] leading-relaxed">
        <b className="text-[#f4bd62] font-bold">Financial Integrity Standard:</b> IndCine separates theatrical gross from producer net. Entertainment taxes, distributor commission splits, and regional rights recovery differ widely across Indian states. Commercial verdicts (Blockbuster, Super Hit, Hit, Underperformed) are reported only from attributed trade publications.
      </div>

      {/* Box Office Leaderboard & Details */}
      <div className="bg-[#111720] border border-[#29313e] rounded-[14px] overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <strong className="text-[13px] font-display text-white">
            Indian Theatrical Collections Benchmark ({boMovies.length} audited releases)
          </strong>
          <span className="text-[10px] font-mono text-[#f4bd62]">FIGURES IN INR CRORES (₹)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px]">
            <thead className="bg-[#0b1017] text-[#8996a6] font-mono text-[10px] uppercase border-b border-white/10">
              <tr>
                <th className="py-3 px-4">Film & Industry</th>
                <th className="py-3 px-4">Worldwide Gross</th>
                <th className="py-3 px-4">India Domestic Net</th>
                <th className="py-3 px-4">India Gross</th>
                <th className="py-3 px-4">Overseas Gross</th>
                <th className="py-3 px-4">Reported Budget</th>
                <th className="py-3 px-4">Trade Classification</th>
                <th className="py-3 px-4">Attributed Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {boMovies.map((m) => {
                const b = m.boxOffice!;
                return (
                  <tr
                    key={m.id}
                    onClick={() => onSelectMovie(m)}
                    className="hover:bg-white/[0.03] transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4 text-white font-sans font-semibold">
                      <div>{m.title}</div>
                      <small className="text-[10px] text-[#8996a6] font-mono">
                        {m.language} ({m.industry || 'India'}) • {m.year}
                      </small>
                    </td>
                    <td className="py-3 px-4 text-[#f4bd62] font-bold text-[13px]">
                      {b.worldwideGrossCrore ? `₹${b.worldwideGrossCrore} Cr` : '—'}
                    </td>
                    <td className="py-3 px-4 text-white">
                      {b.indiaNetCrore ? `₹${b.indiaNetCrore} Cr` : '—'}
                    </td>
                    <td className="py-3 px-4 text-[#d2d9e2]">
                      {b.indiaGrossCrore ? `₹${b.indiaGrossCrore} Cr` : '—'}
                    </td>
                    <td className="py-3 px-4 text-[#d2d9e2]">
                      {b.overseasGrossCrore ? `₹${b.overseasGrossCrore} Cr` : '—'}
                    </td>
                    <td className="py-3 px-4 text-[#8996a6]">
                      {b.budgetCrore ? `₹${b.budgetCrore} Cr` : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-[4px] bg-[#51d6c2]/15 text-[#51d6c2] text-[10px] font-bold">
                        {b.reportedStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#8996a6] text-[10px] font-sans truncate max-w-[160px]">
                      {b.sourceName}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
