import React from 'react';
import { AlertTriangle, CheckCircle2, Clock, Cpu, ExternalLink } from 'lucide-react';
import { OrchestratorResponse } from '../../types/aios';

interface AgentExecutionLogPanelProps {
  result: OrchestratorResponse | null;
  isLoading: boolean;
}

export const AgentExecutionLogPanel: React.FC<AgentExecutionLogPanelProps> = ({
  result,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <section className="bg-[#1b1b20] border border-[#5c3f40]/30 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#e4e1e9]">
            <Cpu className="w-4 h-4 text-[#e11d48] animate-spin" />
            <span>AIOS Orchestrator Executing Plan...</span>
          </div>
          <span className="text-xs text-[#ac8889] font-mono-tabular">Running</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              className="h-20 rounded-xl bg-[#2a292f]/60 animate-pulse border border-[#5c3f40]/20"
            />
          ))}
        </div>
      </section>
    );
  }

  if (!result) return null;

  return (
    <section className="bg-[#1b1b20] border border-[#5c3f40]/30 rounded-2xl p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#5c3f40]/20 pb-4">
        <div className="flex items-center gap-2.5">
          <Cpu className="w-5 h-5 text-[#e11d48]" />
          <div>
            <h3 className="text-base font-semibold text-[#e4e1e9]">
              AIOS Orchestrator Execution Log
            </h3>
            <p className="text-xs text-[#ac8889]">
              Request {result.requestId} ·{' '}
              {result.usedGemini
                ? 'Gemini 3.8 Flash + Deterministic Rules'
                : 'Deterministic Fallback Mode'}
            </p>
          </div>
        </div>
        <span className="text-xs text-[#ac8889] font-mono-tabular">
          Retrieved {new Date(result.retrievedAt).toLocaleTimeString()}
        </span>
      </div>

      {/* Agent Steps */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {result.executionLog.map((entry) => (
          <div
            key={entry.id}
            className="bg-[#1f1f25] border border-[#5c3f40]/25 rounded-xl p-4 flex flex-col justify-between gap-2"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-mono-tabular text-[#ffb95f] font-semibold">
                Step {entry.step}
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-[#e5bdbe] font-mono-tabular">
                <Clock className="w-3 h-3" />
                {entry.durationMs}ms
              </span>
            </div>
            <div>
              <div className="text-sm font-semibold text-[#e4e1e9] flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">{entry.agent}</span>
              </div>
              <p className="text-xs text-[#ac8889] mt-1 line-clamp-2">
                {entry.summary}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Warnings / Transparency Notices */}
      {result.warnings.length > 0 && (
        <div className="bg-[#0e0e13] border border-[#5c3f40]/30 rounded-xl p-4 space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#ffb95f]">
            <AlertTriangle className="w-4 h-4" />
            <span>Transparency &amp; Data Scope Notes</span>
          </div>
          <ul className="text-xs text-[#ac8889] space-y-1 pl-6 list-disc">
            {result.warnings.map((w, idx) => (
              <li key={idx}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Grounded Evidence Citations */}
      {result.evidence.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-[#e5bdbe] uppercase tracking-wider">
            Grounded Evidence &amp; Sources
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {result.evidence.map((ev, idx) => (
              <a
                key={idx}
                href={ev.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[#1f1f25] hover:bg-[#2a292f] border border-[#5c3f40]/20 text-xs transition-colors"
              >
                <div className="min-w-0">
                  <div className="font-semibold text-[#e4e1e9] truncate">
                    {ev.sourceName}
                  </div>
                  <div className="text-[#ac8889] truncate">
                    {ev.metric}: {String(ev.value)} · Territory: {ev.territory}
                  </div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-[#ffb3b6] shrink-0" />
              </a>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
