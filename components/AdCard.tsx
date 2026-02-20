'use client';

import { Ad } from '@/lib/types';

interface Props {
  ad: Ad;
  rankChange?: { type: string; prevRank: number | null };
}

const RANK_BADGE: Record<string, { label: string; color: string }> = {
  new:     { label: 'NEW',  color: 'bg-green-100 text-green-700' },
  removed: { label: '제거', color: 'bg-red-100 text-red-700' },
  up:      { label: '▲',   color: 'bg-blue-100 text-blue-700' },
  down:    { label: '▼',   color: 'bg-orange-100 text-orange-700' },
  same:    { label: '━',   color: 'bg-gray-100 text-gray-500' },
};

export default function AdCard({ ad, rankChange }: Props) {
  const badge = rankChange ? RANK_BADGE[rankChange.type] : null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      {/* 순위 + 광고주 */}
      <div className="flex items-start gap-3 mb-2">
        <span className="flex-shrink-0 w-7 h-7 bg-blue-600 text-white text-sm font-bold rounded-full flex items-center justify-center">
          {ad.rank}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900 text-sm truncate">{ad.advertiser}</span>
            {ad.displayDomain && (
              <span className="text-xs text-gray-400 truncate">{ad.displayDomain}</span>
            )}
            {badge && (
              <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${badge.color}`}>
                {badge.label}
                {rankChange?.prevRank && ` (${rankChange.prevRank}위)`}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 이미지 */}
      {ad.images.filter(img => img.alt !== 'favicon' && !img.alt.includes('favicon') && img.src.includes('searchad-phinf')).length > 0 && (
        <div className="flex gap-2 mb-2 overflow-x-auto">
          {ad.images
            .filter(img => img.src.includes('searchad-phinf'))
            .map((img, i) => (
              <a key={i} href={img.landingUrl} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
                <img
                  src={img.src}
                  alt={img.alt || '광고 이미지'}
                  className="w-16 h-16 object-cover rounded border border-gray-100"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </a>
            ))}
        </div>
      )}

      {/* 제목 */}
      {ad.title && (
        <a
          href={ad.landingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-blue-600 hover:text-blue-800 font-medium text-sm mb-1 hover:underline line-clamp-2"
        >
          {ad.title}
        </a>
      )}

      {/* 설명 */}
      {ad.description && (
        <p className="text-gray-600 text-xs line-clamp-2 mb-2">{ad.description}</p>
      )}

      {/* 서브링크 */}
      {ad.subLinks.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {ad.subLinks.map((sub, i) => (
            <a
              key={i}
              href={sub.landingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs bg-gray-50 border border-gray-200 text-blue-600 px-2 py-0.5 rounded hover:bg-gray-100 hover:underline"
            >
              {sub.text}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
