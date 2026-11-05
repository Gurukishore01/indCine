import React, { useMemo, useState } from 'react';
import {
  Calendar,
  ExternalLink,
  Film,
  Info,
  MapPin,
  Search,
  Ticket,
} from 'lucide-react';
import { Movie } from '../types/aios';
import { INTERNATIONAL_COUNTRIES } from '../data/locations';

interface CinemaTicketsPageProps {
  movie: Movie;
  movies: Movie[];
  onSelectMovie: (movie: Movie) => void;
}

const FORMATS = ['All Formats', 'IMAX Laser', 'Dolby Atmos', '4DX'] as const;

function getTodayLocalDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDisplayDate(isoDate: string): string {
  if (!isoDate) return '';
  const [y, m, d] = isoDate.split('-').map(Number);
  if (!y || !m || !d) return isoDate;
  const dateObj = new Date(y, m - 1, d);
  return dateObj.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

interface BookingDestination {
  name: string;
  description: string;
  actionLabel: string;
  url: string;
}

function buildBookingDestinations(
  countryCode: string,
  locality: string,
  movieTitle: string,
  isoDate: string,
  format: string
): BookingDestination[] {
  const formatPart = format !== 'All Formats' ? ` ${format}` : '';
  const query = encodeURIComponent(
    `${movieTitle} ${locality} ${isoDate}${formatPart} tickets`
  );
  const localitySlug = locality
    .toLowerCase()
    .replace(/\([^)]*\)/g, '')
    .trim()
    .replace(/\s+/g, '-');

  if (countryCode === 'IN') {
    return [
      {
        name: 'BookMyShow',
        description: `Search for ${movieTitle} in ${locality}.`,
        actionLabel: 'Search on BookMyShow',
        url: `https://in.bookmyshow.com/explore/movies-${localitySlug}`,
      },
      {
        name: 'District',
        description: `Check cinema listings for ${movieTitle} in ${locality}.`,
        actionLabel: 'Check listings on District',
        url: `https://www.district.in/movies/?q=${encodeURIComponent(movieTitle)}`,
      },
      {
        name: 'PVR INOX',
        description: `Check PVR INOX cinema listings${
          format !== 'All Formats' ? ` (${format} preference)` : ''
        }.`,
        actionLabel: 'Check listings on PVR INOX',
        url: `https://www.pvrcinemas.com/`,
      },
      {
        name: 'Google Ticket Search',
        description: `Search showtimes for ${movieTitle} in ${locality} on ${formatDisplayDate(
          isoDate
        )}.`,
        actionLabel: 'Search showtimes on Google',
        url: `https://www.google.com/search?q=${query}`,
      },
    ];
  }

  if (countryCode === 'US') {
    return [
      {
        name: 'Fandango',
        description: `Search for ${movieTitle} in ${locality}.`,
        actionLabel: 'Search on Fandango',
        url: `https://www.fandango.com/search?q=${encodeURIComponent(
          `${movieTitle} ${locality}`
        )}`,
      },
      {
        name: 'AMC Theatres',
        description: `Check AMC showtimes for ${movieTitle} in ${locality}.`,
        actionLabel: 'Check listings on AMC',
        url: `https://www.amctheatres.com/search?q=${encodeURIComponent(movieTitle)}`,
      },
      {
        name: 'Regal',
        description: `Check Regal cinema listings in ${locality}.`,
        actionLabel: 'Check listings on Regal',
        url: `https://www.regmovies.com/search?query=${encodeURIComponent(movieTitle)}`,
      },
    ];
  }

  if (countryCode === 'GB') {
    return [
      {
        name: 'ODEON',
        description: `Check ODEON cinema listings in ${locality}.`,
        actionLabel: 'Check listings on ODEON',
        url: `https://www.odeon.co.uk/`,
      },
      {
        name: 'Vue',
        description: `Check Vue cinema listings in ${locality}.`,
        actionLabel: 'Check listings on Vue',
        url: `https://www.myvue.com/`,
      },
      {
        name: 'Cineworld',
        description: `Check Cineworld listings in ${locality}.`,
        actionLabel: 'Check listings on Cineworld',
        url: `https://www.cineworld.co.uk/`,
      },
    ];
  }

  if (countryCode === 'CA') {
    return [
      {
        name: 'Cineplex',
        description: `Search Cineplex showtimes for ${movieTitle} in ${locality}.`,
        actionLabel: 'Search on Cineplex',
        url: `https://www.cineplex.com/Search?search=${encodeURIComponent(movieTitle)}`,
      },
      {
        name: 'Google Ticket Search',
        description: `Search showtimes for ${movieTitle} in ${locality}.`,
        actionLabel: 'Search showtimes on Google',
        url: `https://www.google.com/search?q=${query}`,
      },
    ];
  }

  return [
    {
      name: 'HOYTS',
      description: `Check HOYTS cinema listings in ${locality}.`,
      actionLabel: 'Check listings on HOYTS',
      url: `https://www.hoyts.com.au/`,
    },
    {
      name: 'Google Ticket Search',
      description: `Search showtimes for ${movieTitle} in ${locality}.`,
      actionLabel: 'Search showtimes on Google',
      url: `https://www.google.com/search?q=${query}`,
    },
  ];
}

export const CinemaTicketsPage: React.FC<CinemaTicketsPageProps> = ({
  movie,
  movies,
  onSelectMovie,
}) => {
  const todayLocal = useMemo(() => getTodayLocalDate(), []);
  const [countryCode, setCountryCode] = useState<string>('IN');
  const [subdivision, setSubdivision] = useState<string>('Tamil Nadu');
  const [locality, setLocality] = useState<string>('Chennai');
  const [selectedDate, setSelectedDate] = useState<string>(todayLocal);
  const [selectedFormat, setSelectedFormat] = useState<string>('All Formats');
  const [hasSearched, setHasSearched] = useState<boolean>(false);

  const countryConfig = useMemo(
    () =>
      INTERNATIONAL_COUNTRIES.find((c) => c.code === countryCode) ||
      INTERNATIONAL_COUNTRIES[0],
    [countryCode]
  );

  const subdivisionNames = useMemo(
    () => Object.keys(countryConfig.subdivisions),
    [countryConfig]
  );

  const localityNames = useMemo(
    () => (subdivision ? countryConfig.subdivisions[subdivision] || [] : []),
    [countryConfig, subdivision]
  );

  const handleCountryChange = (newCode: string) => {
    setCountryCode(newCode);
    const nextCountry =
      INTERNATIONAL_COUNTRIES.find((c) => c.code === newCode) ||
      INTERNATIONAL_COUNTRIES[0];
    const firstSub = Object.keys(nextCountry.subdivisions)[0] || '';
    setSubdivision(firstSub);
    setLocality('');
    setHasSearched(false);
  };

  const handleSubdivisionChange = (newSub: string) => {
    setSubdivision(newSub);
    setLocality('');
    setHasSearched(false);
  };

  const canSearch = Boolean(
    movie?.id && countryCode && subdivision && locality && selectedDate
  );

  const destinations = useMemo(
    () =>
      canSearch
        ? buildBookingDestinations(
            countryCode,
            locality,
            movie.title,
            selectedDate,
            selectedFormat
          )
        : [],
    [canSearch, countryCode, locality, movie.title, selectedDate, selectedFormat]
  );

  return (
    <div className="space-y-6">
      {/* SECTION 1 — Selected Movie */}
      <section className="rounded-2xl bg-[#1b1b20] border border-[#5c3f40]/30 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {movie.posterUrl ? (
            <img
              src={movie.posterUrl}
              alt={movie.title}
              referrerPolicy="no-referrer"
              className="w-16 h-24 rounded-xl object-cover shrink-0 border border-[#5c3f40]/30"
            />
          ) : (
            <div className="w-16 h-24 rounded-xl bg-[#0e0e13] flex items-center justify-center shrink-0 border border-[#5c3f40]/30">
              <Film className="w-6 h-6 text-[#ac8889]" />
            </div>
          )}
          <div>
            <div className="text-xs font-semibold text-[#ffb95f] uppercase tracking-wider">
              Theatrical Showtimes &amp; Ticketing
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#e4e1e9] mt-0.5">
              In Theatres: {movie.title}
            </h1>
            <p className="text-xs text-[#ac8889] mt-1">
              {movie.year || 'TBA'} ·{' '}
              {movie.runtimeMinutes > 0 ? `${movie.runtimeMinutes}m` : 'Runtime N/A'} ·{' '}
              {movie.language}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="cinema-movie-select" className="text-xs text-[#ac8889]">
            Film:
          </label>
          <select
            id="cinema-movie-select"
            value={movie.id}
            onChange={(e) => {
              const found = movies.find((m) => m.id === e.target.value);
              if (found) onSelectMovie(found);
            }}
            className="bg-[#1f1f25] text-[#e4e1e9] text-xs font-semibold rounded-lg px-3 py-2 border border-[#5c3f40]/40"
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
      </section>

      {/* SECTION 2 — Location (Country -> State/UT -> District/City) */}
      <section className="bg-[#1b1b20] p-5 rounded-2xl border border-[#5c3f40]/30 space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#e5bdbe]">
          <MapPin className="w-4 h-4 text-[#e11d48]" />
          <span>Select Location</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label
              htmlFor="cinema-country-select"
              className="block text-xs text-[#ac8889] mb-1.5"
            >
              Country
            </label>
            <select
              id="cinema-country-select"
              value={countryCode}
              onChange={(e) => handleCountryChange(e.target.value)}
              className="w-full bg-[#0e0e13] text-[#e4e1e9] text-xs font-semibold rounded-lg px-3 py-2.5 border border-[#5c3f40]/40 outline-none focus:border-[#e11d48]"
            >
              {INTERNATIONAL_COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="cinema-subdivision-select"
              className="block text-xs text-[#ac8889] mb-1.5"
            >
              {countryConfig.subdivisionLabel}
            </label>
            <select
              id="cinema-subdivision-select"
              value={subdivision}
              onChange={(e) => handleSubdivisionChange(e.target.value)}
              className="w-full bg-[#0e0e13] text-[#e4e1e9] text-xs font-semibold rounded-lg px-3 py-2.5 border border-[#5c3f40]/40 outline-none focus:border-[#e11d48]"
            >
              <option value="">Select {countryConfig.subdivisionLabel}</option>
              {subdivisionNames.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="cinema-locality-select"
              className="block text-xs text-[#ac8889] mb-1.5"
            >
              {countryConfig.localityLabel}
            </label>
            <select
              id="cinema-locality-select"
              value={locality}
              disabled={!subdivision}
              onChange={(e) => {
                setLocality(e.target.value);
                setHasSearched(false);
              }}
              className="w-full bg-[#0e0e13] text-[#e4e1e9] text-xs font-semibold rounded-lg px-3 py-2.5 border border-[#5c3f40]/40 outline-none focus:border-[#e11d48] disabled:opacity-50"
            >
              <option value="">
                {subdivision
                  ? `Select ${countryConfig.localityLabel}`
                  : `Select ${countryConfig.subdivisionLabel} first`}
              </option>
              {localityNames.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* SECTION 3 — Date and Format */}
      <section className="bg-[#1b1b20] p-5 rounded-2xl border border-[#5c3f40]/30 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <div>
            <label
              htmlFor="cinema-date-picker"
              className="block text-xs text-[#ac8889] mb-1.5 flex items-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5 text-[#ffb95f]" />
              <span>Select Date ({formatDisplayDate(selectedDate)})</span>
            </label>
            <input
              id="cinema-date-picker"
              type="date"
              min={todayLocal}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-[#0e0e13] text-[#e4e1e9] text-xs font-semibold rounded-lg px-3 py-2.5 border border-[#5c3f40]/40 outline-none focus:border-[#e11d48]"
            />
          </div>

          <div>
            <span className="block text-xs text-[#ac8889] mb-1.5">
              Preferred Format (Search Preference):
            </span>
            <div className="flex flex-wrap gap-2">
              {FORMATS.map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => setSelectedFormat(fmt)}
                  className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    selectedFormat === fmt
                      ? 'bg-[#ee9800] text-[#2a1700]'
                      : 'bg-[#0e0e13] text-[#e5bdbe] hover:bg-[#2a292f] border border-[#5c3f40]/30'
                  }`}
                >
                  {fmt}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* SECTION 4 — Search */}
        <div className="pt-3 border-t border-[#5c3f40]/20 flex items-center justify-between gap-4">
          <span className="text-xs text-[#ac8889]">
            {canSearch
              ? `${movie.title} · ${subdivision} → ${locality} · ${formatDisplayDate(
                  selectedDate
                )}`
              : `Please select a ${countryConfig.localityLabel.toLowerCase()} to enable ticket search.`}
          </span>
          <button
            type="button"
            disabled={!canSearch}
            onClick={() => setHasSearched(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#e11d48] to-[#be123c] text-[#fffaf9] text-xs font-bold shadow-lg hover:brightness-110 disabled:opacity-40 transition-all cursor-pointer shrink-0"
          >
            <Search className="w-4 h-4" />
            <span>Find Showtimes</span>
          </button>
        </div>
      </section>

      {/* SECTION 5 — Ticket Booking Destinations */}
      {hasSearched && canSearch && (
        <section className="bg-[#1b1b20] p-6 rounded-2xl border border-[#5c3f40]/30 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-[#e4e1e9] flex items-center gap-2">
                <Ticket className="w-5 h-5 text-[#ffb95f]" />
                <span>Available Booking Destinations</span>
              </h2>
              <p className="text-xs text-[#ac8889] mt-0.5">
                Movie: {movie.title} · Location: {subdivision} → {locality} · Date:{' '}
                {formatDisplayDate(selectedDate)} · Format: {selectedFormat}
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#ee9800]/20 text-[#ffb95f] border border-[#ee9800]/40">
              EXTERNAL_SEARCH_AVAILABLE
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {destinations.map((dest) => (
              <div
                key={dest.name}
                className="bg-[#0e0e13] border border-[#5c3f40]/30 rounded-xl p-4 flex flex-col justify-between gap-4"
              >
                <div>
                  <h3 className="text-sm font-bold text-[#e4e1e9]">{dest.name}</h3>
                  <p className="text-xs text-[#ac8889] mt-1">{dest.description}</p>
                </div>
                <a
                  href={dest.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-lg bg-[#2a292f] hover:bg-[#e11d48] text-xs font-semibold text-[#e4e1e9] hover:text-[#fffaf9] transition-colors"
                >
                  <span>{dest.actionLabel}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* SECTION 6 — Availability Information */}
      <section className="bg-[#0e0e13] border border-[#5c3f40]/25 rounded-xl p-4 flex items-center gap-3 text-xs text-[#ac8889]">
        <Info className="w-4 h-4 text-[#ffb95f] shrink-0" />
        <span>
          Live showtimes are not currently available through CINEMIND. You can search
          directly on the booking platforms below.
        </span>
      </section>
    </div>
  );
};
