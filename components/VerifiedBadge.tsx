'use client';

import { useState } from 'react';

export type DataSource =
  | 'instagram_api'
  | 'facebook_api'
  | 'tiktok_api'
  | 'youtube_api'
  | 'linkedin_api'
  | 'twitter_api'
  | 'ad_library'
  | 'calculated'
  | 'historical_db'
  | 'estimated';

const SOURCE_LABELS: Record<DataSource, string> = {
  instagram_api: 'Dato ufficiale da Instagram',
  facebook_api: 'Dato ufficiale da Facebook',
  tiktok_api: 'Dato ufficiale da TikTok',
  youtube_api: 'Dato ufficiale da YouTube',
  linkedin_api: 'Dato ufficiale da LinkedIn',
  twitter_api: 'Dato ufficiale da Twitter/X',
  ad_library: 'Meta Ad Library — dato verificato',
  calculated: 'Calcolato dai dati raccolti',
  historical_db: 'Storico dal database',
  estimated: 'Stima statistica',
};

interface Props {
  source: DataSource;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const SIZES = { sm: 14, md: 20, lg: 26, xl: 32 };

/**
 * Badge blu stile Meta. Size 'lg' o 'xl' per affiancare il nome del profilo
 * in modo simile a come fa Meta ufficialmente (vedi screenshot EduNews24.it).
 */
export function VerifiedBadge({ source, size = 'md' }: Props) {
  const [hover, setHover] = useState(false);
  const px = SIZES[size];

  return (
    <span
      className="relative inline-flex items-center align-middle"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <svg viewBox="0 0 24 24" width={px} height={px} className="shrink-0" aria-label="Dato verificato">
        <path
          d="M12 2l2.39 2.39 3.3-.43.43 3.3L20.5 10l-2.39 2.39.43 3.3-3.3.43L12 19l-2.39-2.39-3.3.43-.43-3.3L3.5 12l2.39-2.39-.43-3.3 3.3-.43L12 2z"
          fill="#1877F2"
        />
        <path d="M10.5 14.5l-2-2 1-1 1 1 3-3 1 1-4 4z" fill="white" />
      </svg>

      {hover && (
        <span
          className="absolute z-20 left-1/2 -translate-x-1/2 top-full mt-1 px-2 py-1 bg-ink-900 text-white text-xs rounded whitespace-nowrap pointer-events-none"
          style={{ minWidth: '140px', textAlign: 'center' }}
        >
          {SOURCE_LABELS[source]}
        </span>
      )}
    </span>
  );
}
