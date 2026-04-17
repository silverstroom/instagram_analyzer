import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ProfileDashboard } from '@/components/ProfileDashboard';
import { getHikerClient, COST_PER_REQUEST_USD } from '@/lib/hikerapi/client';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { calculateEngagement, engagementRating } from '@/lib/analytics/engagement';
import { analyzePostingPattern } from '@/lib/analytics/posting-patterns';
import { extractHashtagStats } from '@/lib/analytics/hashtags';

export const dynamic = 'force-dynamic';

/**
 * Quick analysis diretta: niente fetch HTTP interna, si chiamano direttamente
 * le funzioni. Evita problemi di Deployment Protection su Vercel.
 */
async function runQuickAnalysis(username: string) {
  const hiker = getHikerClient();
  const analysisId = `quick_${username}_${Date.now()}`;

  const user = await hiker.userByUsername(username, { analysisId });

  if (user.is_private) {
    return {
      username,
      user,
      private: true,
      message: 'Profilo privato: analisi limitata alle info pubbliche',
    };
  }

  const posts = await hiker.userMediasBulk(user.pk, 12, { analysisId });
  const engagement = calculateEngagement(user, posts);
  const rating = engagementRating(engagement.engagementRate);
  const pattern = analyzePostingPattern(posts);
  const hashtags = extractHashtagStats(posts).slice(0, 10);

  const logs = hiker.drainLog();
  const totalRequests = logs.length;
  const totalCost = totalRequests * COST_PER_REQUEST_USD;

  // Salva snapshot + log costi (non bloccante se fallisce)
  try {
    const supabase = getSupabaseAdmin();

    await supabase.from('profile_snapshots').upsert(
      {
        username: user.username,
        instagram_id: user.pk,
        snapshot_date: new Date().toISOString().slice(0, 10),
        follower_count: user.follower_count,
        following_count: user.following_count,
        media_count: user.media_count,
        is_verified: user.is_verified,
        is_business: user.is_business,
        is_private: user.is_private,
        bio: user.biography,
        full_name: user.full_name,
        profile_pic_url: user.profile_pic_url,
        external_url: user.external_url,
        category: user.category,
      },
      { onConflict: 'username,snapshot_date' }
    );

    await supabase.from('api_usage').insert({
      profile_username: username,
      analysis_type: 'quick',
      modules_used: ['profile', 'recent_posts'],
      request_count: totalRequests,
      estimated_cost_usd: totalCost,
      success: true,
    });
  } catch (e) {
    console.error('[dashboard] DB write failed:', e);
  }

  return {
    username,
    user,
    posts,
    engagement,
    rating,
    pattern,
    hashtags,
    cost: {
      requests: totalRequests,
      usd: totalCost,
    },
  };
}

export default async function DashboardPage({
  params,
}: {
  params: { username: string };
}) {
  const username = params.username.replace('@', '').trim().toLowerCase();

  let data;
  try {
    data = await runQuickAnalysis(username);
  } catch (err: any) {
    console.error('[dashboard] analysis error:', err);
    return (
      <main className="min-h-screen">
        <div className="max-w-3xl mx-auto px-6 py-20">
          <Link
            href="/"
            className="text-sm text-ink-500 hover:text-ink-900 mb-6 inline-block"
          >
            ← Torna alla home
          </Link>
          <h1 className="font-display text-3xl mb-4">Analisi non riuscita</h1>
          <p className="text-ink-600">
            Non è stato possibile analizzare <strong>@{username}</strong>.
          </p>
          <pre className="mt-4 p-4 bg-ink-100 rounded-md text-sm text-accent-700 overflow-auto whitespace-pre-wrap">
            {err?.message ?? 'Errore sconosciuto'}
          </pre>
        </div>
      </main>
    );
  }

  if (!data.user) notFound();

  return <ProfileDashboard initialData={data} username={username} />;
}
