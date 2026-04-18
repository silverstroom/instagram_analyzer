'use client';

import type { Platform } from '@/lib/scrapecreators/client';

interface Props {
  platforms: Platform[];
  active: Platform;
  onChange: (p: Platform) => void;
  loadingTab: string | null;
}

const PLATFORM_META: Record<Platform, { name: string; color: string; icon: React.ReactNode }> = {
  instagram: {
    name: 'Instagram',
    color: '#E1306C',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="0.7" fill="currentColor" />
      </svg>
    ),
  },
  facebook: {
    name: 'Facebook',
    color: '#1877F2',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M14 13.5h2.5l1-4H14V7c0-1.03 0-2 2-2h1.5V1.64S16.19 1.5 14.62 1.5C10.96 1.5 9 3.92 9 7.07V9.5H6V13.5H9V22h5V13.5z" />
      </svg>
    ),
  },
  tiktok: {
    name: 'TikTok',
    color: '#000',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.84-.1z" />
      </svg>
    ),
  },
  youtube: {
    name: 'YouTube',
    color: '#FF0000',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M23 7.5c-.3-1.1-1-2-2.1-2.3C18.5 5 12 5 12 5s-6.5 0-8.9.2c-1.1.3-2 1.2-2.1 2.3C.8 9.9.8 12 .8 12s0 2.1.2 4.5c.3 1.1 1 2 2.1 2.3 2.4.2 8.9.2 8.9.2s6.5 0 8.9-.2c1.1-.3 2-1.2 2.1-2.3.2-2.4.2-4.5.2-4.5s0-2.1-.2-4.5zM9.6 15.6V8.4L15.8 12l-6.2 3.6z" />
      </svg>
    ),
  },
  linkedin: {
    name: 'LinkedIn',
    color: '#0077B5',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zM8 17H5.5v-7H8v7zM6.8 9a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zM18 17h-2.5v-3.5c0-.8 0-1.8-1.1-1.8s-1.3.9-1.3 1.8V17H10.5v-7H13v1h.1c.3-.6 1.1-1.2 2.3-1.2 2.5 0 3 1.6 3 3.7V17z" />
      </svg>
    ),
  },
  twitter: {
    name: 'Twitter / X',
    color: '#000',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M13.6 10.8L20.9 2.4h-1.7l-6.4 7.4L7.7 2.4H1.8l7.7 11.2-7.7 9h1.7l6.8-7.9 5.4 7.9h5.9L13.6 10.8z" />
      </svg>
    ),
  },
};

export function MultiPlatformTabs({ platforms, active, onChange, loadingTab }: Props) {
  if (platforms.length <= 1) return null;

  return (
    <div
      role="tablist"
      className="inline-flex items-center gap-1 p-1 bg-ink-100 rounded-full mb-6 overflow-x-auto max-w-full"
    >
      {platforms.map((p) => {
        const meta = PLATFORM_META[p];
        if (!meta) return null;
        const isActive = active === p;
        const isLoading = loadingTab === p;
        return (
          <button
            key={p}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(p)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
              isActive
                ? 'bg-white text-ink-900 shadow-sm'
                : 'text-ink-700 hover:text-ink-900'
            }`}
          >
            <span style={{ color: isActive ? meta.color : undefined }}>{meta.icon}</span>
            {meta.name}
            {isLoading && (
              <svg viewBox="0 0 24 24" className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" strokeDasharray="20 10" />
              </svg>
            )}
          </button>
        );
      })}
    </div>
  );
}
