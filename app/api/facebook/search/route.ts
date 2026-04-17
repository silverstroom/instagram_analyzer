import { NextResponse } from 'next/server';
import { getSearchAPIClient, SEARCHAPI_COST_USD } from '@/lib/searchapi/client';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/facebook/search?q=...&country=IT
 *
 * Cerca pagine Facebook candidate per un dato username/nome.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get('q');
  const country = url.searchParams.get('country') || 'IT';

  if (!q) {
    return NextResponse.json({ error: 'parametro q richiesto' }, { status: 400 });
  }

  const client = getSearchAPIClient();
  if (!client.isConfigured()) {
    return NextResponse.json(
      {
        error:
          'SearchAPI non configurato: aggiungi SEARCHAPI_KEY nelle variabili d\'ambiente di Vercel',
      },
      { status: 503 }
    );
  }

  try {
    const candidates = await client.pageSearch(q, country);
    const cost = client.drainRequestCount() * SEARCHAPI_COST_USD;

    try {
      const supabase = getSupabaseAdmin();
      await supabase.from('api_usage').insert({
        profile_username: q,
        analysis_type: 'facebook_search',
        request_count: 1,
        estimated_cost_usd: cost,
        success: true,
      });
    } catch {}

    return NextResponse.json({ candidates, cost: { usd: cost } });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
