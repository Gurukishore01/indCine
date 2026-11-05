import React, { useState } from 'react';
import { ArrowRight, Cpu, Sparkles, Star } from 'lucide-react';
import {
  MoodConstraints,
  Movie,
  OrchestratorResponse,
  RouteId,
} from '../types/aios';
import { AgentExecutionLogPanel } from '../components/aios/AgentExecutionLogPanel';
import { safeFetchJson } from '../utils/safeFetchJson';

interface QuickPickPageProps {
  onSelectMovie: (movie: Movie) => void;
  onNavigate: (route: RouteId) => void;
}

const MOODS = [
  'Mind-Bending & Cerebral',
  'Adrenaline Rush & Fast',
  'Cozy Wholesome Comfort',
  'Late Night Grim Noir',
  'Tear-Jerker & Moving',
  'Laugh Out Loud',
];

const RUNTIMES = [
  { label: '< 100 mins (Snack)', value: 100 },
  { label: '90–125 mins (Standard)', value: 125 },
  { label: '125–160 mins (Epic)', value: 160 },
  { label: 'No limit', value: 0 },
];

const LANGUAGES = ['All Languages', 'English', 'Malayalam', 'Tamil', 'Korean'];

const ERAS = [
  'Any Era',
  'Fresh Releases (2023–2025)',
  'Modern Classics (2010s)',
  'Golden Era Classics',
];

export const QuickPickPage: React.FC<QuickPickPageProps> = ({
  onSelectMovie,
  onNavigate,
}) => {
  const [mood, setMood] = useState<string>('Mind-Bending & Cerebral');
  const [maxRuntime, setMaxRuntime] = useState<number>(125);
  const [language, setLanguage] = useState<string>('All Languages');
  const [era, setEra] = useState<string>('Any Era');
  const [freeText, setFreeText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<OrchestratorResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCalculate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setError(null);

    const constraints: MoodConstraints = {
      mood,
      language,
      maxRuntimeMinutes: maxRuntime > 0 ? maxRuntime : undefined,
      era,
      region: 'IN',
    };

    try {
      const data = await safeFetchJson<OrchestratorResponse>('/api/aios/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: freeText,
          constraints,
        }),
      });
      setResult(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to run AIOS recommendation.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const topPick = result?.recommendations[0];

  return (
    <div className="space-y-10">
      {/* Header */}
      <section className="text-center max-w-3xl mx-auto space-y-2">
        <div className="text-xs font-semibold text-[#ffb95f] uppercase tracking-wider">
          Phase 2 Multi-Agent Workflow
        </div>
        <h1 className="text-3xl md:text-5xl font-bold text-[#e4e1e9] tracking-tight">
          Decide in 10 Seconds
        </h1>
        <p className="text-sm md:text-base text-[#ac8889]">
          Select your mood, runtime, language, or describe what you feel like
          watching. The AIOS Orchestrator coordinates Intent, Discovery,
          Recommendation, and Review agents.
        </p>
      </section>

      {/* Interactive Control Dashboard */}
      <form
        onSubmit={handleCalculate}
        className="bg-[#1b1b20] border border-[#5c3f40]/30 rounded-2xl p-6 md:p-8 space-y-6"
      >
        {/* 1. Mood */}
        <div className="space-y-2.5">
          <label className="block text-sm font-semibold text-[#e4e1e9]">
            1. What is your current emotional mood?
          </label>
          <div className="flex flex-wrap gap-2">
            {MOODS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMood(m)}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                  mood === m
                    ? 'bg-[#e11d48] text-[#fffaf9]'
                    : 'bg-[#2a292f] text-[#e5bdbe] hover:bg-[#35343a] border border-[#5c3f40]/30'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Runtime */}
        <div className="space-y-2.5 pt-4 border-t border-[#5c3f40]/20">
          <label className="block text-sm font-semibold text-[#e4e1e9]">
            2. How much time do you have?
          </label>
          <div className="flex flex-wrap gap-2">
            {RUNTIMES.map((rt) => (
              <button
                key={rt.label}
                type="button"
                onClick={() => setMaxRuntime(rt.value)}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                  maxRuntime === rt.value
                    ? 'bg-[#ee9800] text-[#2a1700]'
                    : 'bg-[#2a292f] text-[#e5bdbe] hover:bg-[#35343a] border border-[#5c3f40]/30'
                }`}
              >
                {rt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Language & Era */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#5c3f40]/20">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-[#e4e1e9]">
              3. Language Preference
            </label>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setLanguage(lang)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                    language === lang
                      ? 'bg-[#e11d48] text-[#fffaf9]'
                      : 'bg-[#2a292f] text-[#e5bdbe] hover:bg-[#35343a] border border-[#5c3f40]/30'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-[#e4e1e9]">
              4. Preferred Era
            </label>
            <div className="flex flex-wrap gap-2">
              {ERAS.map((eItem) => (
                <button
                  key={eItem}
                  type="button"
                  onClick={() => setEra(eItem)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                    era === eItem
                      ? 'bg-[#e11d48] text-[#fffaf9]'
                      : 'bg-[#2a292f] text-[#e5bdbe] hover:bg-[#35343a] border border-[#5c3f40]/30'
                  }`}
                >
                  {eItem}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 5. Optional Natural-Language Refinement */}
        <div className="space-y-2 pt-4 border-t border-[#5c3f40]/20">
          <label
            htmlFor="mood-prompt"
            className="block text-sm font-semibold text-[#e4e1e9]"
          >
            5. Optional Natural-Language Request
          </label>
          <input
            id="mood-prompt"
            type="text"
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            placeholder="e.g., I want a tense Malayalam thriller under two hours, or something uplifting..."
            className="w-full bg-[#0e0e13] text-sm text-[#e4e1e9] placeholder:text-[#ac8889]/60 px-4 py-3 rounded-xl border border-[#5c3f40]/40 focus:outline-none focus:border-[#e11d48]"
          />
        </div>

        {/* Submit */}
        <div className="pt-4 border-t border-[#5c3f40]/20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xs text-[#ac8889]">
            Coordinates 4 specialised AIOS agents with transparent weighted scoring.
          </span>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-[#e11d48] hover:bg-[#be0037] text-[#fffaf9] font-semibold text-sm px-8 py-3.5 rounded-full transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>
              {isLoading ? 'Orchestrating Agents...' : 'Calculate My Perfect Movie'}
            </span>
          </button>
        </div>
      </form>

      {error && (
        <div className="p-4 rounded-xl bg-[#93000a]/40 border border-[#ffb4ab]/40 text-xs text-[#ffdad6]">
          {error}
        </div>
      )}

      {/* Top Recommendation Reveal */}
      {topPick && !isLoading && (
        <section className="rounded-3xl bg-[#1b1b20] border border-[#e11d48]/50 p-6 md:p-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-semibold text-[#ffb95f] uppercase tracking-wider">
              Top AIOS Recommendation
            </span>
            <span className="text-sm font-mono-tabular font-bold text-[#ffb95f]">
              {topPick.matchScore}% Match
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3 text-xs text-[#e5bdbe]">
              <span>{topPick.movie.year}</span>
              <span aria-hidden="true">·</span>
              <span>{topPick.movie.runtimeMinutes}m</span>
              <span aria-hidden="true">·</span>
              <span>{topPick.movie.language}</span>
              <span aria-hidden="true">·</span>
              <span>{topPick.movie.genres.join(' / ')}</span>
              {topPick.movie.ratings[0] && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1 text-[#ffb95f] font-mono-tabular font-semibold">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    {topPick.movie.ratings[0].score} {topPick.movie.ratings[0].source}
                  </span>
                </>
              )}
            </div>

            <h2 className="text-3xl md:text-4xl font-bold text-[#e4e1e9]">
              {topPick.movie.title}
            </h2>

            <p className="text-sm md:text-base text-[#e4e1e9]/85 max-w-3xl leading-relaxed">
              {topPick.movie.synopsis}
            </p>
          </div>

          {/* Grounded Reasons */}
          <div className="bg-[#1f1f25] rounded-xl p-5 border border-[#5c3f40]/30 space-y-2">
            <div className="text-xs font-semibold text-[#ffb95f] flex items-center gap-1.5">
              <Cpu className="w-4 h-4" />
              <span>Why CINEMIND Picked This For You</span>
            </div>
            <ul className="text-xs md:text-sm text-[#e4e1e9]/90 space-y-1.5 list-disc pl-5">
              {topPick.reasons.map((r, idx) => (
                <li key={idx}>{r}</li>
              ))}
              <li>
                <strong>Review Consensus:</strong> {topPick.reviewInsight}
              </li>
            </ul>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onSelectMovie(topPick.movie)}
              className="inline-flex items-center gap-2 bg-[#e11d48] hover:bg-[#be0037] text-[#fffaf9] font-semibold text-xs px-5 py-2.5 rounded-full transition-colors cursor-pointer"
            >
              <span>View Full Details</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                onSelectMovie(topPick.movie);
                onNavigate('where-to-watch');
              }}
              className="inline-flex items-center gap-2 bg-[#2a292f] hover:bg-[#35343a] text-[#e4e1e9] border border-[#5c3f40]/40 font-semibold text-xs px-5 py-2.5 rounded-full transition-colors cursor-pointer"
            >
              <span>Where to Watch</span>
            </button>
          </div>
        </section>
      )}

      {/* Visible Agent Execution Log */}
      <AgentExecutionLogPanel result={result} isLoading={isLoading} />
    </div>
  );
};
