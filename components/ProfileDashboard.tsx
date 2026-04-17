'use client';

import Link from 'next/link';
import { useState } from 'react';
import { MetricsGrid } from './MetricsGrid';
import { DeepFocusCard } from './DeepFocusCard';
import { DeepFocusResults } from './DeepFocusResults';
import { formatCompact, formatPct } from '@/lib/utils';

interface Props {
  initialData: any;
  username: string;
}

export function ProfileDashboard({ initialData, username }: Props) {
  const [deepData, setDeepData] = useState<any>(null);
  const { user, engagement, rating, pattern, hashtags, cost, private: isPrivate } = initialData;

  return (
    <main className="min-h-screen">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <nav className="flex items-center justify-between mb-10">
          <Link
            href="/"
            className="text-sm text-ink-500 hover:text-ink-900 inline-flex items-center gap-1 transition-colors"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="w-4 h-4"
            >
              <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Home
          </Link>

          <span className="text-xs text-ink-500 tabular">
            Quick analysis · {cost?.requests ?? 2} req · ${cost?.usd?.toFixed(4) ?? '0.0012'}
          </span>
        </nav>

        {/* Header profilo */}
        <header className="flex flex-wrap items-start gap-6 mb-12 animate-fade-in">
          <img
            src={user.profile_pic_url}
            alt={user.username}
            className="w-24 h-24 rounded-full object-cover bg-ink-100 flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="font-display text-3xl md:text-4xl">@{user.username}</h1>
              {user.is_verified && (
                <svg viewBox="0 0 24 24" className="w-6 h-6 text-blue-500 fill-current">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            {user.full_name && (
              <p className="text-ink-700 mb-2">{user.full_name}</p>
            )}
            {user.biography && (
              <p className="text-sm text-ink-600 whitespace-pre-wrap max-w-xl">
                {user.biography}
              </p>
            )}
            {user.external_url && (
              <a
                href={user.external_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-sm text-accent-600 hover:underline"
              >
                {user.external_url}
              </a>
            )}
          </div>
        </header>

        {isPrivate ? (
          <div className="p-6 bg-ink-50 border border-ink-200 rounded-xl">
            <p className="text-ink-700">
              Questo profilo è privato. Posso mostrarti solo i dati pubblici:
              follower, following, post count.
            </p>
          </div>
        ) : (
          <>
            {/* Metriche quick */}
            <MetricsGrid
              follower={user.follower_count}
              following={user.following_count}
              posts={user.media_count}
              engagementRate={engagement.engagementRate}
              rating={rating}
              avgPostsPerWeek={pattern.avgPostsPerWeek}
              bestDay={pattern.bestDayOfWeek.day}
              bestHour={pattern.bestHour.hour}
            />

            {/* Top hashtag preview */}
            {hashtags && hashtags.length > 0 && (
              <section className="mb-10 animate-slide-up">
                <h2 className="font-display text-xl mb-4">Hashtag più performanti</h2>
                <div className="flex flex-wrap gap-2">
                  {hashtags.slice(0, 8).map((h: any) => (
                    <span
                      key={h.tag}
                      className="px-3 py-1.5 bg-ink-100 rounded-full text-sm tabular"
                      title={`${h.usageCount} usi · avg engagement ${formatCompact(h.avgEngagement)}`}
                    >
                      {h.tag}
                      <span className="ml-1.5 text-ink-500 text-xs">
                        {formatCompact(h.avgEngagement)}
                      </span>
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Deep focus trigger */}
            {!deepData && (
              <DeepFocusCard
                username={username}
                user={user}
                onComplete={setDeepData}
              />
            )}

            {/* Deep focus results */}
            {deepData && <DeepFocusResults data={deepData} />}
          </>
        )}
      </div>
    </main>
  );
}
