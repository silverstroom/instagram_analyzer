import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { formatUsd } from '@/lib/utils';

async function getBudget() {
  try {
    const supabase = getSupabaseAdmin();
    const monthlyCap = parseFloat(process.env.NEXT_PUBLIC_MONTHLY_BUDGET_CAP || '20');

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
    return { monthlyCap, spent };
  } catch {
    return { monthlyCap: 20, spent: 0 };
  }
}

export async function BudgetIndicator() {
  const { monthlyCap, spent } = await getBudget();
  const pct = monthlyCap > 0 ? Math.min(100, (spent / monthlyCap) * 100) : 0;
  const warning = pct > 80;

  return (
    <div className="text-right">
      <div className="text-[10px] uppercase tracking-widest text-ink-500 mb-1">
        Budget mensile
      </div>
      <div className="tabular text-sm">
        <span className={warning ? 'text-accent-600 font-medium' : 'text-ink-800'}>
          {formatUsd(spent)}
        </span>
        <span className="text-ink-400"> / {formatUsd(monthlyCap)}</span>
      </div>
      <div className="mt-1 w-32 h-1 bg-ink-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            warning ? 'bg-accent-500' : 'bg-ink-900'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
