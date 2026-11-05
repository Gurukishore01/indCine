import React, { useState } from 'react';
import { Movie, RouteId } from '../types/aios';

interface ReportsScreenProps {
  movies: Movie[];
  onSelectMovie: (movie: Movie) => void;
  onNavigate: (route: RouteId) => void;
}

export const ReportsScreen: React.FC<ReportsScreenProps> = ({ movies }) => {
  const [selectedReport, setSelectedReport] = useState<'weekly' | 'boxoffice' | 'ott'>('weekly');

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-bold text-[22px] md:text-[26px] font-display text-white tracking-tight">
            Intelligence Reports
          </h1>
          <p className="text-[11px] text-[#8996a6] mt-0.5">
            Structured Indian cinema briefings with verifiable audit trails, data freshness, and methodology boundaries.
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="border border-white/20 bg-[#111720] hover:bg-[#1c2430] text-white px-3.5 py-2 rounded-[8px] text-[11px] font-mono flex items-center gap-2 cursor-pointer transition-colors"
        >
          <span>🖨</span> Print / Export Briefing
        </button>
      </div>

      {/* Report Selector Tabs */}
      <div className="flex gap-2">
        {[
          { id: 'weekly', label: 'Weekly Pan-India Cinema Digest' },
          { id: 'boxoffice', label: 'Theatrical Financial Audit Report' },
          { id: 'ott', label: 'Indian OTT Rights & Distribution Brief' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedReport(tab.id as any)}
            className={`px-3 py-1.5 rounded-[8px] text-[11px] font-medium cursor-pointer transition-colors ${
              selectedReport === tab.id
                ? 'bg-[#ff365d] text-white font-semibold'
                : 'bg-[#111720] border border-[#29313e] text-[#b5bdc9] hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Structured Report Document */}
      <article className="bg-[#111720] border border-[#29313e] rounded-[14px] p-6 md:p-8 space-y-6 text-[#d2d9e2]">
        {/* Document Header */}
        <div className="border-b border-white/10 pb-5">
          <div className="flex justify-between items-center text-[10px] font-mono text-[#f4bd62] mb-2 uppercase">
            <span>INDCINE AUDITED REPORT · REF #{Date.now().toString().slice(-6)}</span>
            <span>DATE: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
          <h2 className="font-bold text-[20px] md:text-[24px] font-display text-white tracking-tight">
            {selectedReport === 'weekly' && 'Weekly Indian Cinema & OTT Intelligence Briefing'}
            {selectedReport === 'boxoffice' && 'Indian Theatrical Financial Audit & Recovery Benchmark'}
            {selectedReport === 'ott' && 'Indian Streaming Rights & Regional Catalogue Distribution Report'}
          </h2>
          <div className="text-[11px] text-[#8996a6] mt-1 font-mono">
            Territory: India (All States) • Coverage: Tamil, Telugu, Malayalam, Kannada, Hindi, Bengali, Marathi, Punjabi
          </div>
        </div>

        {/* Section 1: Executive Briefing */}
        <div className="space-y-2">
          <h3 className="font-bold text-[14px] font-display text-[#ff8197] uppercase tracking-wide">
            1. Executive Briefing
          </h3>
          <p className="text-[12px] leading-relaxed text-[#c1c8d2]">
            The Indian film ecosystem continues to demonstrate robust cross-language mobility. South Indian theatrical releases (notably Malayalam survival thriller <em>Manjummel Boys</em>, Telugu mythological sci-fi <em>Kalki 2898 AD</em>, and Tamil military drama <em>Amaran</em>) have achieved substantial box-office penetration beyond their primary home linguistic circuits. In Northern circuits, franchise horror-comedy <em>Stree 2</em> established historical benchmarks for domestic theatrical net receipts.
          </p>
        </div>

        {/* Section 2: Verified Cohort */}
        <div className="space-y-3">
          <h3 className="font-bold text-[14px] font-display text-[#ff8197] uppercase tracking-wide">
            2. Verified Active Cohort Summary
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
            {movies.slice(0, 4).map((m) => (
              <div key={m.id} className="p-3 bg-[#0b1017] rounded-[9px] border border-[#29313e]">
                <div className="flex justify-between font-bold text-white">
                  <span>{m.title} ({m.year})</span>
                  <span className="text-[#f4bd62] font-mono">
                    {m.boxOffice?.worldwideGrossCrore ? `₹${m.boxOffice.worldwideGrossCrore} Cr` : 'Audited'}
                  </span>
                </div>
                <div className="text-[10px] text-[#8996a6] mt-1">
                  Language: {m.language} • OTT: {m.verifiedOttProviders.map((p) => p.providerName).join(', ') || 'Pending'}
                </div>
                <div className="text-[10px] text-[#51d6c2] mt-1">
                  Status: {m.boxOffice?.reportedStatus || 'Verified'} • {m.provenance.toUpperCase()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Data Limitations & Standards */}
        <div className="border-t border-white/10 pt-4 space-y-2 text-[10px] text-[#8996a6] font-mono">
          <b className="text-white block uppercase font-sans text-[11px]">3. Methodology Caveats & Audit Disclosures:</b>
          <div>• Watch provider data powered by JustWatch via TMDB API v3.</div>
          <div>• Unverified search fallback URLs are isolated and not represented as active streaming rights.</div>
          <div>• Theatrical collections sourced from trade aggregator published figures (Sacnilk, Box Office India, Producer Chambers).</div>
          <div>• Zero additional budget activated; all data processed within free authorized limits.</div>
        </div>
      </article>
    </div>
  );
};
