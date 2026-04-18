'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { Platform } from '@/lib/scrapecreators/client';

interface SocialMeta {
  id: Platform;
  name: string;
  color: string;
  hint: string;
  default: boolean;
  icon: React.ReactNode;
}

const SOCIALS: SocialMeta[] = [
  {
    id: 'instagram',
    name: 'Instagram',
    color: '#E1306C',
    hint: 'username IG, es. edunews_24',
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
    hint: 'URL pagina FB, es. https://www.facebook.com/EduNews24.it',
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
    hint: 'handle TikTok, es. @username',
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
    hint: 'handle canale, es. @channelname',
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
    hint: 'URL company LinkedIn, es. linkedin.com/company/...',
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
    hint: 'handle X, es. @username',
    default: false,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M13.6 10.8L20.9 2.4h-1.7l-6.4 7.4L7.7 2.4H1.8l7.7 11.2-7.7 9h1.7l6.8-7.9 5.4 7.9h5.9L13.6 10.8z" />
      </svg>
    ),
  },
];

/**
 * Form home con UN input per ogni social selezionato.
 * Gli handle tra social sono diversi (es. edunews_24 su IG, EduNews24.it su FB),
 * quindi servono campi separati.
 */
export function SocialScanForm() {
  const router = useRouter();
  const [selected, setSelected] = useState<Record<Platform, boolean>>(() => {
    const init: any = {};
    SOCIALS.forEach((s) => (init[s.id] = s.default));
    return init;
  });
  const [inputs, setInputs] = useState<Record<Platform, string>>({
    instagram: '',
    facebook: '',
    tiktok: '',
    youtube: '',
    linkedin: '',
    twitter: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const activeSocials = SOCIALS.filter((s) => selected[s.id]);
  const filledActive = activeSocials.filter((s) => inputs[s.id].trim().length > 0);
  const primary = filledActive[0];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!primary) return;
    setSubmitting(true);

    const platforms = filledActive.map((s) => s.id).join(',');

    // Passa gli handle di tutti i social selezionati via query string
    const handlesParam = filledActive
      .map((s) => `${s.id}:${encodeURIComponent(inputs[s.id].trim())}`)
      .join(',');

    const primaryHandle = cleanHandle(inputs[primary.id], primary.id);
    router.push(
      `/dashboard/${primary.id}/${encodeURIComponent(primaryHandle)}?platforms=${platforms}&handles=${encodeURIComponent(handlesParam)}`
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-5">
        <div className="text-sm text-ink-700 mb-3 font-medium">
          Su quali social vuoi fare lo scan?
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {SOCIALS.map((s) => {
            const isActive = selected[s.id];
            return (
              <label
                key={s.id}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                  isActive ? 'border-ink-900 bg-ink-50' : 'border-ink-200 hover:border-ink-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setSelected({ ...selected, [s.id]: e.target.checked })}
                  className="w-4 h-4 rounded accent-ink-900"
                />
                <span style={{ color: isActive ? s.color : '#6b6b61' }}>{s.icon}</span>
                <span className={`text-sm font-medium ${isActive ? 'text-ink-900' : 'text-ink-700'}`}>
                  {s.name}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Input dedicato per ogni social selezionato */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-2">
          {activeSocials.map((s) => (
            <div
              key={s.id}
              className="flex items-center gap-2 rounded-lg border border-ink-200 bg-white focus-within:border-ink-900 transition-colors"
            >
              <div
                className="shrink-0 w-11 h-11 rounded-l-lg flex items-center justify-center border-r border-ink-200"
                style={{ color: s.color }}
              >
                {s.icon}
              </div>
              <input
                type="text"
                value={inputs[s.id]}
                onChange={(e) => setInputs({ ...inputs, [s.id]: e.target.value })}
                placeholder={s.hint}
                className="flex-1 py-2.5 pr-3 text-sm md:text-base bg-transparent outline-none text-ink-900 placeholder:text-ink-500 min-w-0"
                disabled={submitting}
              />
            </div>
          ))}
          {activeSocials.length === 0 && (
            <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 p-3 rounded-lg">
              Seleziona almeno un social per iniziare.
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={!primary || submitting}
          className="w-full px-6 py-3.5 bg-ink-900 text-white rounded-full text-base md:text-lg font-medium hover:bg-ink-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {submitting ? 'Analisi in corso...' : `Scansiona ${filledActive.length > 0 ? filledActive.length : ''} social`}
        </button>

        {filledActive.length > 0 && (
          <p className="text-xs text-ink-600 text-center">
            Partiremo da <strong>{primary?.name}</strong>. Gli altri social con dati compilati
            diventeranno tab nella dashboard.
          </p>
        )}
      </form>
    </div>
  );
}

/**
 * Ripulisce l'input dell'utente per generare un identificatore usabile nella URL.
 * Per IG/TikTok/Twitter/YouTube: elimina @ e spazi.
 * Per Facebook: se è URL completo lascia come è (URL-encoded), se è handle pulito
 * lo usa direttamente.
 * Per LinkedIn: accetta URL company.
 */
function cleanHandle(raw: string, platform: Platform): string {
  const trimmed = raw.trim();

  if (platform === 'facebook' || platform === 'linkedin') {
    // Se è URL completo, estraggo l'ultimo segmento per URL-friendliness
    try {
      const u = new URL(trimmed);
      const parts = u.pathname.split('/').filter(Boolean);
      // Per FB l'handle è il primo segmento dopo il dominio
      // Per LinkedIn può essere company/X o in/X, prendiamo l'ultimo segmento utile
      const handle = parts[parts.length - 1] || parts[0] || '';
      return handle;
    } catch {
      // Non è URL valido, usa come è
      return trimmed.replace(/^@/, '');
    }
  }

  return trimmed.replace(/^@/, '').toLowerCase();
}
