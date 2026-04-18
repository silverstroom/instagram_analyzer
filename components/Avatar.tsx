'use client';

import { useState } from 'react';
import { getInitials, hashColor, proxiedImage } from '@/lib/utils';

interface Props {
  src?: string | null;
  alt: string;
  size?: number;
  className?: string;
}

/**
 * Avatar con:
 * 1. Proxy automatico per CDN Instagram/Facebook (bypass CORS)
 * 2. Fallback a iniziali colorate se il caricamento fallisce
 */
export function Avatar({ src, alt, size = 48, className = '' }: Props) {
  const [failed, setFailed] = useState(false);
  const initials = getInitials(alt);
  const bg = hashColor(alt);

  const proxied = proxiedImage(src);

  if (!proxied || failed) {
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
      src={proxied}
      alt={alt}
      width={size}
      height={size}
      onError={() => setFailed(true)}
      className={`rounded-full object-cover shrink-0 ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
