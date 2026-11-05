import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ExternalLink,
  Film,
  Globe,
  Info,
  RefreshCw,
  Ticket,
} from 'lucide-react';
import {
  Movie,
  MovieAvailabilityResponse,
  NormalizedWatchProvider,
} from '../types/aios';
import { safeFetchJson } from '../utils/safeFetchJson';

interface WhereToWatchPageProps {
  movie: Movie;
  movies: Movie[];
  onSelectMovie: (movie: Movie) => void;
  onBack: () => void;
}

const TERRITORIES = [
  { code: 'IN', label: 'India (IN)' },
  { code: 'US', label: 'United States (US)' },
  { code: 'GB', label: 'United Kingdom (GB)' },
  { code: 'CA', label: 'Canada (CA)' },
  { code: 'AU', label: 'Australia (AU)' },
];

const CITIES_BY_TERRITORY: Record<string, string[]> = {
  IN: ['Chennai', 'Mumbai', 'Bengaluru', 'Delhi', 'Hyderabad', 'Kochi'],
  US: ['New York', 'Los Angeles', 'Chicago', 'Austin', 'Seattle'],
  GB: ['London', 'Manchester', 'Edinburgh', 'Birmingham'],
  CA: ['Toronto', 'Vancouver', 'Montreal'],
  AU: ['Sydney', 'Melbourne', 'Brisbane'],
};

const STATUS_STYLES: Record<
  MovieAvailabilityResponse['status'],
  { label: string; className: string }
> = {
  OTT_AVAILABLE: {
    label: 'OTT Available',
    className: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  },
  THEATRICAL_VERIFIED: {
    label: 'Currently in Theatres',
    className: 'bg-[#ee9800]/20 text-[#ffb95f] border-[#ee9800]/40',
  },
  OTT_AND_THEATRICAL: {
    label: 'OTT & Theatres',
    className: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  },
  NO_OTT_LISTING: {
    label: 'No OTT Listing',
    className: 'bg-[#2a292f] text-[#e5bdbe] border-[#5c3f40]/40',
  },
  UPCOMING_RELEASE: {
    label: 'Upcoming Release',
    className: 'bg-[#ee9800]/20 text-[#ffb95f] border-[#ee9800]/40',
  },
  AVAILABILITY_UNKNOWN: {
    label: 'Availability Unknown',
    className: 'bg-[#93000a]/30 text-[#ffb4ab] border-[#ffb4ab]/40',
  },
};

export const WhereToWatchPage: React.FC<WhereToWatchPageProps> = ({
  movie,
  movies,
  onSelectMovie,
  onBack,
}) => {
  const [territory, setTerritory] = useState('IN');
  const [city, setCity] = useState('Chennai');
  const [availability, setAvailability] = useState<MovieAvailabilityResponse | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const cities = CITIES_BY_TERRITORY[territory] || ['Chennai'];
    if (!cities.includes(city)) {
      setCity(cities[0]);
    }
  }, [territory, city]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    setAvailability(null);

    safeFetchJson<MovieAvailabilityResponse>(
      `/api/movies/${encodeURIComponent(movie.id)}/availability?region=${encodeURIComponent(
        territory
      )}`
    )
      .then((data) => {
        if (cancelled) return;
        setAvailability(data);
        if (data.error) {
          setError(data.error);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : 'Failed to verify regional availability.'
        );
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [movie.id, territory, reloadKey]);

  const territoryName =
    TERRITORIES.find((t) => t.code === territory)?.label.split(' (')[0] || territory;

  const renderProviderGroup = (
    title: string,
    providers: NormalizedWatchProvider[]
  ) => {
    if (!providers || providers.length === 0) return null;
    return (
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#ffb95f]">
          {title} ({providers.length})
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {providers.map((prov) => (
            <div
              key={`${prov.category}-${prov.providerId}`}
              className="bg-[#1b1b20] border border-[#5c3f40]/30 rounded-2xl p-4 flex flex-col justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                {prov.logoUrl ? (
                  <img
                    src={prov.logoUrl}
                    alt={prov.providerName}
                    referrerPolicy="no-referrer"
                    className="w-11 h-11 rounded-xl object-cover shrink-0 bg-[#0e0e13]"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-xl bg-[#0e0e13] flex items-center justify-center shrink-0">
                    <Film className="w-5 h-5 text-[#ac8889]" />
                  </div>
                )}
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-[#e4e1e9] truncate">
                    {prov.providerName}
                  </h4>
                  <span className="text-[11px] text-[#ac8889] block truncate">
                    {prov.categoryLabel}
                  </span>
                </div>
              </div>

              <a
                href={prov.destinationUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-xl bg-[#2a292f] hover:bg-[#e11d48] text-[#e4e1e9] hover:text-[#fffaf9] text-xs font-semibold transition-colors"
              >
                <span>{prov.actionLabel}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const statusInfo = availability
    ? STATUS_STYLES[availability.status]
    : STATUS_STYLES.AVAILABILITY_UNKNOWN;

  const cinemaQuery = encodeURIComponent(`${movie.title} ${city} showtimes tickets`);

  return (
    <div className="space-y-8">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1f1f25] border border-[#5c3f40]/30 text-xs font-semibold text-[#e5bdbe] hover:text-[#e4e1e9] cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Movie Details</span>
        </button>

        {movies.length > 0 && (
          <div className="flex items-center gap-2">
            <label htmlFor="title-switcher" className="text-xs text-[#ac8889]">
              Title:
            </label>
            <select
              id="title-switcher"
              value={movie.id}
              onChange={(e) => {
                const found = movies.find((m) => m.id === e.target.value);
                if (found) onSelectMovie(found);
              }}
              className="bg-[#1f1f25] text-[#e4e1e9] text-xs font-semibold rounded-lg px-3 py-1.5 border border-[#5c3f40]/40"
            >
              {!movies.some((m) => m.id === movie.id) && (
                <option value={movie.id}>
                  {movie.title} ({movie.year || 'TBA'})
                </option>
              )}
              {movies.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title} ({m.year || 'TBA'})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Movie Context Banner */}
      <section className="rounded-2xl bg-[#1b1b20] border border-[#5c3f40]/30 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {movie.posterUrl && (
            <img
              src={movie.posterUrl}
              alt={movie.title}
              referrerPolicy="no-referrer"
              className="w-16 h-24 rounded-xl object-cover shrink-0 border border-[#5c3f40]/30"
            />
          )}
          <div className="space-y-1">
            <div className="text-xs text-[#ffb95f] font-semibold uppercase tracking-wider">
              Regional OTT &amp; Cinema Availability
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#e4e1e9]">
              {movie.title} ({movie.year || 'TBA'})
            </h1>
            <p className="text-xs text-[#ac8889]">
              {movie.runtimeMinutes > 0 ? `${movie.runtimeMinutes}m · ` : ''}
              {movie.language} · {movie.genres.join(', ')}
            </p>
          </div>
        </div>

        {availability && (
          <span
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold border shrink-0 ${statusInfo.className}`}
          >
            {statusInfo.label}
          </span>
        )}
      </section>

      {/* Territory Selector */}
      <section className="bg-[#1b1b20] p-4 rounded-xl border border-[#5c3f40]/30 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-[#e5bdbe] inline-flex items-center gap-1.5 mr-2">
            <Globe className="w-4 h-4 text-[#ffb3b6]" />
            Territory:
          </span>
          {TERRITORIES.map((t) => (
            <button
              key={t.code}
              type="button"
              onClick={() => setTerritory(t.code)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                territory === t.code
                  ? 'bg-[#e11d48] text-[#fffaf9]'
                  : 'bg-[#1f1f25] text-[#e5bdbe] hover:bg-[#2a292f] border border-[#5c3f40]/30'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {availability?.retrievedAt && (
          <span className="text-[11px] font-mono-tabular text-[#ac8889]">
            Checked: {new Date(availability.retrievedAt).toLocaleTimeString()}
          </span>
        )}
      </section>

      {/* Dynamic OTT Providers */}
      <section className="space-y-6">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-32 rounded-2xl bg-[#1b1b20] animate-pulse border border-[#5c3f40]/20"
              />
            ))}
          </div>
        ) : error ? (
          <div className="bg-[#93000a]/30 border border-[#ffb4ab]/40 rounded-2xl p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-xs text-[#ffb4ab]">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => setReloadKey((k) => k + 1)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2a292f] text-xs font-semibold text-[#e4e1e9] cursor-pointer shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry
            </button>
          </div>
        ) : availability && availability.status === 'OTT_AVAILABLE' ? (
          <div className="space-y-6">
            {renderProviderGroup('Subscription Streaming', availability.flatrate)}
            {renderProviderGroup('Free Streaming', availability.free)}
            {renderProviderGroup('Ad-Supported Streaming', availability.ads)}
            {renderProviderGroup('Rent', availability.rent)}
            {renderProviderGroup('Buy', availability.buy)}
          </div>
        ) : (
          <div className="bg-[#1b1b20] border border-[#5c3f40]/30 rounded-2xl p-6 space-y-2">
            <p className="text-sm font-semibold text-[#e4e1e9]">
              {availability?.status === 'UPCOMING_RELEASE'
                ? `${movie.title} is an upcoming release and is not yet available on OTT platforms in ${territoryName}.`
                : `No verified OTT availability found for this title in ${territoryName}. Check local cinema listings or try again later.`}
            </p>
            <p className="text-xs text-[#ac8889]">
              CINEMIND only displays platforms that actively list this title in {territoryName}.
            </p>
          </div>
        )}
      </section>

      {/* Separate Cinema Availability & Ticket Booking Section */}
      <section className="bg-[#1b1b20] border border-[#5c3f40]/30 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-[#ffb95f]" />
            <h2 className="text-lg font-bold text-[#e4e1e9]">
              Cinema Availability &amp; Ticket Search
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="city-select" className="text-xs text-[#ac8889]">
              City:
            </label>
            <select
              id="city-select"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="bg-[#0e0e13] border border-[#5c3f40]/40 rounded-lg px-3 py-1.5 text-xs text-[#e4e1e9]"
            >
              {(CITIES_BY_TERRITORY[territory] || ['Chennai']).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <p className="text-xs text-[#ac8889]">
          {availability?.cinemaNote ||
            'No verified live cinema showtime API connected. Use external ticket-booking search below to check local listings.'}
        </p>

        <div className="flex flex-wrap gap-3">
          {territory === 'IN' && (
            <>
              <a
                href={`https://in.bookmyshow.com/explore/movies-${city.toLowerCase()}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2a292f] hover:bg-[#e11d48] text-xs font-semibold text-[#e4e1e9] transition-colors"
              >
                <span>Check BookMyShow in {city}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <a
                href="https://www.pvrcinemas.com/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2a292f] hover:bg-[#e11d48] text-xs font-semibold text-[#e4e1e9] transition-colors"
              >
                <span>Check PVR INOX</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </>
          )}
          <a
            href={`https://www.google.com/search?q=${cinemaQuery}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2a292f] hover:bg-[#e11d48] text-xs font-semibold text-[#e4e1e9] transition-colors"
          >
            <span>
              Check cinema listings for {movie.title} in {city}
            </span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </section>

      {/* JustWatch & TMDB Attribution */}
      <section className="bg-[#0e0e13] border border-[#5c3f40]/25 rounded-xl p-4 flex items-center gap-3 text-xs text-[#ac8889]">
        <Info className="w-4 h-4 text-[#ffb95f] shrink-0" />
        <span>
          {availability?.attribution ||
            'Watch provider data powered by JustWatch via TMDB API v3.'}{' '}
          CINEMIND is not endorsed by TMDB, JustWatch, or any streaming/ticketing provider.
        </span>
      </section>
    </div>
  );
};
