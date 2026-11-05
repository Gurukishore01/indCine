import React from 'react';
import { Film, Ticket } from 'lucide-react';
import { RouteId } from '../../types/aios';

interface TopNavBarProps {
  activeRoute: RouteId;
  onNavigate: (route: RouteId) => void;
}

const NAV_ITEMS: { id: RouteId; label: string }[] = [
  { id: 'discover', label: 'Discover' },
  { id: 'search', label: 'Search' },
  { id: 'in-theatres', label: 'In Theatres' },
  { id: 'where-to-watch', label: 'Where to Watch' },
  { id: 'quick-pick', label: 'Quick Pick' },
];

export const TopNavBar: React.FC<TopNavBarProps> = ({ activeRoute, onNavigate }) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-[#0e0e13]/95 backdrop-blur-md border-b border-[#5c3f40]/30">
      <div className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <button
          type="button"
          onClick={() => onNavigate('discover')}
          className="flex items-center gap-2.5 text-xl font-bold tracking-tight text-[#e4e1e9] whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#e11d48] rounded-lg"
        >
          <span className="w-8 h-8 rounded-lg bg-[#e11d48] flex items-center justify-center text-[#fffaf9]">
            <Film className="w-4 h-4" />
          </span>
          <span className="font-display tracking-wider">CINEMIND</span>
        </button>

        {/* Zone 2: 5 Concise Single-Line Navigation Links */}
        <nav className="hidden md:flex items-center gap-6" aria-label="Primary Navigation">
          {NAV_ITEMS.map((item) => {
            const isActive =
              activeRoute === item.id ||
              (activeRoute === 'details' && item.id === 'discover');
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`text-sm font-semibold whitespace-nowrap shrink-0 pb-1 transition-colors cursor-pointer ${
                  isActive
                    ? 'text-[#ffb3b6] border-b-2 border-[#e11d48]'
                    : 'text-[#e5bdbe]/80 hover:text-[#e4e1e9]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('in-theatres')}
            className="inline-flex items-center gap-2 bg-[#ee9800] hover:bg-[#ffb95f] text-[#2a1700] font-semibold text-xs px-4 py-2 rounded-full transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Ticket className="w-3.5 h-3.5" />
            <span>Get Tickets</span>
          </button>
        </div>
      </div>

      {/* Mobile Navigation Strip */}
      <nav
        className="flex md:hidden items-center gap-4 px-5 py-2 overflow-x-auto border-t border-[#5c3f40]/20 custom-scrollbar"
        aria-label="Mobile Navigation"
      >
        {NAV_ITEMS.map((item) => {
          const isActive = activeRoute === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`text-xs font-semibold whitespace-nowrap shrink-0 pb-0.5 ${
                isActive
                  ? 'text-[#ffb3b6] border-b-2 border-[#e11d48]'
                  : 'text-[#e5bdbe]/80'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
};
