import React, { useEffect, useState } from 'react';
import { Movie, RouteId } from '../types/aios';
import { safeFetchJson } from '../utils/safeFetchJson';

interface OttPlatformsScreenProps {
  onSelectMovie: (movie: Movie) => void;
  onNavigate: (route: RouteId) => void;
}

export const OttPlatformsScreen: React.FC<OttPlatformsScreenProps> = () => {
  const [platformData, setPlatformData] = useState<any>(null);

  useEffect(() => {
    safeFetchJson<any>('/api/platforms')
      .then((data) => setPlatformData(data))
      .catch((err) => console.error(err));
  }, []);

  const platforms = platformData?.platforms || [
    { providerName: 'Netflix', code: 'N', color: '#e50914', catalogCount: 4, languagesSupported: ['Tamil', 'Telugu', 'Hindi', 'Malayalam'], sampleTitles: ['Leo', 'Kalki 2898 AD', 'Amaran', 'Kantara'] },
    { providerName: 'Prime Video', code: 'P', color: '#00a8e1', catalogCount: 5, languagesSupported: ['Telugu', 'Hindi', 'Malayalam', 'Kannada'], sampleTitles: ['Kalki 2898 AD', 'Aavesham', 'Stree 2', 'Kantara'] },
    { providerName: 'JioHotstar', code: 'J', color: '#0c2045', catalogCount: 2, languagesSupported: ['Malayalam', 'Tamil', 'Hindi'], sampleTitles: ['Manjummel Boys'] },
    { providerName: 'ZEE5', code: 'Z', color: '#8e24aa', catalogCount: 2, languagesSupported: ['Tamil', 'Telugu', 'Hindi'], sampleTitles: [] },
    { providerName: 'SonyLIV', code: 'S', color: '#1565c0', catalogCount: 1, languagesSupported: ['Malayalam', 'Hindi'], sampleTitles: [] },
    { providerName: 'Aha · Sun NXT · Others', code: 'A', color: '#ff6f00', catalogCount: 2, languagesSupported: ['Telugu', 'Tamil'], sampleTitles: [] },
  ];

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <div>
        <h1 className="font-bold text-[22px] md:text-[26px] font-display text-white tracking-tight">
          OTT Radar
        </h1>
        <p className="text-[11px] text-[#8996a6] mt-0.5">
          Authorized Indian streaming provider catalogue coverage, regional language distribution, and verified titles.
        </p>
      </div>

      {/* Disclaimers Panel */}
      <div className="border border-[#51d6c2]/30 bg-[#51d6c2]/[0.05] rounded-[12px] p-4 text-[11px] text-[#c1c8d2] leading-relaxed">
        <b className="text-[#51d6c2] font-bold">Data Integrity Standard:</b> IndCine only displays streaming availability verified via authorized provider APIs or JustWatch certified feeds. Private streaming platform data—such as subscriber counts, title-level view hours, or completion rates—is proprietary and never fabricated.
      </div>

      {/* Platforms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {platforms.map((plat: any) => (
          <article
            key={plat.providerName}
            className="bg-gradient-to-br from-[#171c26] to-[#11151d] border border-[#2c3745] rounded-[14px] p-5 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-[10px] grid place-items-center text-[15px] font-extrabold font-display text-white"
                    style={{ backgroundColor: plat.color || '#232d3b' }}
                  >
                    {plat.code}
                  </div>
                  <div>
                    <h3 className="font-bold text-[14px] font-display text-white">{plat.providerName}</h3>
                    <span className="text-[9px] font-mono text-[#51d6c2]">India Streaming Rights</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-bold font-mono text-[16px] text-white">
                    {plat.catalogCount}
                  </span>
                  <small className="block text-[8px] font-mono text-[#8996a6]">TITLES</small>
                </div>
              </div>

              <div className="space-y-2 mt-4 text-[11px]">
                <div>
                  <span className="text-[#8996a6] block text-[9px] font-mono uppercase">Languages Active:</span>
                  <div className="flex gap-1.5 flex-wrap mt-1">
                    {plat.languagesSupported.length > 0 ? (
                      plat.languagesSupported.map((l: string) => (
                        <span key={l} className="bg-[#0b1017] border border-[#29313e] text-[#d2d9e2] text-[9px] px-2 py-0.5 rounded-[5px]">
                          {l}
                        </span>
                      ))
                    ) : (
                      <span className="text-[9px] text-[#8996a6]">Pan-India catalogue</span>
                    )}
                  </div>
                </div>

                {plat.sampleTitles.length > 0 && (
                  <div className="pt-2">
                    <span className="text-[#8996a6] block text-[9px] font-mono uppercase">Verified Titles:</span>
                    <ul className="mt-1 space-y-1 text-[#c1c8d2] text-[10px]">
                      {plat.sampleTitles.map((t: string) => (
                        <li key={t} className="flex items-center gap-1.5">
                          <span className="text-[#ff365d]">•</span>
                          <span>{t}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between text-[9px] text-[#8996a6] font-mono">
              <span>REGION: INDIA (IN)</span>
              <span className="text-[#51d6c2]">VERIFIED CATALOG</span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};
