'use client';

import Link from 'next/link';
import { useState } from 'react';
import { PlatformTabs, type TabId } from './PlatformTabs';
import { ProfileHeader } from './ProfileHeader';
import { AIEvaluationBox } from './AIEvaluationBox';
import { AuthenticityCard } from './AuthenticityCard';
import { FollowerGrowthChart } from './FollowerGrowthChart';
import { PostingHeatmap } from './PostingHeatmap';
import { TagCloud } from './TagCloud';
import { TopPostsGrid } from './TopPostsGrid';
import { ContentMixChart } from './ContentMixChart';
import { DeepFocusCard } from './DeepFocusCard';
import { DeepFocusResults } from './DeepFocusResults';
import { FacebookPanel } from './FacebookPanel';

interface Props {
  initialData: any;
  username: string;
}

export function ProfileDashboardV4({ initialData, username }: Props) {
  const [tab, setTab] = useState<TabId>('instagram');
  const [deepData, setDeepData] = useState<any>(null);
  const {
    user,
    engagement,
    pattern,
    hashtags,
    topPosts,
    posts,
    snapshotHistory,
    authenticity,
    evaluation,
    cost,
    private: isPrivate,
  } = initialData;

  return (
    <main className="min-h-screen">
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-10">
        <nav className="flex items-center justify-between mb-6 md:mb-8">
          <Link
            href="/"
            className="text-sm text-ink-500 hover:text-ink-900 inline-flex items-center gap-1"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="w-4 h-4"
            >
              <path
                d="M15 19l-7-7 7-7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Home
          </Link>
          <Link
            href="/storico"
            className="text-sm text-ink-500 hover:text-ink-900"
          >
            Storico ricerche
          </Link>
        </nav>

        <PlatformTabs active={tab} onChange={setTab} />

        {tab === 'instagram' && (
          <>
            <ProfileHeader
              user={user}
              engagementRate={engagement.engagementRate}
              avgPostsPerWeek={pattern.avgPostsPerWeek}
              analysisCost={cost}
            />

            {isPrivate ? (
              <div className="p-6 bg-ink-50 border border-ink-200 rounded-xl text-ink-700 text-base">
                Questo profilo è privato. Posso mostrarti solo i dati pubblici
                di base.
              </div>
            ) : (
              <div className="space-y-6 md:space-y-8 animate-slide-up">
                {/* Valutazione AI in cima */}
                <AIEvaluationBox evaluation={evaluation} />

                {/* Grid 2 colonne su desktop, 1 su mobile */}
                <div className="grid md:grid-cols-2 gap-4">
                  {authenticity && <AuthenticityCard report={authenticity} />}
                  {snapshotHistory && (
                    <FollowerGrowthChart snapshots={snapshotHistory} />
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <ContentMixChart posts={posts} />
                  <div className="p-5 rounded-xl border border-ink-100 bg-ink-50">
                    <div className="text-xs uppercase tracking-widest text-ink-500 mb-3">
                      Momenti migliori
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-ink-500">Giorno</div>
                        <div className="font-display text-3xl mt-1">
                          {pattern.bestDayOfWeek.day}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-ink-500">Ora</div>
                        <div className="font-display text-3xl mt-1 tabular">
                          {String(pattern.bestHour.hour).padStart(2, '0')}:00
                        </div>
                      </div>
                      <div className="col-span-2 pt-3 border-t border-ink-100">
                        <div className="text-sm text-ink-500">Frequenza</div>
                        <div className="font-display text-2xl mt-1 tabular">
                          {pattern.avgPostsPerWeek.toFixed(1)}{' '}
                          <span className="text-base text-ink-500">
                            post/settimana
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {posts && posts.length > 0 && <PostingHeatmap posts={posts} />}

                {topPosts && topPosts.length > 0 && (
                  <TopPostsGrid posts={topPosts} username={user.username} />
                )}

                <TagCloud hashtags={hashtags} />

                {!deepData && (
                  <DeepFocusCard
                    username={username}
                    user={user}
                    onComplete={setDeepData}
                  />
                )}

                {deepData && <DeepFocusResults data={deepData} />}
              </div>
            )}
          </>
        )}

        {tab === 'facebook' && <FacebookPanel igUsername={username} />}
      </div>
    </main>
  );
}
