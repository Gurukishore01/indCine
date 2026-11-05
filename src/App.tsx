import { useEffect, useState } from 'react';
import { Shell } from './components/layout/Shell';
import { AiosAnalystScreen } from './pages/AiosAnalystScreen';
import { AudienceSignalsScreen } from './pages/AudienceSignalsScreen';
import { BoxOfficeScreen } from './pages/BoxOfficeScreen';
import { ChatScreen } from './pages/ChatScreen';
import { ExplorerScreen } from './pages/ExplorerScreen';
import { MovieProfileScreen } from './pages/MovieProfileScreen';
import { OttPlatformsScreen } from './pages/OttPlatformsScreen';
import { PulseScreen } from './pages/PulseScreen';
import { ReportsScreen } from './pages/ReportsScreen';
import { TrendObservatoryScreen } from './pages/TrendObservatoryScreen';
import { IntelligencePulseData, Movie, RouteId } from './types/aios';
import { safeFetchJson } from './utils/safeFetchJson';

export default function App() {
  const [activeRoute, setActiveRoute] = useState<RouteId>('pulse');
  const [pulseData, setPulseData] = useState<IntelligencePulseData | null>(null);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [analystInitialQuery, setAnalystInitialQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [healthStatus, setHealthStatus] = useState<{
    tmdbConfigured?: boolean;
    geminiConfigured?: boolean;
  }>({});

  const loadData = async () => {
    setIsRefreshing(true);
    try {
      const [pulseRes, moviesRes, healthRes] = await Promise.allSettled([
        safeFetchJson<IntelligencePulseData>('/api/pulse'),
        safeFetchJson<{ movies?: Movie[] }>('/api/movies/discover'),
        safeFetchJson<{ tmdbConfigured?: boolean; geminiConfigured?: boolean }>('/api/health'),
      ]);

      if (pulseRes.status === 'fulfilled') {
        setPulseData(pulseRes.value);
        if (pulseRes.value.spotlightMovies && pulseRes.value.spotlightMovies.length > 0) {
          if (!selectedMovie) {
            setSelectedMovie(pulseRes.value.spotlightMovies[0]);
          }
        }
      }

      if (moviesRes.status === 'fulfilled' && Array.isArray(moviesRes.value.movies)) {
        setMovies(moviesRes.value.movies);
      }

      if (healthRes.status === 'fulfilled') {
        setHealthStatus(healthRes.value);
      }
    } catch (err) {
      console.error('Failed to load initial IndCine data:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectMovie = async (movie: Movie) => {
    setSelectedMovie(movie);
    setActiveRoute('intelligence');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      const details = await safeFetchJson<{ movie?: Movie }>(`/api/movies/${movie.id}`);
      if (details.movie) {
        setSelectedMovie(details.movie);
      }
    } catch {
      // Retain existing summary object if details endpoint is offline
    }
  };

  const handleNavigate = (route: RouteId) => {
    setActiveRoute(route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRunAnalystQuery = (q: string) => {
    setAnalystInitialQuery(q);
    setActiveRoute('analyst');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Shell
      activeRoute={activeRoute}
      onNavigate={handleNavigate}
      onRefresh={loadData}
      isRefreshing={isRefreshing}
      tmdbConnected={healthStatus.tmdbConfigured}
      geminiConnected={healthStatus.geminiConfigured}
    >
      {activeRoute === 'chat' && (
        <ChatScreen
          onSelectMovie={handleSelectMovie}
          onNavigate={handleNavigate}
        />
      )}

      {activeRoute === 'pulse' && (
        <PulseScreen
          data={pulseData}
          onNavigate={handleNavigate}
          onSelectMovie={handleSelectMovie}
          onRunAnalystQuery={handleRunAnalystQuery}
        />
      )}

      {activeRoute === 'explorer' && (
        <ExplorerScreen
          onSelectMovie={handleSelectMovie}
          onNavigate={handleNavigate}
        />
      )}

      {activeRoute === 'intelligence' && (
        <MovieProfileScreen
          movie={selectedMovie}
          onBack={() => handleNavigate('pulse')}
          onNavigate={handleNavigate}
          onRunAnalystQuery={handleRunAnalystQuery}
        />
      )}

      {activeRoute === 'ott' && (
        <OttPlatformsScreen
          onSelectMovie={handleSelectMovie}
          onNavigate={handleNavigate}
        />
      )}

      {activeRoute === 'signals' && (
        <AudienceSignalsScreen
          movies={movies}
          onSelectMovie={handleSelectMovie}
          onNavigate={handleNavigate}
        />
      )}

      {activeRoute === 'trends' && (
        <TrendObservatoryScreen onNavigate={handleNavigate} />
      )}

      {activeRoute === 'boxoffice' && (
        <BoxOfficeScreen
          movies={movies}
          onSelectMovie={handleSelectMovie}
          onNavigate={handleNavigate}
        />
      )}

      {activeRoute === 'analyst' && (
        <AiosAnalystScreen
          key={analystInitialQuery}
          initialQuery={analystInitialQuery}
          onSelectMovie={handleSelectMovie}
          onNavigate={handleNavigate}
        />
      )}

      {activeRoute === 'reports' && (
        <ReportsScreen
          movies={movies}
          onSelectMovie={handleSelectMovie}
          onNavigate={handleNavigate}
        />
      )}
    </Shell>
  );
}
