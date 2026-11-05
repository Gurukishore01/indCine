import { useEffect, useState } from 'react';
import { GlobalChatWidget } from './components/aios/GlobalChatWidget';
import { Footer } from './components/layout/Footer';
import { TopNavBar } from './components/layout/TopNavBar';
import { CinemaTicketsPage } from './pages/CinemaTicketsPage';
import { HomePage } from './pages/HomePage';
import { MovieDetailsPage } from './pages/MovieDetailsPage';
import { QuickPickPage } from './pages/QuickPickPage';
import { SearchPage } from './pages/SearchPage';
import { WhereToWatchPage } from './pages/WhereToWatchPage';
import { AgentRegistryEntry, Movie, RouteId } from './types/aios';
import { safeFetchJson } from './utils/safeFetchJson';

export default function App() {
  const [activeRoute, setActiveRoute] = useState<RouteId>('discover');
  const [movies, setMovies] = useState<Movie[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [agents, setAgents] = useState<AgentRegistryEntry[]>([]);

  useEffect(() => {
    safeFetchJson<{ agents?: AgentRegistryEntry[] }>('/api/agents')
      .then((data) => {
        if (Array.isArray(data.agents)) {
          setAgents(data.agents);
        }
      })
      .catch(() => {});
  }, []);

  const handleSelectMovie = async (movie: Movie) => {
    setSelectedMovie(movie);
    setActiveRoute('details');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      const data = await safeFetchJson<{ movie?: Movie }>(
        `/api/movies/${encodeURIComponent(movie.id)}`
      );
      if (data.movie) {
        setSelectedMovie(data.movie);
      }
    } catch {
      // Keep summary movie if details fetch fails
    }
  };

  const handleNavigate = (route: RouteId) => {
    setActiveRoute(route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#131318] text-[#e4e1e9]">
      <TopNavBar activeRoute={activeRoute} onNavigate={handleNavigate} />

      <main className="flex-1 w-full max-w-7xl mx-auto px-5 py-8">
        {activeRoute === 'discover' && (
          <HomePage
            agents={agents}
            onMoviesLoaded={setMovies}
            onSelectMovie={handleSelectMovie}
            onNavigate={handleNavigate}
          />
        )}
        {activeRoute === 'search' && (
          <SearchPage onSelectMovie={handleSelectMovie} />
        )}
        {activeRoute === 'details' && selectedMovie && (
          <MovieDetailsPage
            movie={selectedMovie}
            onBack={() => handleNavigate('discover')}
            onNavigate={handleNavigate}
          />
        )}
        {activeRoute === 'where-to-watch' && selectedMovie && (
          <WhereToWatchPage
            movie={selectedMovie}
            movies={movies}
            onSelectMovie={handleSelectMovie}
            onBack={() => handleNavigate('details')}
          />
        )}
        {activeRoute === 'in-theatres' && selectedMovie && (
          <CinemaTicketsPage
            movie={selectedMovie}
            movies={movies}
            onSelectMovie={handleSelectMovie}
          />
        )}
        {activeRoute === 'quick-pick' && (
          <QuickPickPage
            onSelectMovie={handleSelectMovie}
            onNavigate={handleNavigate}
          />
        )}
      </main>

      <Footer onNavigate={handleNavigate} />
      <GlobalChatWidget onSelectMovie={handleSelectMovie} />
    </div>
  );
}
