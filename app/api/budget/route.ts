import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/budget
 *
 * Restituisce lo stato del budget mensile corrente.
 */
export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const monthlyCap = parseFloat(process.env.NEXT_PUBLIC_MONTHLY_BUDGET_CAP || '20');

    const firstOfMonth = new Date();
    firstOfMonth.setDate(1);
    firstOfMonth.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('api_usage')
      .select('estimated_cost_usd, analysis_type, request_count, timestamp')
      .gte('timestamp', firstOfMonth.toISOString())
      .eq('success', true);

    if (error) throw error;

    const rows = data ?? [];
    const spent = rows.reduce(
      (s, row: any) => s + Number(row.estimated_cost_usd || 0),
      0
    );
    const totalRequests = rows.reduce(
      (s, row: any) => s + Number(row.request_count || 0),
      0
    );
    const byType = rows.reduce(
      (acc: Record<string, number>, row: any) => {
        acc[row.analysis_type] = (acc[row.analysis_type] || 0) + 1;
        return acc;
      },
      {}
    );

    return NextResponse.json({
      monthlyCap,
      spent,
      remaining: Math.max(0, monthlyCap - spent),
      percentageUsed: monthlyCap > 0 ? (spent / monthlyCap) * 100 : 0,
      totalRequests,
      analysisCount: rows.length,
      byType,
      monthStart: firstOfMonth.toISOString(),
    });
  } catch (err: any) {
    console.error('[budget]', err);
    return NextResponse.json(
      { error: err?.message ?? 'Errore lettura budget' },
      { status: 500 }
    );
  }
}
