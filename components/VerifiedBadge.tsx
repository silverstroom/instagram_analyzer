'use client';

import { useState } from 'react';

export type DataSource =
  | 'instagram_api'
  | 'facebook_api'
  | 'ad_library'
  | 'calculated'
  | 'historical_db'
  | 'estimated';

const SOURCE_LABELS: Record<DataSource, string> = {
  instagram_api: 'Instagram API — dato ufficiale pubblico',
  facebook_api: 'Facebook API — dato ufficiale pubblico',
  ad_library: 'Meta Ad Library — dato verificato Meta',
  calculated: 'Calcolato dai dati raccolti',
  historical_db: 'Storico dal database',
  estimated: 'Stima statistica',
};

interface Props {
  source: DataSource;
  size?: 'sm' | 'md';
}

/**
 * Badge blu stile Meta Verified che indica la fonte del dato.
 * Al hover mostra un tooltip con la descrizione della fonte.
 */
export function VerifiedBadge({ source, size = 'sm' }: Props) {
  const [hover, setHover] = useState(false);
  const sizePx = size === 'sm' ? 14 : 18;

  return (
    <span
      className="relative inline-flex items-center"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <svg
        viewBox="0 0 24 24"
        width={sizePx}
        height={sizePx}
        className="shrink-0"
        aria-label="Dato verificato"
      >
        <path
          d="M12 2l2.39 2.39 3.3-.43.43 3.3L20.5 10l-2.39 2.39.43 3.3-3.3.43L12 19l-2.39-2.39-3.3.43-.43-3.3L3.5 12l2.39-2.39-.43-3.3 3.3-.43L12 2z"
          fill="#1877F2"
        />
        <path
          d="M10.5 14.5l-2-2 1-1 1 1 3-3 1 1-4 4z"
          fill="white"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {hover && (
        <span
          className="absolute z-20 left-1/2 -translate-x-1/2 top-full mt-1 px-2 py-1 bg-ink-900 text-white text-[11px] rounded whitespace-nowrap pointer-events-none"
          style={{ minWidth: '120px' }}
        >
          {SOURCE_LABELS[source]}
        </span>
      )}
    </span>
  );
}
