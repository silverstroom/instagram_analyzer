'use client';

import { useState } from 'react';
import { getInitials, hashColor } from '@/lib/utils';

interface Props {
  src?: string | null;
  alt: string;
  size?: number;
  className?: string;
}

/**
 * Avatar con fallback automatico a iniziali colorate se l'immagine non carica.
 * Risolve il problema delle immagini profilo Instagram che spesso falliscono
 * per restrizioni CORS o URL scaduti.
 */
export function Avatar({ src, alt, size = 48, className = '' }: Props) {
  const [failed, setFailed] = useState(false);
  const initials = getInitials(alt);
  const bg = hashColor(alt);

  if (!src || failed) {
    return (
      <div
        className={`rounded-full flex items-center justify-center text-white font-medium shrink-0 ${className}`}
        style={{
          width: size,
          height: size,
          background: bg,
          fontSize: size * 0.36,
        }}
        aria-label={alt}
      >
        {initials}
      </div>
    );
  }

  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      onError={() => setFailed(true)}
      className={`rounded-full object-cover shrink-0 ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
