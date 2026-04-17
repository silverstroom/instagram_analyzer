import { NextResponse } from 'next/server';
import { getHikerClient, COST_PER_REQUEST_USD } from '@/lib/hikerapi/client';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { calculateEngagement, engagementRating } from '@/lib/analytics/engagement';
import { analyzePostingPattern } from '@/lib/analytics/posting-patterns';
import { extractHashtagStats } from '@/lib/analytics/hashtags';

export const dynamic = 'force-dynamic';

/**
 * GET /api/profiles/[username]
 *
 * Quick analysis: 2 chiamate API (profilo + ultimi 12 post).
 * Sempre gratuita per l'utente finale, costo ~$0.0012.
 */
export async function GET(
  _req: Request,
  { params }: { params: { username: string } }
) {
  const username = params.username.replace('@', '').trim().toLowerCase();
  const analysisId = `quick_${username}_${Date.now()}`;

  try {
    const hiker = getHikerClient();

    // 1. Profilo base
    const user = await hiker.userByUsername(username, { analysisId });

    if (user.is_private) {
      return NextResponse.json({
        username,
        user,
        private: true,
        message: 'Profilo privato: analisi limitata alle info pubbliche',
      });
    }

    // 2. Ultimi 12 post
    const posts = await hiker.userMediasBulk(user.pk, 12, { analysisId });

    // Calcolo metriche locali (zero costo aggiuntivo)
    const engagement = calculateEngagement(user, posts);
    const rating = engagementRating(engagement.engagementRate);
    const pattern = analyzePostingPattern(posts);
    const hashtags = extractHashtagStats(posts).slice(0, 10);

    const logs = hiker.drainLog();
    const totalRequests = logs.length;
    const totalCost = totalRequests * COST_PER_REQUEST_USD;

    // Salva snapshot + log costi (non blocchiamo la risposta se fallisce)
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
      console.error('[quick-analysis] DB write failed:', e);
    }

    return NextResponse.json({
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
    });
  } catch (err: any) {
    console.error('[quick-analysis] error:', err);
    try {
      const supabase = getSupabaseAdmin();
      await supabase.from('api_usage').insert({
        profile_username: username,
        analysis_type: 'quick',
        request_count: 0,
        estimated_cost_usd: 0,
        success: false,
        error_message: err?.message ?? 'unknown',
      });
    } catch {}

    return NextResponse.json(
      { error: err?.message ?? 'Errore durante l\'analisi' },
      { status: 500 }
    );
  }
}
