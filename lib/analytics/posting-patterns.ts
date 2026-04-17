import type { HikerMedia } from '../hikerapi/types';

export interface PostingPattern {
  avgPostsPerWeek: number;
  bestDayOfWeek: { day: string; avgEngagement: number };
  bestHour: { hour: number; avgEngagement: number };
  hourDistribution: number[]; // 24 valori, engagement medio per ora
  dayDistribution: Record<string, { count: number; avgEngagement: number }>;
}

const DAYS = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];

export function analyzePostingPattern(posts: HikerMedia[]): PostingPattern {
  if (posts.length === 0) {
    return {
      avgPostsPerWeek: 0,
      bestDayOfWeek: { day: '—', avgEngagement: 0 },
      bestHour: { hour: 0, avgEngagement: 0 },
      hourDistribution: new Array(24).fill(0),
      dayDistribution: {},
    };
  }

  // Calcolo post per settimana basato sul range temporale
  const timestamps = posts.map((p) => p.taken_at).sort((a, b) => a - b);
  const spanSeconds = timestamps[timestamps.length - 1] - timestamps[0];
  const spanWeeks = Math.max(spanSeconds / (7 * 24 * 3600), 1);
  const avgPostsPerWeek = posts.length / spanWeeks;

  // Raggruppa engagement per giorno e per ora
  const byDay: Record<string, { count: number; totalEng: number }> = {};
  const byHour: { count: number; totalEng: number }[] = Array.from({ length: 24 }, () => ({
    count: 0,
    totalEng: 0,
  }));

  for (const p of posts) {
    const d = new Date(p.taken_at * 1000);
    const day = DAYS[d.getDay()];
    const hour = d.getHours();
    const eng = (p.like_count || 0) + (p.comment_count || 0);

    if (!byDay[day]) byDay[day] = { count: 0, totalEng: 0 };
    byDay[day].count++;
    byDay[day].totalEng += eng;

    byHour[hour].count++;
    byHour[hour].totalEng += eng;
  }

  const dayDistribution = Object.fromEntries(
    Object.entries(byDay).map(([day, { count, totalEng }]) => [
      day,
      { count, avgEngagement: totalEng / count },
    ])
  );

  const bestDayEntry = Object.entries(dayDistribution).reduce(
    (best, [day, stats]) =>
      stats.avgEngagement > best.avgEngagement
        ? { day, avgEngagement: stats.avgEngagement }
        : best,
    { day: '—', avgEngagement: 0 }
  );

  const hourDistribution = byHour.map((h) => (h.count > 0 ? h.totalEng / h.count : 0));
  const bestHourIdx = hourDistribution.reduce(
    (maxIdx, v, i, arr) => (v > arr[maxIdx] ? i : maxIdx),
    0
  );

  return {
    avgPostsPerWeek,
    bestDayOfWeek: bestDayEntry,
    bestHour: { hour: bestHourIdx, avgEngagement: hourDistribution[bestHourIdx] },
    hourDistribution,
    dayDistribution,
  };
}
