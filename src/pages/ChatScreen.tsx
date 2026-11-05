import React, { useEffect, useRef, useState } from 'react';
import { ChatMessage, Movie, RouteId } from '../types/aios';
import { safeFetchJson } from '../utils/safeFetchJson';

interface ChatScreenProps {
  onSelectMovie: (movie: Movie) => void;
  onNavigate: (route: RouteId) => void;
}

const DEFAULT_SUGGESTIONS = [
  'What is the booming movie in India right now?',
  'Which is the biggest flop film of 2026 in Tamil cinema?',
  'Which Malayalam movie is trending now?',
  'Which movie has the highest IMDb rating in Telugu cinema in 2026?',
  'Where to watch Kalki 2898 AD in India?',
  'Highest grossing Indian movie in benchmark cohort',
];

export const ChatScreen: React.FC<ChatScreenProps> = ({
  onSelectMovie,
  onNavigate,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'assistant',
      text: 'IndCine AI online. Ask direct questions about Indian cinema trends, box office, IMDb ratings, or streaming availability.',
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeEvidenceId, setActiveEvidenceId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (queryText = input) => {
    const q = queryText.trim();
    if (!q || loading) return;

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await safeFetchJson<{
        answer: string;
        evidence?: {
          movieTitle?: string;
          source: string;
          metric?: string;
          verifiedAt: string;
        };
        movieId?: string;
        relatedMovie?: Movie;
      }>('/api/chat', {
        method: 'POST',
        body: JSON.stringify({ query: q }),
      });

      const assistantMsg: ChatMessage = {
        id: `ast_${Date.now()}`,
        sender: 'assistant',
        text: res.answer || 'Reliable data is currently unavailable.',
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        evidence: res.evidence,
        movieId: res.movieId,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `ast_${Date.now()}`,
          sender: 'assistant',
          text: 'Reliable data is currently unavailable.',
          timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'assistant',
        text: 'Chat cleared. Ask direct questions about Indian cinema trends, box office, IMDb ratings, or streaming availability.',
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-h-[900px] bg-gradient-to-br from-[#12161f] to-[#0c0f15] border border-[#2c3745] rounded-[18px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.4)] font-sans">
      {/* Chat Header */}
      <header className="px-5 py-3.5 border-b border-white/10 bg-[#0c1017]/90 flex items-center justify-between backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-[36px] h-[36px] rounded-[10px] bg-gradient-to-br from-[#ff365d] to-[#990a2c] grid place-items-center shadow-[0_0_18px_rgba(255,54,93,0.35)]">
            <span className="text-[16px] font-bold text-white font-display">✦</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-[15px] font-display text-white tracking-tight leading-none">
                IndCine AI
              </h2>
              <span className="text-[9px] font-mono uppercase bg-[#51d6c2]/15 text-[#51d6c2] border border-[#51d6c2]/30 px-1.5 py-0.5 rounded-[4px] font-semibold">
                CONCISE MODE
              </span>
            </div>
            <p className="text-[10px] text-[#8c9aac] mt-0.5">
              Indian Cinema Intelligence · Grounded in verified evidence · No narrative filler
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleClear}
            className="text-[10px] font-mono text-[#8c9aac] hover:text-white px-2.5 py-1 rounded-[6px] border border-white/10 hover:border-white/20 transition-colors cursor-pointer"
          >
            Clear chat
          </button>
        </div>
      </header>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {messages.map((m) => {
          const isUser = m.sender === 'user';
          return (
            <div
              key={m.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} animate-fade-in`}
            >
              <div
                className={`max-w-[85%] md:max-w-[70%] rounded-[14px] p-4 text-[13px] leading-relaxed transition-all ${
                  isUser
                    ? 'bg-[#1e2735] text-[#f2f4f8] border border-[#3b4859] rounded-br-[4px]'
                    : 'bg-[#151c27] text-white border border-[#2b3747] rounded-bl-[4px] shadow-[0_6px_20px_rgba(0,0,0,0.25)]'
                }`}
              >
                {!isUser && (
                  <div className="flex items-center justify-between gap-3 pb-1.5 mb-1.5 border-b border-white/10 text-[9px] font-mono text-[#f4bd62]">
                    <span className="flex items-center gap-1.5 font-bold tracking-wider uppercase">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#f4bd62] animate-pulse" />
                      INDCINE DIRECT INTELLIGENCE
                    </span>
                    <span className="text-[#7d8b9d]">{m.timestamp}</span>
                  </div>
                )}

                <div className={`${isUser ? 'font-normal' : 'font-semibold text-[14px] leading-snug font-display'}`}>
                  {m.text}
                </div>

                {/* Evidence badge & details */}
                {m.evidence && (
                  <div className="mt-3 pt-2.5 border-t border-white/10">
                    <button
                      onClick={() =>
                        setActiveEvidenceId(activeEvidenceId === m.id ? null : m.id)
                      }
                      className="text-[9px] font-mono text-[#51d6c2] hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <span>{activeEvidenceId === m.id ? '▼' : '▶'}</span>
                      <span>Verified Evidence ({m.evidence.source})</span>
                    </button>

                    {activeEvidenceId === m.id && (
                      <div className="mt-2 p-2.5 rounded-[8px] bg-[#0b0f16] border border-[#293444] text-[10px] font-mono space-y-1 text-[#9daabb]">
                        <div>• Source: <strong className="text-white">{m.evidence.source}</strong></div>
                        {m.evidence.metric && <div>• Metric: <span className="text-[#d2d9e2]">{m.evidence.metric}</span></div>}
                        <div>• Timestamp: {new Date(m.evidence.verifiedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} (IST)</div>
                        {m.movieId && (
                          <div className="pt-1.5">
                            <button
                              onClick={() => onNavigate('intelligence')}
                              className="text-[#ff8197] hover:text-[#ff365d] text-[10px] font-semibold flex items-center gap-1 cursor-pointer"
                            >
                              <span>Open Film Dossier</span>
                              <span>↗</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <span className="text-[9px] font-mono text-[#5f6d80] mt-1 px-1">
                {isUser ? `You · ${m.timestamp}` : 'IndCine AIOS'}
              </span>
            </div>
          );
        })}

        {loading && (
          <div className="flex flex-col items-start animate-fade-in">
            <div className="bg-[#151c27] border border-[#2b3747] rounded-[14px] rounded-bl-[4px] p-4 text-[12px] flex items-center gap-3 text-[#d2d9e2]">
              <span className="w-2 h-2 rounded-full bg-[#ff365d] animate-ping" />
              <span className="font-mono text-[11px] text-[#9daabb]">
                Consulting verified database & live intelligence pipeline...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Suggestions Chips */}
      <div className="px-4 py-2 border-t border-white/5 bg-[#0b0e14]/60">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          <span className="text-[9px] font-mono text-[#6c7a8d] uppercase tracking-wider shrink-0 pr-1">
            EXAMPLES:
          </span>
          {DEFAULT_SUGGESTIONS.map((sug) => (
            <button
              key={sug}
              onClick={() => handleSend(sug)}
              disabled={loading}
              className="text-[10px] font-sans text-[#b8c4d2] hover:text-white bg-[#161d27] hover:bg-[#202937] border border-[#2d3a4b] rounded-[6px] px-2.5 py-1 whitespace-nowrap shrink-0 transition-colors cursor-pointer disabled:opacity-50"
            >
              {sug}
            </button>
          ))}
        </div>
      </div>

      {/* Input Bar */}
      <footer className="p-3 md:p-4 border-t border-white/10 bg-[#0a0d13]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2 bg-[#121721] border border-[#303d4f] rounded-[12px] p-1.5 focus-within:border-[#ff365d] transition-colors shadow-inner"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a direct question about Indian movies, IMDb ratings, trending, flops, or streaming..."
            className="flex-1 bg-transparent border-0 outline-none text-white text-[12px] md:text-[13px] px-3 placeholder-[#5d6c80] font-sans min-w-0"
          />

          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="bg-[#ff365d] hover:bg-[#e02047] disabled:bg-[#2a3443] disabled:text-[#657385] text-white px-4 py-2 rounded-[8px] text-[11px] font-bold font-display cursor-pointer transition-colors shrink-0 flex items-center gap-1.5"
          >
            <span>ASK</span>
            <span>↗</span>
          </button>
        </form>

        <div className="flex justify-between items-center text-[9px] font-mono text-[#637286] mt-2 px-1">
          <span>Concise answer-only standard enabled</span>
          <span>Zero fabrication policy</span>
        </div>
      </footer>
    </div>
  );
};
