import React, { useState } from 'react';
import { Cpu, MessageSquare, Send, X } from 'lucide-react';
import { Movie, OrchestratorResponse } from '../../types/aios';
import { safeFetchJson } from '../../utils/safeFetchJson';

interface GlobalChatWidgetProps {
  onSelectMovie: (movie: Movie) => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  orchestrator?: OrchestratorResponse;
}

export const GlobalChatWidget: React.FC<GlobalChatWidgetProps> = ({
  onSelectMovie,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Ask CINEMIND anything about movies — discover films, explore rankings, compare movies, understand box-office performance, explore awards, or find where to watch.',
    },
  ]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    setInput('');
    setMessages((prev) => [
      ...prev,
      { id: `u_${Date.now()}`, role: 'user', text: userText },
    ]);
    setIsLoading(true);

    try {
      const data = await safeFetchJson<OrchestratorResponse>('/api/aios/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userText }),
      });
      setMessages((prev) => [
        ...prev,
        {
          id: `a_${Date.now()}`,
          role: 'assistant',
          text: data.answer,
          orchestrator: data,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: 'assistant',
          text: 'Unable to reach CINEMIND AIOS orchestrator. Please try again.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2.5 bg-[#e11d48] hover:bg-[#be0037] text-[#fffaf9] font-semibold text-sm px-5 py-3 rounded-full shadow-xl transition-transform active:scale-95 cursor-pointer"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Ask CINEMIND AIOS</span>
        </button>
      ) : (
        <div className="w-[360px] sm:w-[420px] h-[520px] bg-[#1b1b20] border border-[#5c3f40]/50 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 bg-[#0e0e13] border-b border-[#5c3f40]/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#e11d48]" />
              <span className="text-sm font-bold text-[#e4e1e9]">
                CINEMIND AIOS Assistant
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 text-[#ac8889] hover:text-[#e4e1e9] rounded-lg cursor-pointer"
              aria-label="Close chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col gap-2 ${
                  msg.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-line ${
                    msg.role === 'user'
                      ? 'bg-[#e11d48] text-[#fffaf9]'
                      : 'bg-[#2a292f] text-[#e4e1e9] border border-[#5c3f40]/30'
                  }`}
                >
                  {msg.text}
                </div>

                {msg.orchestrator && (
                  <div className="w-full space-y-2 pt-1">
                    <div className="text-[11px] text-[#ac8889] font-mono-tabular">
                      Agents run: {msg.orchestrator.executionLog.map((l) => l.agent).join(' → ')}
                    </div>
                    {msg.orchestrator.unavailableCapabilities &&
                      msg.orchestrator.unavailableCapabilities.length > 0 && (
                        <div className="p-2 rounded-lg bg-[#2a292f]/80 border border-[#ee9800]/30 text-[11px] text-[#ffb95f]">
                          {msg.orchestrator.unavailableCapabilities[0]}
                        </div>
                      )}
                    {msg.orchestrator.recommendations.length > 0
                      ? msg.orchestrator.recommendations.slice(0, 3).map((rec) => (
                          <button
                            key={rec.movie.id}
                            type="button"
                            onClick={() => {
                              onSelectMovie(rec.movie);
                              setIsOpen(false);
                            }}
                            className="w-full text-left p-2.5 rounded-xl bg-[#1f1f25] hover:bg-[#2a292f] border border-[#5c3f40]/30 flex items-center justify-between gap-2 transition-colors cursor-pointer"
                          >
                            <div className="min-w-0">
                              <div className="text-xs font-semibold text-[#e4e1e9] truncate">
                                {rec.movie.title} ({rec.movie.year || 'TBA'})
                              </div>
                              <div className="text-[11px] text-[#ac8889] truncate">
                                {rec.movie.language}
                              </div>
                            </div>
                            <span className="text-xs font-mono-tabular font-bold text-[#ffb95f] shrink-0">
                              {rec.matchScore}%
                            </span>
                          </button>
                        ))
                      : (msg.orchestrator.movies || []).slice(0, 3).map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => {
                              onSelectMovie(m);
                              setIsOpen(false);
                            }}
                            className="w-full text-left p-2.5 rounded-xl bg-[#1f1f25] hover:bg-[#2a292f] border border-[#5c3f40]/30 flex items-center justify-between gap-2 transition-colors cursor-pointer"
                          >
                            <div className="min-w-0">
                              <div className="text-xs font-semibold text-[#e4e1e9] truncate">
                                {m.title} ({m.year || 'TBA'})
                              </div>
                              <div className="text-[11px] text-[#ac8889] truncate">
                                {m.language} · {m.genres.slice(0, 2).join(', ')}
                              </div>
                            </div>
                            {m.sourceVoteAverage ? (
                              <span className="text-xs font-mono-tabular font-bold text-[#ffb95f] shrink-0">
                                ★ {m.sourceVoteAverage.toFixed(1)}
                              </span>
                            ) : null}
                          </button>
                        ))}
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="text-xs text-[#ac8889] font-mono-tabular">
                Orchestrator coordinating agents...
              </div>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={handleSend}
            className="p-3 bg-[#0e0e13] border-t border-[#5c3f40]/30 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe your mood, language, or time..."
              className="flex-1 bg-[#1f1f25] text-xs text-[#e4e1e9] placeholder:text-[#ac8889] px-3.5 py-2 rounded-full border border-[#5c3f40]/40 focus:outline-none focus:border-[#e11d48]"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="p-2 rounded-full bg-[#e11d48] text-[#fffaf9] disabled:opacity-40 cursor-pointer"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
