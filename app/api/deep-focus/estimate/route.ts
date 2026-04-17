import { NextResponse } from 'next/server';
import { getHikerClient } from '@/lib/hikerapi/client';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { estimateDeepFocusCost, DEEP_FOCUS_MODULES, type DeepFocusModuleId } from '@/lib/hikerapi/endpoints';

export const dynamic = 'force-dynamic';

/**
 * POST /api/deep-focus/estimate
 * Body: { username: string, modules: DeepFocusModuleId[] }
 *
 * Restituisce la stima di costo PRIMA di eseguire la deep analysis.
 * L'utente vede il costo esatto e può decidere se procedere.
 */
export async function POST(req: Request) {
  try {
    const { username, modules } = (await req.json()) as {
      username: string;
      modules: DeepFocusModuleId[];
    };

    if (!username || !Array.isArray(modules) || modules.length === 0) {
      return NextResponse.json(
        { error: 'username e modules (array non vuoto) sono richiesti' },
        { status: 400 }
      );
    }

    const cleanUsername = username.replace('@', '').trim().toLowerCase();

    // Fetch profilo per avere i dati base necessari alla stima
    const hiker = getHikerClient();
    const user = await hiker.userByUsername(cleanUsername);

    const estimate = estimateDeepFocusCost(user, modules);

    // Controlla budget mensile
    const monthlyCap = parseFloat(process.env.NEXT_PUBLIC_MONTHLY_BUDGET_CAP || '20');
    const budget = await getCurrentMonthBudget();
    const willExceedBudget = budget.spent + estimate.total > monthlyCap;

    return NextResponse.json({
      username: cleanUsername,
      user: {
        username: user.username,
        full_name: user.full_name,
        follower_count: user.follower_count,
        profile_pic_url: user.profile_pic_url,
        is_verified: user.is_verified,
      },
      modules: DEEP_FOCUS_MODULES.filter((m) => modules.includes(m.id)).map((m) => ({
        id: m.id,
        label: m.label,
        description: m.description,
      })),
      estimate,
      budget: {
        monthlyCap,
        spent: budget.spent,
        remaining: monthlyCap - budget.spent,
        willExceedBudget,
      },
    });
  } catch (err: any) {
    console.error('[deep-focus/estimate]', err);
    return NextResponse.json(
      { error: err?.message ?? 'Errore stima costo' },
      { status: 500 }
    );
  }
}

async function getCurrentMonthBudget(): Promise<{ spent: number }> {
  try {
    const supabase = getSupabaseAdmin();
    const firstOfMonth = new Date();
    firstOfMonth.setDate(1);
    firstOfMonth.setHours(0, 0, 0, 0);

    const { data } = await supabase
      .from('api_usage')
      .select('estimated_cost_usd')
      .gte('timestamp', firstOfMonth.toISOString())
      .eq('success', true);

    const spent = (data ?? []).reduce(
      (s, row: any) => s + Number(row.estimated_cost_usd || 0),
      0
    );
    return { spent };
  } catch {
    return { spent: 0 };
  }
}
