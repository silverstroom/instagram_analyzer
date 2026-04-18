import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/cache-check?platform=...&username=...
 *
 * Controlla se un'analisi per quel profilo è già presente nel DB.
 * Risposta: { inCache: boolean, analyzedAt?: string }
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const platform = searchParams.get('platform') || '';
  const username = (searchParams.get('username') || '').replace('@', '').trim().toLowerCase();

  if (!platform || !username) {
    return NextResponse.json({ inCache: false });
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from('analyses_cache')
      .select('analyzed_at')
      .eq('platform', platform)
      .eq('username', username)
      .limit(1);

    if (data && data.length > 0) {
      return NextResponse.json({ inCache: true, analyzedAt: data[0].analyzed_at });
    }
    return NextResponse.json({ inCache: false });
  } catch {
    return NextResponse.json({ inCache: false });
  }
}
