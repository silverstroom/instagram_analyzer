import { NextResponse } from 'next/server';
import { getHikerClient, COST_PER_REQUEST_USD } from '@/lib/hikerapi/client';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/**
 * GET /api/cron/snapshot
 *
 * Eseguito giornalmente da Vercel Cron (vedi vercel.json).
 * Aggiorna gli snapshot di tutti i profili trackati.
 * Protetto da CRON_SECRET per evitare chiamate non autorizzate.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  const expected = `Bearer ${process.env.CRON_SECRET}`;

  // Vercel Cron aggiunge automaticamente l'header Authorization con CRON_SECRET
  if (process.env.CRON_SECRET && authHeader !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const hiker = getHikerClient();

  const { data: tracked, error } = await supabase
    .from('tracked_profiles')
    .select('username');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const profiles = tracked ?? [];
  const results: { username: string; ok: boolean; error?: string }[] = [];
  const today = new Date().toISOString().slice(0, 10);

  for (const row of profiles) {
    const username = row.username;
    try {
      const user = await hiker.userByUsername(username);

      await supabase.from('profile_snapshots').upsert(
        {
          username: user.username,
          instagram_id: user.pk,
          snapshot_date: today,
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

      results.push({ username, ok: true });

      // Piccola pausa per rispettare rate limit
      await new Promise((r) => setTimeout(r, 200));
    } catch (e: any) {
      console.error(`[cron] snapshot failed for ${username}:`, e);
      results.push({ username, ok: false, error: e?.message });
    }
  }

  const requestCount = hiker.drainLog().length;
  const totalCost = requestCount * COST_PER_REQUEST_USD;

  // Log aggregato
  await supabase.from('api_usage').insert({
    profile_username: '__cron__',
    analysis_type: 'snapshot',
    modules_used: ['profile'],
    request_count: requestCount,
    estimated_cost_usd: totalCost,
    success: true,
  });

  return NextResponse.json({
    date: today,
    processed: results.length,
    succeeded: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    cost: { requests: requestCount, usd: totalCost },
    results,
  });
}
