import React from 'react';
import { RouteId } from '../../types/aios';

interface ShellProps {
  activeRoute: RouteId;
  onNavigate: (route: RouteId) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  tmdbConnected?: boolean;
  geminiConnected?: boolean;
  children: React.ReactNode;
}

const NAV_WORKSPACE: Array<{ id: RouteId; label: string; icon: string; badge?: string }> = [
  { id: 'chat', label: 'IndCine AI', icon: '✦', badge: 'NEW' },
  { id: 'pulse', label: 'India Pulse', icon: '◈' },
  { id: 'explorer', label: 'Film Explorer', icon: '▦' },
  { id: 'intelligence', label: 'Film Dossier', icon: '◉' },
  { id: 'ott', label: 'OTT Radar', icon: '▣' },
  { id: 'signals', label: 'Audience Lens', icon: '◎' },
];

const NAV_INDUSTRY: Array<{ id: RouteId; label: string; icon: string }> = [
  { id: 'trends', label: 'Trend Observatory', icon: '⌁' },
  { id: 'boxoffice', label: 'Box Office Tracker', icon: '₹' },
  { id: 'analyst', label: 'AIOS Command Desk', icon: '✧' },
  { id: 'reports', label: 'Intelligence Reports', icon: '◷' },
];

const ROUTE_LABELS: Record<RouteId, string> = {
  chat: 'INDCINE AI CHATBOT',
  pulse: 'INDIA PULSE',
  explorer: 'FILM EXPLORER',
  intelligence: 'FILM DOSSIER',
  ott: 'OTT RADAR',
  signals: 'AUDIENCE LENS',
  trends: 'TREND OBSERVATORY',
  boxoffice: 'BOX OFFICE TRACKER',
  analyst: 'AIOS COMMAND DESK',
  reports: 'INTELLIGENCE REPORTS',
};

export const Shell: React.FC<ShellProps> = ({
  activeRoute,
  onNavigate,
  onRefresh,
  isRefreshing,
  tmdbConnected,
  geminiConnected,
  children,
}) => {
  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-[258px_minmax(0,1fr)] bg-[#090b10] text-[#f2f3f5] font-sans">
      {/* Sidebar */}
      <aside className="md:h-screen md:sticky md:top-0 bg-[#080a0f]/95 border-r border-white/10 p-4 md:py-6 flex flex-col z-20 backdrop-blur-md">
        {/* Brand */}
        <div
          onClick={() => onNavigate('pulse')}
          className="flex items-center gap-3 px-2 pb-6 cursor-pointer group"
        >
          <div className="w-[42px] h-[42px] rounded-[13px] bg-gradient-to-br from-[#ff5b76] to-[#a70c35] grid place-items-center shadow-[0_8px_28px_rgba(255,54,93,0.22)] font-extrabold text-[22px] font-display italic text-white shrink-0">
            I
          </div>
          <div>
            <div className="font-extrabold text-[20px] font-display tracking-[0.05em] text-white group-hover:text-[#ff5b76] transition-colors leading-none">
              INDCINE
            </div>
            <div className="text-[9px] font-mono text-[#f4bd62] tracking-[0.13em] mt-1 font-semibold uppercase">
              INDIAN CINEMA INTELLIGENCE
            </div>
          </div>
        </div>

        {/* Navigation Section 1: Intelligence Workspace */}
        <div className="text-[10px] font-mono text-[#687487] tracking-[0.16em] px-3 pt-2 pb-2 uppercase">
          INTELLIGENCE WORKSPACE
        </div>
        <nav className="grid gap-1 mb-4">
          {NAV_WORKSPACE.map((item) => {
            const isActive = activeRoute === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`text-left px-3 py-2.5 rounded-[10px] flex items-center gap-3 text-[12px] font-medium transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-[#ff365d]/20 to-[#ff365d]/5 border border-[#ff365d]/50 text-white font-semibold shadow-[inset_3px_0_#ff365d,0_5px_20px_rgba(255,54,93,0.1)]'
                    : 'text-[#b5bdc9] hover:text-white hover:bg-white/[0.04] border border-transparent'
                }`}
              >
                <span className={`text-[16px] w-5 text-center ${isActive ? 'text-[#ff6d87]' : 'text-[#91a0b4]'}`}>
                  {item.icon}
                </span>
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded-[4px] bg-[#ff365d]/25 text-[#ff8197] border border-[#ff365d]/40">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Navigation Section 2: Industry Monitor */}
        <div className="text-[10px] font-mono text-[#687487] tracking-[0.16em] px-3 pt-2 pb-2 uppercase">
          INDUSTRY MONITOR
        </div>
        <nav className="grid gap-1">
          {NAV_INDUSTRY.map((item) => {
            const isActive = activeRoute === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`text-left px-3 py-2.5 rounded-[10px] flex items-center gap-3 text-[12px] font-medium transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-[#ff365d]/20 to-[#ff365d]/5 border border-[#ff365d]/50 text-white font-semibold shadow-[inset_3px_0_#ff365d,0_5px_20px_rgba(255,54,93,0.1)]'
                    : 'text-[#b5bdc9] hover:text-white hover:bg-white/[0.04] border border-transparent'
                }`}
              >
                <span className={`text-[16px] w-5 text-center ${isActive ? 'text-[#ff6d87]' : 'text-[#91a0b4]'}`}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom Status & Profile */}
        <div className="mt-auto hidden md:block pt-4">
          <div className="border border-[#344151] bg-[#111720] rounded-[12px] p-3 mb-3">
            <div className="flex items-center gap-2 text-[11px] text-[#f2f3f5] font-semibold">
              <i className="w-2 h-2 rounded-full bg-[#51d6c2] shadow-[0_0_9px_#51d6c277]" />
              <span>System readiness</span>
            </div>
            <div className="text-[9px] font-mono text-[#8c9aac] mt-1.5 leading-relaxed">
              DATA SOURCES · {tmdbConnected ? 'TMDB LIVE CONNECTED' : 'CURATED BENCHMARK READY'}
              <br />
              AGENTS · {geminiConnected ? '10/10 AIOS VERIFIED' : 'DETERMINISTIC MODE'}
            </div>
          </div>

          <div className="flex items-center gap-2.5 pt-3 border-t border-white/10">
            <div className="w-[31px] h-[31px] rounded-full bg-[#253446] text-[#a9c7ff] grid place-items-center font-bold text-[11px] font-display">
              P
            </div>
            <div className="min-w-0">
              <strong className="block text-[11px] text-[#f2f3f5] truncate font-semibold">
                Personal Intelligence Desk
              </strong>
              <small className="block text-[9px] text-[#8793a4] truncate">
                India · All language industries
              </small>
            </div>
          </div>
        </div>
      </aside>

      {/* Main viewport */}
      <main className="min-w-0 px-4 md:px-9 pb-16 max-w-[1650px] w-full mx-auto">
        {/* Topbar */}
        <header className="h-[68px] md:h-[72px] flex items-center justify-between border-b border-white/10 mb-6 md:mb-7">
          <div className="text-[10px] font-mono text-[#8491a2] tracking-[0.08em] flex items-center gap-2">
            <span>INDCINE</span>
            <span className="text-[#495465]">/</span>
            <b className="text-[#e7ebf0] font-semibold">{ROUTE_LABELS[activeRoute] || 'INDIA PULSE'}</b>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="hidden sm:flex items-center gap-2 border border-[#364150] bg-[#111720] text-[#dbe1e9] rounded-[9px] px-3 py-2 text-[10px] font-mono">
              <span className="text-[#51d6c2]">◉</span>
              <span>INDIA · IN ▾</span>
            </div>

            <button
              onClick={() => onNavigate('analyst')}
              className="border border-[#364150] bg-[#111720] text-[#dbe1e9] hover:text-white rounded-[9px] px-3 py-2 text-[10px] font-mono cursor-pointer transition-colors hidden sm:block"
            >
              ⚙ Command Desk
            </button>

            <button
              onClick={() => onNavigate('chat')}
              className={`border rounded-[9px] px-3.5 py-2 text-[10px] font-mono font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
                activeRoute === 'chat'
                  ? 'border-[#ff365d] bg-[#ff365d] text-white'
                  : 'border-[#ff365d]/40 bg-[#ff365d]/10 hover:bg-[#ff365d]/20 text-[#ff8197]'
              }`}
            >
              <span>✦</span>
              <span>Ask IndCine AI</span>
            </button>

            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="border border-[#ff365d] bg-[#ff365d] hover:bg-[#e02047] text-white rounded-[9px] px-4 py-2 text-[10px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 font-display"
            >
              <span className={isRefreshing ? 'animate-spin' : ''}>↻</span>
              <span>{isRefreshing ? 'Scanning...' : 'Run intelligence scan'}</span>
            </button>
          </div>
        </header>

        {/* Screen Content */}
        {children}
      </main>
    </div>
  );
};
