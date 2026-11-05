import React, { useState } from 'react';
import { MovieCard } from '../components/movie/MovieCard';
import { Movie, OrchestratorResponse, RouteId } from '../types/aios';
import { safeFetchJson } from '../utils/safeFetchJson';

interface AiosAnalystScreenProps {
  initialQuery?: string;
  onSelectMovie: (movie: Movie) => void;
  onNavigate: (route: RouteId) => void;
}

export const AiosAnalystScreen: React.FC<AiosAnalystScreenProps> = ({
  initialQuery = '',
  onSelectMovie,
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<OrchestratorResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPlan, setShowPlan] = useState(true);
  const [showEvidence, setShowEvidence] = useState(false);

  const handleSubmit = async (q = query) => {
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await safeFetchJson<OrchestratorResponse>('/api/aios/query', {
        method: 'POST',
        body: JSON.stringify({ query: q.trim() }),
      });
      setResponse(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AIOS Orchestrator request failed.');
    } finally {
      setLoading(false);
    }
  };

  const PRESET_QUERIES = [
    'Which Tamil films have the strongest current public popularity signals?',
    'Compare recent Malayalam theatrical releases',
    'Which Indian OTT titles have positive audience reception?',
    'Explain Leo vs Kalki 2898 AD box-office and budget context',
    'Why did Manjummel Boys become an unprecedented pan-India blockbuster?',
    'Generate a weekly Indian cinema intelligence briefing',
  ];

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <div>
        <div className="inline-flex items-center gap-2 text-[#f4bd62] font-mono text-[10px] tracking-[0.14em] uppercase mb-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#f4bd62] animate-pulse" />
          <span>INDCINE AIOS COMMAND DESK</span>
        </div>
        <h1 className="font-bold text-[22px] md:text-[26px] font-display text-white tracking-tight">
          AIOS Command Desk
        </h1>
        <p className="text-[11px] text-[#8996a6] mt-0.5">
          Evidence-led analysis. The orchestrator plans research, calls specialized agents, validates citations, and reports uncertainty boundaries.
        </p>
      </div>

      {/* Query Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        className="flex gap-2.5 bg-[#0b1017] border border-[#3b4757] rounded-[12px] p-2.5 shadow-[0_8px_30px_rgba(0,0,0,0.25)]"
      >
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask about Indian movies, OTT rights, box-office collections, or audience sentiment..."
          className="flex-1 min-w-0 bg-transparent border-0 outline-none text-white text-[13px] px-3 placeholder-[#5f6c7e]"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-[#ff365d] hover:bg-[#e02047] text-white px-5 py-2.5 rounded-[8px] text-[12px] font-bold cursor-pointer transition-colors disabled:opacity-50 flex items-center gap-2 shrink-0 font-display"
        >
          {loading ? (
            <>
              <span className="animate-spin">↻</span>
              <span>Orchestrating...</span>
            </>
          ) : (
            <>
              <span>RUN ANALYSIS</span>
              <span>↗</span>
            </>
          )}
        </button>
      </form>

      {/* Preset Buttons */}
      <div className="flex gap-2 flex-wrap">
        {PRESET_QUERIES.map((preset) => (
          <button
            key={preset}
            onClick={() => {
              setQuery(preset);
              handleSubmit(preset);
            }}
            className="bg-[#1c2430] hover:bg-[#253040] border border-[#354253] text-[#b7c2cf] hover:text-white rounded-[7px] px-2.5 py-1.5 text-[10px] cursor-pointer transition-colors"
          >
            {preset}
          </button>
        ))}
      </div>

      {/* Error message */}
      {error && (
        <div className="border border-[#ff365d]/40 bg-[#ff365d]/10 text-[#ff8197] p-4 rounded-[12px] text-[11px]">
          {error}
        </div>
      )}

      {/* Analysis Output */}
      {response && (
        <div className="space-y-5">
          {/* Plan & Agent Execution Flow */}
          <div className="bg-gradient-to-br from-[#171d27] to-[#10151d] border border-[#2c3745] rounded-[14px] p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[11px] font-mono text-[#f4bd62]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#f4bd62]" />
                <b>ORCHESTRATOR EXECUTION PLAN & AUDIT TRAIL</b>
                <span className="text-[#8996a6]">({response.executionLog.length} steps)</span>
              </div>
              <button
                onClick={() => setShowPlan(!showPlan)}
                className="text-[10px] text-[#ff8197] hover:text-[#ff365d] font-mono cursor-pointer"
              >
                {showPlan ? 'Collapse Plan ▲' : 'Expand Plan ▼'}
              </button>
            </div>

            {showPlan && (
              <div className="mt-3.5 space-y-2 border-t border-white/10 pt-3">
                {response.executionLog.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-2.5 text-[10px] font-mono bg-[#0b1017] p-2.5 rounded-[8px] border border-[#29313e]"
                  >
                    <span className="w-5 h-5 rounded-[5px] bg-[#ff365d]/15 text-[#ff8197] grid place-items-center font-bold shrink-0">
                      {log.step}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <strong className="text-white">{log.agent}</strong>
                        <span className="text-[#8996a6]">·</span>
                        <span className="text-[#51d6c2] uppercase">{log.status}</span>
                        <span className="text-[#8996a6]">({log.durationMs}ms)</span>
                      </div>
                      <div className="text-[#c1c8d2] mt-0.5 font-sans text-[11px]">{log.action}</div>
                      <div className="text-[#8996a6] text-[9px] mt-0.5">{log.summary}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Main Answer Card */}
          <article className="bg-gradient-to-br from-[#171d27] to-[#10151d] border border-[#2c3745] rounded-[15px] p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <span className="text-[10px] font-mono text-[#51d6c2] flex items-center gap-1.5">
                <i className="w-2 h-2 rounded-full bg-[#51d6c2]" />
                VERIFIED INTELLIGENCE ANSWER
              </span>
              <span className="text-[10px] font-mono text-[#8996a6]">
                CONFIDENCE: {response.confidence.toUpperCase()}
              </span>
            </div>

            <div className="prose prose-invert max-w-none text-[#d2d9e2] text-[13px] leading-[1.8] whitespace-pre-wrap">
              {response.answer}
            </div>

            {/* Movies if matched */}
            {response.movies && response.movies.length > 0 && (
              <div className="mt-6 pt-5 border-t border-white/10">
                <div className="text-[11px] font-display font-bold text-white mb-3">
                  Identified Indian Cinema Records ({response.movies.length}):
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {response.movies.slice(0, 3).map((m) => (
                    <MovieCard key={m.id} movie={m} onSelect={onSelectMovie} />
                  ))}
                </div>
              </div>
            )}

            {/* Toggle Evidence Panel */}
            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
              <button
                onClick={() => setShowEvidence(!showEvidence)}
                className="text-[11px] text-[#51d6c2] hover:text-[#7ce8d8] font-mono cursor-pointer flex items-center gap-1"
              >
                <span>{showEvidence ? 'Hide Evidence Artifacts ▲' : 'View Evidence Artifacts (' + response.evidence.length + ') ▼'}</span>
              </button>

              <div className="text-[9px] text-[#8996a6] font-mono">
                {response.usedGemini ? 'Gemini 2.5 Synthesis + Deterministic Verification' : '100% Deterministic Verification'}
              </div>
            </div>

            {/* Evidence Drawer */}
            {showEvidence && (
              <div className="mt-4 space-y-2 border-t border-white/10 pt-3">
                {response.evidence.map((ev, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-[8px] bg-[#0b1017] border border-[#29313e] text-[10px] font-mono"
                  >
                    <div className="flex justify-between items-center text-white mb-1">
                      <strong className="text-[#f4bd62]">{ev.metric}</strong>
                      <span className="text-[#8996a6]">{ev.territory}</span>
                    </div>
                    <div className="text-[#d2d9e2] font-sans text-[11px]">{ev.value}</div>
                    <div className="text-[#8996a6] mt-1">
                      Source: {ev.sourceName} • Confidence: {ev.confidence.toUpperCase()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article>
        </div>
      )}
    </div>
  );
};
