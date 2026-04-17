'use client';

import { formatCompact, formatPct, formatUsd } from '@/lib/utils';

interface Props {
  data: any;
}

export function DeepFocusResults({ data }: Props) {
  const { posts, hashtags, stories, audience, competitors, cost } = data;

  return (
    <section className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between pb-3 border-b border-ink-200">
        <h2 className="font-display text-2xl">Analisi approfondita</h2>
        <div className="text-xs text-ink-500 tabular">
          {cost?.requests} req · {formatUsd(cost?.usd ?? 0)} (stima: {formatUsd(cost?.estimated ?? 0)})
        </div>
      </div>

      {/* Posts analysis */}
      {posts && (
        <div>
          <h3 className="font-display text-lg mb-4">Ultimi {posts.items.length} post</h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <Metric label="Engagement rate" value={formatPct(posts.engagement.engagementRate, 2)} />
            <Metric label="Media like" value={formatCompact(posts.engagement.avgLikes)} />
            <Metric label="Media commenti" value={formatCompact(posts.engagement.avgComments)} />
            <Metric
              label="Post/settimana"
              value={posts.pattern.avgPostsPerWeek.toFixed(1)}
            />
          </div>

          {/* Heatmap oraria */}
          <div className="p-5 bg-ink-50 rounded-xl border border-ink-100">
            <div className="text-xs uppercase tracking-wider text-ink-500 mb-3">
              Engagement medio per ora del giorno
            </div>
            <HourHeatmap data={posts.pattern.hourDistribution} />
          </div>
        </div>
      )}

      {/* Hashtag */}
      {hashtags && (
        <div>
          <h3 className="font-display text-lg mb-4">Top hashtag ({hashtags.topByPerformance.length})</h3>
          <div className="overflow-hidden rounded-xl border border-ink-100">
            <table className="w-full text-sm">
              <thead className="bg-ink-50 text-ink-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left px-4 py-2">Hashtag</th>
                  <th className="text-right px-4 py-2">Usi</th>
                  <th className="text-right px-4 py-2">Avg engagement</th>
                </tr>
              </thead>
              <tbody>
                {hashtags.topByPerformance.slice(0, 15).map((h: any) => (
                  <tr key={h.tag} className="border-t border-ink-100">
                    <td className="px-4 py-2 font-mono text-xs">{h.tag}</td>
                    <td className="px-4 py-2 text-right tabular">{h.usageCount}</td>
                    <td className="px-4 py-2 text-right tabular font-medium">
                      {formatCompact(h.avgEngagement)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stories */}
      {stories && stories.length > 0 && (
        <div>
          <h3 className="font-display text-lg mb-4">Stories attive ({stories.length})</h3>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {stories.map((s: any) => (
              <div
                key={s.pk}
                className="flex-shrink-0 w-24 h-40 rounded-lg bg-ink-100 overflow-hidden border border-ink-200"
              >
                {s.thumbnail_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={s.thumbnail_url}
                    alt="story"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Audience */}
      {audience && (
        <div>
          <h3 className="font-display text-lg mb-4">Audience quality</h3>
          <div className="grid grid-cols-3 gap-3">
            <Metric
              label="Sample"
              value={audience.sampleSize.toString()}
              sub="follower analizzati"
            />
            <Metric
              label="Verificati"
              value={formatPct(audience.verifiedPct, 1)}
              sub="dell'audience"
            />
            <Metric
              label="Con foto profilo"
              value={formatPct(audience.withProfilePicPct, 1)}
              sub="indice di qualità"
            />
          </div>
        </div>
      )}

      {/* Competitor */}
      {competitors && competitors.length > 0 && (
        <div>
          <h3 className="font-display text-lg mb-4">Competitor suggeriti</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {competitors.map((c: any) => (
              <a
                key={c.pk}
                href={`/dashboard/${c.username}`}
                className="block p-3 bg-ink-50 border border-ink-100 rounded-lg text-center hover:bg-ink-100 hover:border-ink-200 transition-colors"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={c.profile_pic_url}
                  alt={c.username}
                  className="w-12 h-12 rounded-full mx-auto mb-2 bg-ink-200 object-cover"
                />
                <div className="text-xs font-medium truncate">@{c.username}</div>
                {c.full_name && (
                  <div className="text-[10px] text-ink-500 truncate">{c.full_name}</div>
                )}
              </a>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function Metric({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="p-4 bg-ink-50 rounded-lg border border-ink-100">
      <div className="text-[10px] uppercase tracking-widest text-ink-500 mb-1.5">
        {label}
      </div>
      <div className="font-display text-xl tabular">{value}</div>
      {sub && <div className="text-xs text-ink-500 mt-0.5">{sub}</div>}
    </div>
  );
}

function HourHeatmap({ data }: { data: number[] }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-1 h-24">
      {data.map((v, i) => {
        const h = (v / max) * 100;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div
              className="w-full bg-ink-900 rounded-t-sm transition-all"
              style={{ height: `${h}%`, minHeight: '2px', opacity: h > 0 ? 0.4 + h / 200 : 0.1 }}
              title={`Ore ${i}: ${formatCompact(v)} avg engagement`}
            />
            {i % 3 === 0 && (
              <span className="text-[9px] text-ink-500 tabular">{i}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
