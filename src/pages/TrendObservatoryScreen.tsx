import React, { useEffect, useState } from 'react';
import { RouteId, TrendMovementItem } from '../types/aios';
import { safeFetchJson } from '../utils/safeFetchJson';

interface TrendObservatoryScreenProps {
  onNavigate: (route: RouteId) => void;
}

export const TrendObservatoryScreen: React.FC<TrendObservatoryScreenProps> = () => {
  const [windowMode, setWindowMode] = useState<'day' | 'week'>('day');
  const [trendData, setTrendData] = useState<{
    hasSufficientHistory: boolean;
    disclosure: string;
    totalLoggedSnapshots: number;
    lastSnapshotAt: string | null;
    movements: TrendMovementItem[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    safeFetchJson<any>(`/api/trends/observations?window=${windowMode}`)
      .then((data) => setTrendData(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [windowMode]);

  const movements = trendData?.movements || [];

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-bold text-[22px] md:text-[26px] font-display text-white tracking-tight">
            Trend Observatory
          </h1>
          <p className="text-[11px] text-[#8996a6] mt-0.5">
            Historical popularity movements, rank changes, and multi-snapshot observations.
          </p>
        </div>

        {/* Window Selector */}
        <div className="flex bg-[#111720] border border-[#29313e] p-1 rounded-[9px] text-[11px] font-mono">
          <button
            onClick={() => setWindowMode('day')}
            className={`px-3 py-1.5 rounded-[7px] cursor-pointer transition-colors ${
              windowMode === 'day' ? 'bg-[#ff365d] text-white font-bold' : 'text-[#b5bdc9] hover:text-white'
            }`}
          >
            Daily Observations (24h)
          </button>
          <button
            onClick={() => setWindowMode('week')}
            className={`px-3 py-1.5 rounded-[7px] cursor-pointer transition-colors ${
              windowMode === 'week' ? 'bg-[#ff365d] text-white font-bold' : 'text-[#b5bdc9] hover:text-white'
            }`}
          >
            Weekly Trends (7d)
          </button>
        </div>
      </div>

      {/* Observation Protocol Banner */}
      <div className="border border-[#f4bd62]/30 bg-[#f4bd62]/[0.05] rounded-[12px] p-4 text-[11px] text-[#c1c8d2] leading-relaxed">
        <b className="text-[#f4bd62] font-bold">Trend Observation Protocol:</b> {trendData?.disclosure || 'A rising or declining movement label requires at least two comparable observations. Titles with only a single recorded run are classified as "Insufficient history".'}
        <div className="text-[10px] text-[#f4bd62] font-mono mt-1">
          Total Snapshots Logged: {trendData?.totalLoggedSnapshots ?? 0} • Last Cadence Run: {trendData?.lastSnapshotAt || 'Active'}
        </div>
      </div>

      {/* Movements Table */}
      <div className="bg-[#111720] border border-[#29313e] rounded-[14px] overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <strong className="text-[13px] font-display text-white">
            Observed Trajectories ({movements.length} titles)
          </strong>
          <span className="text-[10px] font-mono text-[#8996a6]">WINDOW: {windowMode.toUpperCase()}</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-[#8996a6] font-mono text-[11px]">
            Reading timestamped observation snapshots...
          </div>
        ) : movements.length === 0 ? (
          <div className="p-8 text-center text-[#8996a6] text-[11px] font-mono">
            No trend observations recorded for this window yet. Refresh to take a snapshot.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px]">
              <thead className="bg-[#0b1017] text-[#8996a6] font-mono text-[10px] uppercase border-b border-white/10">
                <tr>
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Language</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Current Rank</th>
                  <th className="py-3 px-4">Rank Delta</th>
                  <th className="py-3 px-4">Metric Change</th>
                  <th className="py-3 px-4">Snapshots</th>
                  <th className="py-3 px-4">Source Provenance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {movements.map((m, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4 text-white font-sans font-semibold">{m.title}</td>
                    <td className="py-3 px-4 text-[#8996a6] uppercase">{m.originalLanguage}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-[4px] text-[10px] font-bold ${
                          m.status === 'Rising'
                            ? 'bg-[#51d6c2]/15 text-[#51d6c2]'
                            : m.status === 'Falling'
                            ? 'bg-[#ff365d]/15 text-[#ff8197]'
                            : m.status === 'Stable'
                            ? 'bg-[#7ca9ff]/15 text-[#7ca9ff]'
                            : 'bg-white/5 text-[#8996a6]'
                        }`}
                      >
                        {m.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-white">#{m.currentRank ?? '—'}</td>
                    <td className="py-3 px-4 text-[#d2d9e2]">
                      {m.rankDelta !== null ? (m.rankDelta > 0 ? `+${m.rankDelta}` : m.rankDelta) : '—'}
                    </td>
                    <td className="py-3 px-4 text-[#d2d9e2]">
                      {m.percentageChange !== null ? `${m.percentageChange}%` : '—'}
                    </td>
                    <td className="py-3 px-4 text-[#8996a6]">{m.observationCount}</td>
                    <td className="py-3 px-4 text-[#8996a6] text-[10px] font-sans truncate max-w-[200px]">
                      {m.source}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
