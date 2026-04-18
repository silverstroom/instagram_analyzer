'use client';

import { Avatar } from './Avatar';
import { VerifiedBadge } from './VerifiedBadge';
import { formatCompact, formatPct } from '@/lib/utils';
import type { NormalizedProfile, NormalizedPost } from '@/lib/scrapecreators/normalizer';

interface Props {
  profile: NormalizedProfile;
  posts: NormalizedPost[];
}

export function ProfileHeader({ profile, posts }: Props) {
  // Calcola engagement rate
  const engagementRate =
    posts.length > 0 && profile.followerCount > 0
      ? (posts.reduce((s, p) => s + p.likeCount + p.commentCount + (p.shareCount || 0), 0) /
          posts.length /
          profile.followerCount) *
        100
      : 0;

  return (
    <header className="animate-fade-in">
      {/* Avatar + nome GROSSO con badge verificato GROSSO */}
      <div className="flex items-start gap-4 md:gap-6 mb-6">
        <Avatar
          src={profile.profilePicUrlHd || profile.profilePicUrl}
          alt={profile.fullName || profile.handle}
          size={104}
        />

        <div className="flex-1 min-w-0 pt-1">
          {/* Nome con badge grande */}
          <div className="flex items-center gap-2 md:gap-3 flex-wrap mb-1">
            <h1 className="font-display text-3xl md:text-5xl text-ink-900 leading-tight">
              {profile.fullName || `@${profile.handle}`}
            </h1>
            {profile.isVerified && <VerifiedBadge source={`${profile.platform}_api` as any} size="xl" />}
          </div>

          {profile.fullName && (
            <div className="text-base md:text-lg text-ink-700 mb-2">@{profile.handle}</div>
          )}

          {/* Badges info */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {profile.isBusiness && (
              <span className="text-xs uppercase tracking-wider text-ink-700 px-2 py-0.5 bg-ink-100 rounded">
                Business
              </span>
            )}
            {profile.category && (
              <span className="text-xs uppercase tracking-wider text-ink-700 px-2 py-0.5 bg-ink-100 rounded">
                {profile.category}
              </span>
            )}
            {profile.isPrivate && (
              <span className="text-xs uppercase tracking-wider text-amber-800 px-2 py-0.5 bg-amber-100 rounded">
                Privato
              </span>
            )}
          </div>

          {/* Bio */}
          {profile.biography && (
            <p className="text-base text-ink-800 whitespace-pre-wrap max-w-xl leading-relaxed mb-2">
              {profile.biography}
            </p>
          )}

          {/* Link esterno */}
          {profile.externalUrl && (
            <a
              href={profile.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-base text-blue-700 hover:underline break-all"
            >
              {profile.externalUrl}
            </a>
          )}
        </div>
      </div>

      {/* Metriche principali */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricBox
          label="Follower"
          value={formatCompact(profile.followerCount)}
          verified
          source={`${profile.platform}_api` as any}
        />
        <MetricBox
          label="Seguiti"
          value={formatCompact(profile.followingCount)}
          verified
          source={`${profile.platform}_api` as any}
        />
        <MetricBox
          label="Post totali"
          value={formatCompact(profile.mediaCount)}
          verified
          source={`${profile.platform}_api` as any}
        />
        <MetricBox
          label="Engagement rate"
          value={engagementRate > 0 ? formatPct(engagementRate, 2) : '—'}
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
  source: any;
}) {
  return (
    <div
      className={`rounded-xl p-4 md:p-5 border ${
        highlight ? 'bg-ink-900 text-white border-ink-900' : 'bg-ink-50 border-ink-100'
      }`}
    >
      <div className="flex items-center gap-1.5 mb-1.5">
        <span
          className={`text-xs uppercase tracking-widest ${
            highlight ? 'text-ink-300' : 'text-ink-700'
          }`}
        >
          {label}
        </span>
        {verified && <VerifiedBadge source={source} size="sm" />}
      </div>
      <div className="font-display text-3xl md:text-4xl tabular leading-none">{value}</div>
    </div>
  );
}
