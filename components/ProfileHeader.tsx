'use client';

import { Avatar } from './Avatar';
import { VerifiedBadge } from './VerifiedBadge';
import { formatCompact, formatPct } from '@/lib/utils';

interface Props {
  user: any;
  engagementRate: number;
  avgPostsPerWeek: number;
  analysisCost: { requests: number; usd: number };
}

/**
 * Header del profilo con tutte le info essenziali in una sola sezione ordinata.
 * Ogni dato "ufficiale" ha un badge verificato che spiega la fonte.
 */
export function ProfileHeader({ user, engagementRate, avgPostsPerWeek, analysisCost }: Props) {
  return (
    <header className="mb-8 animate-fade-in">
      {/* Cost pill in alto a destra */}
      <div className="flex justify-end mb-4">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-ink-100 text-ink-600 text-[11px] tabular">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" strokeLinecap="round" />
          </svg>
          Panoramica gratuita · {analysisCost.requests} req · ${analysisCost.usd.toFixed(4)}
        </span>
      </div>

      {/* Avatar + info */}
      <div className="flex items-start gap-5">
        <Avatar src={user.profile_pic_url} alt={user.full_name || user.username} size={96} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h1 className="font-display text-3xl md:text-4xl text-ink-900">
              @{user.username}
            </h1>
            {user.is_verified && (
              <span title="Account verificato da Meta" className="inline-flex">
                <svg viewBox="0 0 24 24" className="w-6 h-6">
                  <path
                    d="M12 2l2.39 2.39 3.3-.43.43 3.3L20.5 10l-2.39 2.39.43 3.3-3.3.43L12 19l-2.39-2.39-3.3.43-.43-3.3L3.5 12l2.39-2.39-.43-3.3 3.3-.43L12 2z"
                    fill="#1877F2"
                  />
                  <path
                    d="M10.5 14.5l-2-2 1-1 1 1 3-3 1 1-4 4z"
                    fill="white"
                  />
                </svg>
              </span>
            )}
            {user.is_business && (
              <span className="text-[10px] uppercase tracking-wider text-ink-500 px-1.5 py-0.5 bg-ink-100 rounded">
                business
              </span>
            )}
            {user.category && (
              <span className="text-[10px] uppercase tracking-wider text-ink-500 px-1.5 py-0.5 bg-ink-100 rounded">
                {user.category}
              </span>
            )}
          </div>

          {user.full_name && (
            <p className="text-ink-700 text-lg mb-1">{user.full_name}</p>
          )}

          {user.biography && (
            <p className="text-sm text-ink-600 whitespace-pre-wrap max-w-xl mb-2">
              {user.biography}
            </p>
          )}

          {user.external_url && (
            <a
              href={user.external_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-sm text-blue-600 hover:underline"
            >
              {user.external_url}
            </a>
          )}
        </div>
      </div>

      {/* Metriche principali in una linea, con badge verificato */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricBox
          label="Follower"
          value={formatCompact(user.follower_count)}
          verified
          source="instagram_api"
        />
        <MetricBox
          label="Seguiti"
          value={formatCompact(user.following_count)}
          verified
          source="instagram_api"
        />
        <MetricBox
          label="Post pubblicati"
          value={formatCompact(user.media_count)}
          verified
          source="instagram_api"
        />
        <MetricBox
          label="Engagement rate"
          value={formatPct(engagementRate, 2)}
          highlight
          source="calculated"
        />
      </div>
    </header>
  );
}

function MetricBox({
  label,
  value,
  verified,
  highlight,
  source,
}: {
  label: string;
  value: string;
  verified?: boolean;
  highlight?: boolean;
  source: 'instagram_api' | 'facebook_api' | 'calculated' | 'historical_db';
}) {
  return (
    <div
      className={`rounded-xl p-4 border transition-colors ${
        highlight
          ? 'bg-ink-900 text-ink-50 border-ink-900'
          : 'bg-ink-50 border-ink-100'
      }`}
    >
      <div className="flex items-center gap-1.5 mb-1.5">
        <span
          className={`text-[10px] uppercase tracking-widest ${
            highlight ? 'text-ink-300' : 'text-ink-500'
          }`}
        >
          {label}
        </span>
        {verified && <VerifiedBadge source={source} />}
      </div>
      <div className="font-display text-3xl tabular leading-none">{value}</div>
    </div>
  );
}
