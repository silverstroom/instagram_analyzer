import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/**
 * POST /api/track
 * Body: { username, clientId?, role? }
 *
 * Aggiunge un profilo alla lista di tracking (verrà aggiornato dal cron giornaliero).
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      username: string;
      clientId?: string | null;
      role?: 'main' | 'competitor' | 'reference';
    };

    const username = body.username.replace('@', '').trim().toLowerCase();
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('tracked_profiles')
      .upsert(
        {
          username,
          client_id: body.clientId ?? null,
          role: body.role ?? 'main',
        },
        { onConflict: 'client_id,username' }
      )
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ profile: data });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'Errore' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/track?username=...&clientId=...
 */
export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const username = url.searchParams.get('username')?.toLowerCase();
    const clientId = url.searchParams.get('clientId');

    if (!username) {
      return NextResponse.json({ error: 'username richiesto' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    let q = supabase.from('tracked_profiles').delete().eq('username', username);
    if (clientId) q = q.eq('client_id', clientId);

    const { error } = await q;
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'Errore' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/track — lista profili trackati
 */
export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('tracked_profiles')
      .select('*')
      .order('added_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ profiles: data ?? [] });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'Errore' },
      { status: 500 }
    );
  }
}
