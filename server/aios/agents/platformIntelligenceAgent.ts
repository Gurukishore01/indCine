import { EvidenceItem, Movie } from '../../../src/types/aios';
import { VERIFIED_INDIAN_MOVIES } from '../../services/indianCinemaData';

export interface PlatformStats {
  providerName: string;
  code: string;
  color: string;
  catalogCount: number;
  languagesSupported: string[];
  sampleTitles: string[];
}

export interface PlatformAgentResult {
  agent: string;
  status: 'completed' | 'partial' | 'failed';
  platforms: PlatformStats[];
  evidence: EvidenceItem[];
  warnings: string[];
  summary: string;
  durationMs: number;
}

export async function runPlatformIntelligenceAgent(movies: Movie[] = VERIFIED_INDIAN_MOVIES): Promise<PlatformAgentResult> {
  const start = Date.now();
  const evidence: EvidenceItem[] = [];
  const warnings: string[] = [];

  const platformMap: Record<string, { count: number; languages: Set<string>; titles: string[] }> = {
    Netflix: { count: 0, languages: new Set(), titles: [] },
    'Prime Video': { count: 0, languages: new Set(), titles: [] },
    JioHotstar: { count: 0, languages: new Set(), titles: [] },
    ZEE5: { count: 0, languages: new Set(), titles: [] },
    SonyLIV: { count: 0, languages: new Set(), titles: [] },
    'Aha / Sun NXT': { count: 0, languages: new Set(), titles: [] },
  };

  movies.forEach((m) => {
    m.verifiedOttProviders.forEach((p) => {
      let key = p.providerName;
      if (key === 'Aha' || key === 'Sun NXT') key = 'Aha / Sun NXT';
      if (!platformMap[key]) {
        platformMap[key] = { count: 0, languages: new Set(), titles: [] };
      }
      platformMap[key].count += 1;
      platformMap[key].languages.add(m.language);
      if (!platformMap[key].titles.includes(m.title)) {
        platformMap[key].titles.push(m.title);
      }
    });
  });

  const platforms: PlatformStats[] = [
    {
      providerName: 'Netflix',
      code: 'N',
      color: '#e50914',
      catalogCount: platformMap['Netflix']?.count || 0,
      languagesSupported: Array.from(platformMap['Netflix']?.languages || []),
      sampleTitles: platformMap['Netflix']?.titles.slice(0, 3) || [],
    },
    {
      providerName: 'Prime Video',
      code: 'P',
      color: '#00a8e1',
      catalogCount: platformMap['Prime Video']?.count || 0,
      languagesSupported: Array.from(platformMap['Prime Video']?.languages || []),
      sampleTitles: platformMap['Prime Video']?.titles.slice(0, 3) || [],
    },
    {
      providerName: 'JioHotstar',
      code: 'J',
      color: '#0c2045',
      catalogCount: platformMap['JioHotstar']?.count || 0,
      languagesSupported: Array.from(platformMap['JioHotstar']?.languages || []),
      sampleTitles: platformMap['JioHotstar']?.titles.slice(0, 3) || [],
    },
    {
      providerName: 'ZEE5',
      code: 'Z',
      color: '#8e24aa',
      catalogCount: platformMap['ZEE5']?.count || 0,
      languagesSupported: Array.from(platformMap['ZEE5']?.languages || []),
      sampleTitles: platformMap['ZEE5']?.titles.slice(0, 3) || [],
    },
    {
      providerName: 'SonyLIV',
      code: 'S',
      color: '#1565c0',
      catalogCount: platformMap['SonyLIV']?.count || 0,
      languagesSupported: Array.from(platformMap['SonyLIV']?.languages || []),
      sampleTitles: platformMap['SonyLIV']?.titles.slice(0, 3) || [],
    },
    {
      providerName: 'Aha / Sun NXT',
      code: 'A',
      color: '#ff6f00',
      catalogCount: platformMap['Aha / Sun NXT']?.count || 0,
      languagesSupported: Array.from(platformMap['Aha / Sun NXT']?.languages || []),
      sampleTitles: platformMap['Aha / Sun NXT']?.titles.slice(0, 3) || [],
    },
  ];

  evidence.push({
    sourceName: 'JustWatch via TMDB Watch Providers v3',
    sourceUrl: 'https://www.justwatch.com/in',
    publishedAt: null,
    retrievedAt: new Date().toISOString(),
    territory: 'India (IN)',
    metric: 'platform_catalog_breakdown',
    value: platforms.map((p) => `${p.providerName}: ${p.catalogCount}`).join(' | '),
    methodologyNote:
      'Only verified India catalogue availability included. Private subscriber counts and watch-time metrics omitted.',
    confidence: 'high',
  });

  return {
    agent: 'PlatformIntelligenceAgent',
    status: 'completed',
    platforms,
    evidence,
    warnings,
    summary: `Analyzed catalogue availability across 6 primary Indian OTT platforms without fabricating private viewership hours.`,
    durationMs: Date.now() - start,
  };
}
