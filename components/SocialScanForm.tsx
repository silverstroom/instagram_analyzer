'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { Platform } from '@/lib/scrapecreators/client';

const SOCIALS: Array<{
  id: Platform;
  name: string;
  color: string;
  hint: string;
  default: boolean;
  icon: React.ReactNode;
}> = [
  {
    id: 'instagram',
    name: 'Instagram',
    color: '#E1306C',
    hint: 'es. @edunews_24',
    default: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="0.7" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: 'facebook',
    name: 'Facebook',
    color: '#1877F2',
    hint: 'URL pagina FB o nome pagina',
    default: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M14 13.5h2.5l1-4H14V7c0-1.03 0-2 2-2h1.5V1.64S16.19 1.5 14.62 1.5C10.96 1.5 9 3.92 9 7.07V9.5H6V13.5H9V22h5V13.5z" />
      </svg>
    ),
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    color: '#000',
    hint: 'es. @username',
    default: false,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.84-.1z" />
      </svg>
    ),
  },
  {
    id: 'youtube',
    name: 'YouTube',
    color: '#FF0000',
    hint: 'es. @channelhandle',
    default: false,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M23 7.5c-.3-1.1-1-2-2.1-2.3C18.5 5 12 5 12 5s-6.5 0-8.9.2c-1.1.3-2 1.2-2.1 2.3C.8 9.9.8 12 .8 12s0 2.1.2 4.5c.3 1.1 1 2 2.1 2.3 2.4.2 8.9.2 8.9.2s6.5 0 8.9-.2c1.1-.3 2-1.2 2.1-2.3.2-2.4.2-4.5.2-4.5s0-2.1-.2-4.5zM9.6 15.6V8.4L15.8 12l-6.2 3.6z" />
      </svg>
    ),
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    color: '#0077B5',
    hint: 'URL company o profilo',
    default: false,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zM8 17H5.5v-7H8v7zM6.8 9a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zM18 17h-2.5v-3.5c0-.8 0-1.8-1.1-1.8s-1.3.9-1.3 1.8V17H10.5v-7H13v1h.1c.3-.6 1.1-1.2 2.3-1.2 2.5 0 3 1.6 3 3.7V17z" />
      </svg>
    ),
  },
  {
    id: 'twitter',
    name: 'Twitter / X',
    color: '#000',
    hint: 'es. @username',
    default: false,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M13.6 10.8L20.9 2.4h-1.7l-6.4 7.4L7.7 2.4H1.8l7.7 11.2-7.7 9h1.7l6.8-7.9 5.4 7.9h5.9L13.6 10.8zm-2.4 2.8l-.8-1.1L4.2 3.7h2.7l5 7.2.8 1.1 6.6 9.4h-2.7l-5.4-7.8z" />
      </svg>
    ),
  },
];

export function SocialScanForm() {
  const router = useRouter();
  const [selected, setSelected] = useState<Record<Platform, boolean>>(() => {
    const init: any = {};
    SOCIALS.forEach((s) => (init[s.id] = s.default));
    return init;
  });
  const [username, setUsername] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const activeSocials = SOCIALS.filter((s) => selected[s.id]);
  const primary = activeSocials[0]; // il primo spuntato diventa quello iniziale

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !primary) return;
    setSubmitting(true);

    // Passiamo i social selezionati come query per permettere al dashboard di inizializzare le tab
    const platforms = activeSocials.map((s) => s.id).join(',');
    const clean = username.trim().replace('@', '').toLowerCase();
    router.push(`/dashboard/${primary.id}/${encodeURIComponent(clean)}?platforms=${platforms}`);
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Social picker */}
      <div className="mb-6">
        <div className="text-sm text-ink-700 mb-3 font-medium">Su quali social vuoi fare lo scan?</div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {SOCIALS.map((s) => {
            const isActive = selected[s.id];
            return (
              <label
                key={s.id}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                  isActive
                    ? 'border-ink-900 bg-ink-50'
                    : 'border-ink-200 hover:border-ink-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setSelected({ ...selected, [s.id]: e.target.checked })}
                  className="w-4 h-4 rounded accent-ink-900"
                />
                <span style={{ color: isActive ? s.color : '#737369' }}>{s.icon}</span>
                <span className={`text-sm font-medium ${isActive ? 'text-ink-900' : 'text-ink-700'}`}>
                  {s.name}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Input + submit */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder={primary?.hint || 'Inserisci username/URL del profilo'}
            className="w-full px-5 py-4 pr-32 text-base md:text-lg rounded-full border-2 border-ink-200 focus:border-ink-900 focus:outline-none bg-white text-ink-900 placeholder:text-ink-500"
            disabled={submitting || !primary}
          />
          <button
            type="submit"
            disabled={!username.trim() || !primary || submitting}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-5 py-2.5 bg-ink-900 text-white rounded-full text-sm md:text-base font-medium hover:bg-ink-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? 'Attendi...' : 'Scansiona'}
          </button>
        </div>

        <p className="text-xs text-ink-600 text-center">
          {activeSocials.length === 0 ? (
            <span className="text-amber-700">Seleziona almeno un social per procedere.</span>
          ) : (
            <>Lo scan partirà da <strong>{primary?.name}</strong>. Gli altri social selezionati appariranno come tab nella dashboard.</>
          )}
        </p>
      </form>
    </div>
  );
}
