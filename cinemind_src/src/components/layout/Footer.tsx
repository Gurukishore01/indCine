import React from 'react';
import { Film } from 'lucide-react';
import { RouteId } from '../../types/aios';

interface FooterProps {
  onNavigate: (route: RouteId) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-[#0e0e13] border-t border-[#5c3f40]/25 mt-16">
      <div className="max-w-7xl mx-auto px-5 py-10 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex flex-col items-center md:items-start gap-1.5">
          <div className="flex items-center gap-2 text-base font-bold text-[#e4e1e9]">
            <span className="w-6 h-6 rounded bg-[#e11d48] flex items-center justify-center text-[#fffaf9]">
              <Film className="w-3.5 h-3.5" />
            </span>
            <span className="font-display tracking-wider">CINEMIND AIOS</span>
          </div>
          <p className="text-xs text-[#ac8889] text-center md:text-left max-w-md">
            Discover. Understand. Decide. Watch. Grounded multi-agent cinema intelligence.
          </p>
          <p className="text-[11px] text-[#ac8889]/75 text-center md:text-left">
            This product uses the TMDB API but is not endorsed or certified by TMDB.
          </p>
        </div>

        <nav className="flex flex-wrap justify-center md:justify-end gap-x-6 gap-y-2 text-xs font-medium text-[#e5bdbe]/80">
          <button
            type="button"
            onClick={() => onNavigate('discover')}
            className="hover:text-[#ffb3b6] transition-colors cursor-pointer"
          >
            Discover
          </button>
          <button
            type="button"
            onClick={() => onNavigate('search')}
            className="hover:text-[#ffb3b6] transition-colors cursor-pointer"
          >
            Search Matrix
          </button>
          <button
            type="button"
            onClick={() => onNavigate('in-theatres')}
            className="hover:text-[#ffb3b6] transition-colors cursor-pointer"
          >
            In Theatres
          </button>
          <button
            type="button"
            onClick={() => onNavigate('where-to-watch')}
            className="hover:text-[#ffb3b6] transition-colors cursor-pointer"
          >
            Where to Watch
          </button>
          <button
            type="button"
            onClick={() => onNavigate('quick-pick')}
            className="hover:text-[#ffb3b6] transition-colors cursor-pointer"
          >
            Quick Pick
          </button>
        </nav>
      </div>
    </footer>
  );
};
