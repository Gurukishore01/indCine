import React from 'react';
import {
  ArrowLeft,
  Award,
  ExternalLink,
  Film,
  PlayCircle,
  Star,
  Ticket,
} from 'lucide-react';
import { Movie, RouteId } from '../types/aios';

interface MovieDetailsPageProps {
  movie: Movie;
  onBack: () => void;
  onNavigate: (route: RouteId) => void;
}

export const MovieDetailsPage: React.FC<MovieDetailsPageProps> = ({
  movie,
  onBack,
  onNavigate,
}) => {
  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1f1f25] border border-[#5c3f40]/30 text-xs font-semibold text-[#e5bdbe] hover:text-[#e4e1e9] cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Movies</span>
        </button>
        <span className="text-xs text-[#ac8889]">
          Source: {movie.dataSource}
        </span>
      </div>

      {/* Hero Section */}
      <section className="relative rounded-3xl overflow-hidden border border-[#5c3f40]/30 bg-[#0e0e13]">
        {movie.backdropUrl && (
          <img
            src={movie.backdropUrl}
            alt={`${movie.title} backdrop`}
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover opacity-30"
          />
        )}
        <div className="relative z-10 bg-gradient-to-t from-[#0e0e13] via-[#0e0e13]/80 to-transparent p-6 md:p-10">
          <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-end">
            {/* Poster Card */}
            <div className="w-48 sm:w-56 aspect-[2/3] rounded-2xl bg-[#1b1b20] border border-white/10 overflow-hidden shrink-0">
              {movie.posterUrl ? (
                <img
                  src={movie.posterUrl}
                  alt={movie.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full p-5 flex flex-col items-center justify-center text-center gap-2">
                  <Film className="w-10 h-10 text-[#ac8889]" />
                  <span className="text-xs text-[#ac8889]">No Poster Available</span>
                </div>
              )}
            </div>

          {/* Title & Actions */}
          <div className="flex-1 space-y-4">
            <div className="flex flex-wrap items-center gap-3 text-xs text-[#e5bdbe]">
              <span>{movie.releaseDate}</span>
              <span aria-hidden="true">·</span>
              <span>{movie.genres.join(' / ')}</span>
              <span aria-hidden="true">·</span>
              <span>Directed by {movie.director}</span>
            </div>

            <h1 className="text-3xl md:text-5xl font-bold text-[#e4e1e9] tracking-tight">
              {movie.title}
            </h1>

            {/* Sourced Ratings (Never mixed into one unlabeled score) */}
            <div className="flex flex-wrap items-center gap-4 pt-1">
              {movie.ratings.map((r) => (
                <div
                  key={r.source}
                  className="bg-[#0e0e13]/80 border border-[#5c3f40]/40 rounded-xl px-4 py-2 flex items-center gap-2.5"
                >
                  <Star className="w-4 h-4 text-[#ffb95f] fill-current" />
                  <div>
                    <div className="text-sm font-bold text-[#e4e1e9] font-mono-tabular">
                      {r.score} / {r.maxScore}
                    </div>
                    <div className="text-[11px] text-[#ac8889]">
                      {r.source} {r.voteCount ? `(${r.voteCount})` : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => onNavigate('where-to-watch')}
                className="inline-flex items-center gap-2 bg-[#e11d48] hover:bg-[#be0037] text-[#fffaf9] font-semibold text-sm px-6 py-3 rounded-full transition-colors cursor-pointer"
              >
                <PlayCircle className="w-4 h-4" />
                <span>Where to Watch</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('in-theatres')}
                className="inline-flex items-center gap-2 bg-[#ee9800] hover:bg-[#ffb95f] text-[#2a1700] font-semibold text-sm px-6 py-3 rounded-full transition-colors cursor-pointer"
              >
                <Ticket className="w-4 h-4" />
                <span>Book Cinema Tickets</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      </section>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          {/* Storyline */}
          <section className="bg-[#1b1b20] p-6 rounded-2xl border border-[#5c3f40]/30 space-y-3">
            <h2 className="text-lg font-bold text-[#e4e1e9]">
              Storyline &amp; Overview
            </h2>
            <p className="text-sm md:text-base text-[#e4e1e9]/90 leading-relaxed">
              {movie.synopsis}
            </p>
            <div className="pt-3 border-t border-[#5c3f40]/20 text-xs text-[#ac8889]">
              Writers: {movie.writers.join(', ')}
            </div>
          </section>

          {/* Cast */}
          <section className="bg-[#1b1b20] p-6 rounded-2xl border border-[#5c3f40]/30 space-y-4">
            <h2 className="text-lg font-bold text-[#e4e1e9]">Top Billed Cast</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {movie.cast.map((member) => (
                <div
                  key={member.name}
                  className="p-3.5 rounded-xl bg-[#1f1f25] border border-[#5c3f40]/20"
                >
                  <div className="text-sm font-semibold text-[#e4e1e9]">
                    {member.name}
                  </div>
                  <div className="text-xs text-[#ac8889]">{member.role}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Critic & Audience Consensus */}
          <section className="bg-[#1b1b20] p-6 rounded-2xl border border-[#5c3f40]/30 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#e4e1e9]">
                Critic &amp; Audience Consensus
              </h2>
              <a
                href={movie.reviewSummary.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-[#ffb3b6] hover:underline"
              >
                <span>{movie.reviewSummary.sourceName}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="space-y-3 text-sm">
              <div className="p-4 rounded-xl bg-[#1f1f25] border border-[#5c3f40]/20">
                <div className="text-xs font-semibold text-[#ffb95f] mb-1">
                  Critic Consensus ({movie.reviewSummary.sampleSize})
                </div>
                <p className="text-[#e4e1e9]/90">
                  {movie.reviewSummary.criticConsensus}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-[#1f1f25] border border-[#5c3f40]/20">
                <div className="text-xs font-semibold text-[#7bd0ff] mb-1">
                  Audience Reception
                </div>
                <p className="text-[#e4e1e9]/90">
                  {movie.reviewSummary.audienceConsensus}
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar: Box Office & Awards Evidence */}
        <aside className="lg:col-span-4 space-y-6">
          {/* Box Office Evidence */}
          <section className="bg-[#1b1b20] p-6 rounded-2xl border border-[#5c3f40]/30 space-y-4">
            <h3 className="text-base font-bold text-[#e4e1e9]">
              Box Office &amp; Commercial Evidence
            </h3>
            {movie.boxOffice ? (
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-[#1f1f25] border border-[#5c3f40]/20">
                  <span className="text-[#ac8889] block">Assessment</span>
                  <span className="text-sm font-bold text-[#ffb95f]">
                    {movie.boxOffice.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-xl bg-[#1f1f25]">
                    <span className="text-[#ac8889] block">Budget</span>
                    <span className="font-mono-tabular font-semibold text-[#e4e1e9]">
                      {movie.boxOffice.budget || 'Unavailable'}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#1f1f25]">
                    <span className="text-[#ac8889] block">Worldwide Gross</span>
                    <span className="font-mono-tabular font-semibold text-[#e4e1e9]">
                      {movie.boxOffice.worldwideGross || 'Unavailable'}
                    </span>
                  </div>
                </div>
                <p className="text-[#ac8889] leading-relaxed">
                  {movie.boxOffice.methodologyNote}
                </p>
                <a
                  href={movie.boxOffice.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[#ffb3b6] hover:underline"
                >
                  <span>Source: {movie.boxOffice.sourceName}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ) : (
              <p className="text-xs text-[#ac8889]">
                Insufficient reliable box-office data available.
              </p>
            )}
          </section>

          {/* Awards & Recognition */}
          <section className="bg-[#1b1b20] p-6 rounded-2xl border border-[#5c3f40]/30 space-y-3">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-[#ffb95f]" />
              <h3 className="text-base font-bold text-[#e4e1e9]">
                Awards &amp; Recognition
              </h3>
            </div>
            {movie.awards.length > 0 ? (
              <div className="space-y-2.5">
                {movie.awards.map((aw, idx) => (
                  <a
                    key={idx}
                    href={aw.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-3 rounded-xl bg-[#1f1f25] hover:bg-[#2a292f] border border-[#5c3f40]/20 text-xs"
                  >
                    <div className="font-semibold text-[#e4e1e9]">
                      {aw.body} ({aw.year})
                    </div>
                    <div className="text-[#ffb95f] mt-0.5">{aw.category}</div>
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#ac8889]">
                No major international award records logged in demo catalog.
              </p>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
};
