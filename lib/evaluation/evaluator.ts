import type { HikerUser, HikerMedia } from '../hikerapi/types';
import type { AuthenticityReport } from '../analytics/authenticity';
import { extractCaptionText } from '../analytics/hashtags';

export type InsightSeverity = 'positive' | 'neutral' | 'warning' | 'critical';

export interface Insight {
  id: string;
  severity: InsightSeverity;
  icon: string;
  title: string;
  detail: string;
  suggestion?: string;
}

export interface Benchmark {
  label: string;
  yourValue: string;
  industryAvg: string;
  delta: number; // percentuale rispetto alla media
  isGood: boolean;
}

export interface ActionableSuggestion {
  priority: 'high' | 'medium' | 'low';
  title: string;
  detail: string;
  estimatedImpact: string;
}

export interface Evaluation {
  summary: string;
  scoreOverall: number;
  storyline: string; // racconto narrativo dei dati
  insights: Insight[];
  benchmarks: Benchmark[];
  actions: ActionableSuggestion[];
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
}

interface Input {
  user: HikerUser;
  posts: HikerMedia[];
  engagementRate: number;
  avgPostsPerWeek: number;
  bestDay: string;
  bestHour: number;
  hashtagCount: number;
  authenticity?: AuthenticityReport;
  snapshotHistory?: Array<{
    snapshot_date: string;
    follower_count: number;
  }>;
}

/**
 * Benchmark di engagement rate per dimensione del profilo.
 * Basati su studi pubblici 2024-2025 (HypeAuditor, Influencer Marketing Hub).
 */
function benchmarkEngagement(followers: number): { avg: number; label: string } {
  if (followers < 1000) return { avg: 8.0, label: 'nano (<1K)' };
  if (followers < 10_000) return { avg: 4.5, label: 'micro (1K-10K)' };
  if (followers < 100_000) return { avg: 2.5, label: 'mid-tier (10K-100K)' };
  if (followers < 1_000_000) return { avg: 1.8, label: 'macro (100K-1M)' };
  return { avg: 1.2, label: 'mega (>1M)' };
}

/**
 * Calcola la media mobile settimanale dei follower dagli snapshot.
 */
function analyzeFollowerTrend(
  snapshots: Input['snapshotHistory']
): { weeklyGrowth: number; trend: 'up' | 'down' | 'flat' | 'unknown' } {
  if (!snapshots || snapshots.length < 2) {
    return { weeklyGrowth: 0, trend: 'unknown' };
  }

  const sorted = [...snapshots].sort((a, b) =>
    a.snapshot_date.localeCompare(b.snapshot_date)
  );
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const daysSpan = Math.max(
    1,
    (new Date(last.snapshot_date).getTime() - new Date(first.snapshot_date).getTime()) /
      (1000 * 60 * 60 * 24)
  );
  const totalDelta = last.follower_count - first.follower_count;
  const weeklyGrowth = (totalDelta / daysSpan) * 7;

  let trend: 'up' | 'down' | 'flat' = 'flat';
  if (weeklyGrowth > first.follower_count * 0.005) trend = 'up';
  else if (weeklyGrowth < -first.follower_count * 0.005) trend = 'down';

  return { weeklyGrowth: Math.round(weeklyGrowth), trend };
}

/**
 * Analizza pattern ricorrenti nelle caption per dare insight di contenuto.
 */
function analyzeCaptionPatterns(
  posts: HikerMedia[]
): { hasQuestions: number; hasEmojis: number; avgLength: number; hasCTA: number } {
  if (posts.length === 0) {
    return { hasQuestions: 0, hasEmojis: 0, avgLength: 0, hasCTA: 0 };
  }

  let questions = 0;
  let emojis = 0;
  let totalLength = 0;
  let ctas = 0;

  const ctaWords = [
    'link in bio',
    'clicca',
    'scopri di più',
    'leggi',
    'commenta',
    'tagga',
    'salva',
    'condividi',
    'scrivi',
    'dimmi',
  ];
  const emojiRegex = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/u;

  for (const p of posts) {
    const c = extractCaptionText(p).toLowerCase();
    if (c.includes('?')) questions++;
    if (emojiRegex.test(c)) emojis++;
    totalLength += c.length;
    if (ctaWords.some((w) => c.includes(w))) ctas++;
  }

  return {
    hasQuestions: questions,
    hasEmojis: emojis,
    avgLength: Math.round(totalLength / posts.length),
    hasCTA: ctas,
  };
}

export function evaluateProfile(input: Input): Evaluation {
  const {
    user,
    posts,
    engagementRate,
    avgPostsPerWeek,
    hashtagCount,
    authenticity,
    snapshotHistory,
  } = input;

  const insights: Insight[] = [];
  const benchmarks: Benchmark[] = [];
  const actions: ActionableSuggestion[] = [];
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const opportunities: string[] = [];

  // ----- Benchmark engagement vs settore -----
  const engBench = benchmarkEngagement(user.follower_count);
  const engDelta = engagementRate - engBench.avg;
  const engDeltaPct = engBench.avg > 0 ? (engDelta / engBench.avg) * 100 : 0;

  benchmarks.push({
    label: `Engagement rate per profili ${engBench.label}`,
    yourValue: `${engagementRate.toFixed(2)}%`,
    industryAvg: `${engBench.avg.toFixed(2)}%`,
    delta: engDeltaPct,
    isGood: engDelta >= 0,
  });

  // ----- Trend follower -----
  const followerTrend = analyzeFollowerTrend(snapshotHistory);
  if (followerTrend.trend !== 'unknown') {
    benchmarks.push({
      label: 'Crescita follower stimata su 7 giorni',
      yourValue:
        followerTrend.weeklyGrowth > 0
          ? `+${followerTrend.weeklyGrowth}`
          : followerTrend.weeklyGrowth.toString(),
      industryAvg:
        user.follower_count < 10_000
          ? '+50 / settimana'
          : user.follower_count < 100_000
          ? '+200 / settimana'
          : '+1500 / settimana',
      delta:
        followerTrend.trend === 'up' ? 15 : followerTrend.trend === 'down' ? -20 : 0,
      isGood: followerTrend.trend === 'up' || followerTrend.trend === 'flat',
    });
  }

  // ----- Benchmark frequenza post -----
  benchmarks.push({
    label: 'Frequenza di pubblicazione',
    yourValue: `${avgPostsPerWeek.toFixed(1)} post/settimana`,
    industryAvg: '3-5 post/settimana',
    delta: ((avgPostsPerWeek - 4) / 4) * 100,
    isGood: avgPostsPerWeek >= 2 && avgPostsPerWeek <= 7,
  });

  // ----- Analisi mix contenuti -----
  const videoCount = posts.filter(
    (p) => p.media_type === 2 || p.product_type === 'clips'
  ).length;
  const carouselCount = posts.filter((p) => p.media_type === 8).length;
  const videoRatio = posts.length > 0 ? videoCount / posts.length : 0;
  const carouselRatio = posts.length > 0 ? carouselCount / posts.length : 0;

  // ----- Engagement per tipo post -----
  let videoEngAvg = 0;
  let photoEngAvg = 0;
  let videoCountEng = 0;
  let photoCountEng = 0;
  for (const p of posts) {
    const eng = (p.like_count || 0) + (p.comment_count || 0);
    if (p.media_type === 2 || p.product_type === 'clips') {
      videoEngAvg += eng;
      videoCountEng++;
    } else if (p.media_type !== 8) {
      photoEngAvg += eng;
      photoCountEng++;
    }
  }
  videoEngAvg = videoCountEng > 0 ? videoEngAvg / videoCountEng : 0;
  photoEngAvg = photoCountEng > 0 ? photoEngAvg / photoCountEng : 0;

  // ----- Pattern caption -----
  const captionPatterns = analyzeCaptionPatterns(posts);

  // ======================
  // INSIGHTS
  // ======================

  // Insight engagement
  if (user.follower_count >= 500) {
    if (engDelta >= 1) {
      insights.push({
        id: 'eng_above',
        severity: 'positive',
        icon: '◆',
        title: `Engagement superiore alla media di settore`,
        detail: `Il tuo ${engagementRate.toFixed(2)}% supera del ${Math.abs(engDeltaPct).toFixed(
          0
        )}% la media dei profili ${engBench.label} (${engBench.avg}%). Questo indica audience genuinamente interessata.`,
      });
      strengths.push(`Engagement +${Math.abs(engDeltaPct).toFixed(0)}% vs media settore`);
    } else if (engDelta < -0.5) {
      insights.push({
        id: 'eng_below',
        severity: 'warning',
        icon: '⚠',
        title: `Engagement sotto la media del settore`,
        detail: `Il ${engagementRate.toFixed(2)}% è ${Math.abs(engDeltaPct).toFixed(
          0
        )}% sotto la media dei profili ${engBench.label} (${engBench.avg}%). La qualità dei contenuti o il match con l'audience va rivisto.`,
      });
      weaknesses.push(`Engagement ${Math.abs(engDeltaPct).toFixed(0)}% sotto media`);
    }
  }

  // Insight video vs foto
  if (videoCountEng >= 2 && photoCountEng >= 2) {
    const ratio = videoEngAvg / Math.max(photoEngAvg, 1);
    if (ratio >= 1.5) {
      insights.push({
        id: 'video_wins',
        severity: 'positive',
        icon: '▶',
        title: 'I video performano molto meglio delle foto',
        detail: `I tuoi Reels/video hanno in media ${ratio.toFixed(1)}x l'engagement delle foto statiche (${Math.round(
          videoEngAvg
        ).toLocaleString('it-IT')} vs ${Math.round(photoEngAvg).toLocaleString('it-IT')}).`,
        suggestion: `Spostare il mix verso il 60-70% di Reels potrebbe aumentare l'engagement complessivo del ${Math.round((ratio - 1) * 40)}%.`,
      });
      actions.push({
        priority: 'high',
        title: 'Aumentare la percentuale di Reels al 60-70%',
        detail: `I tuoi video superano le foto del ${Math.round((ratio - 1) * 100)}%. Attualmente sei al ${(videoRatio * 100).toFixed(0)}%.`,
        estimatedImpact: `+${Math.round((ratio - 1) * 40)}% di engagement medio stimato`,
      });
    } else if (ratio < 0.7) {
      insights.push({
        id: 'photo_wins',
        severity: 'positive',
        icon: '◈',
        title: 'Le foto statiche performano meglio dei video',
        detail: `Le tue foto generano ${(1 / ratio).toFixed(1)}x l'engagement dei Reels. Strategia controcorrente ma efficace per la tua audience.`,
      });
    }
  }

  // Insight frequenza
  if (avgPostsPerWeek < 2) {
    actions.push({
      priority: 'high',
      title: 'Aumentare la frequenza di pubblicazione',
      detail: `Attualmente ${avgPostsPerWeek.toFixed(1)} post a settimana. L'algoritmo premia profili attivi: sotto i 2 post/settimana la reach organica cala drasticamente.`,
      estimatedImpact: 'Reach organica fino a +40% con 3 post/settimana',
    });
    weaknesses.push('Frequenza di pubblicazione insufficiente');
  } else if (avgPostsPerWeek > 10) {
    insights.push({
      id: 'freq_too_high',
      severity: 'warning',
      icon: '⚠',
      title: 'Frequenza molto alta',
      detail: `${avgPostsPerWeek.toFixed(1)} post a settimana può saturare il feed. Verifica che la qualità non ne risenta.`,
    });
  }

  // Insight hashtag
  if (hashtagCount === 0 && posts.length > 0) {
    if (user.follower_count < 50_000) {
      actions.push({
        priority: 'medium',
        title: 'Aggiungere hashtag nelle caption',
        detail: `Al momento i post non contengono hashtag. Per profili sotto i 50K follower, gli hashtag sono ancora un canale di discoverability significativo.`,
        estimatedImpact: '+15-25% reach su post tematici',
      });
      opportunities.push('Reintrodurre hashtag strategici');
    }
  } else if (hashtagCount >= 5 && hashtagCount <= 15) {
    insights.push({
      id: 'hashtag_ok',
      severity: 'positive',
      icon: '#',
      title: `Mix hashtag nella fascia ottimale (${hashtagCount} tag)`,
      detail: `Usi un numero sano di hashtag. Ricorda che 8-12 è il sweet spot secondo Instagram stesso.`,
    });
  }

  // Insight caption pattern
  if (posts.length >= 5) {
    const questionRatio = captionPatterns.hasQuestions / posts.length;
    const ctaRatio = captionPatterns.hasCTA / posts.length;

    if (questionRatio >= 0.3) {
      insights.push({
        id: 'engaging_captions',
        severity: 'positive',
        icon: '?',
        title: 'Caption conversazionali',
        detail: `Il ${(questionRatio * 100).toFixed(0)}% dei post include domande dirette ai follower — strategia che aumenta commenti.`,
      });
      strengths.push('Caption orientate al dialogo');
    } else if (ctaRatio < 0.2 && posts.length >= 5) {
      actions.push({
        priority: 'low',
        title: 'Inserire CTA più frequenti nelle caption',
        detail: `Solo il ${(ctaRatio * 100).toFixed(0)}% dei post include una call-to-action esplicita (domande, inviti, link).`,
        estimatedImpact: '+20% commenti stimati',
      });
    }
  }

  // Insight authenticity
  if (authenticity) {
    if (authenticity.overallScore >= 80) {
      strengths.push('Audience autentica (score > 80)');
    } else if (authenticity.overallScore < 50) {
      insights.push({
        id: 'auth_low',
        severity: 'critical',
        icon: '✕',
        title: `Segnali di audience non autentica (score ${authenticity.overallScore}/100)`,
        detail: authenticity.redFlags.join('. ') || 'Pattern anomali rilevati.',
        suggestion:
          'Approfondire con il modulo Audience Quality nel Deep Focus per una valutazione basata su campione reale',
      });
      weaknesses.push('Qualità audience da verificare');
    }
  }

  // Trend follower
  if (followerTrend.trend === 'up') {
    strengths.push(`Crescita positiva (${followerTrend.weeklyGrowth > 0 ? '+' : ''}${followerTrend.weeklyGrowth}/settimana)`);
  } else if (followerTrend.trend === 'down') {
    insights.push({
      id: 'declining',
      severity: 'warning',
      icon: '↓',
      title: 'Trend follower in calo',
      detail: `Perdi circa ${Math.abs(followerTrend.weeklyGrowth)} follower a settimana nella finestra tracciata.`,
      suggestion: 'Rivedere frequenza, formato contenuti e coerenza con l\'audience attuale',
    });
    weaknesses.push('Calo follower settimanale');
  }

  // ======================
  // STORYLINE NARRATIVA
  // ======================
  const profileSize =
    user.follower_count < 1000
      ? 'nano-influencer'
      : user.follower_count < 10_000
      ? 'micro-influencer'
      : user.follower_count < 100_000
      ? 'mid-tier'
      : user.follower_count < 1_000_000
      ? 'macro-influencer'
      : 'mega-influencer';

  const engComparison =
    engDelta >= 1 ? 'chiaramente sopra la media' :
    engDelta >= 0 ? 'in linea con la media' :
    engDelta >= -0.5 ? 'leggermente sotto la media' : 'nettamente sotto la media';

  const storyline = `Profilo ${profileSize} (${user.follower_count.toLocaleString('it-IT')} follower) con engagement rate ${engComparison} del settore. ${
    videoRatio >= 0.4
      ? `Strategia orientata ai video (${(videoRatio * 100).toFixed(0)}% del feed)`
      : videoRatio >= 0.15
      ? `Mix bilanciato tra foto e video`
      : `Approccio prevalentemente foto-centrico`
  }. ${
    followerTrend.trend === 'up'
      ? `La crescita dei follower è positiva nelle ultime settimane tracciate.`
      : followerTrend.trend === 'down'
      ? `La base follower sta calando e richiede attenzione.`
      : followerTrend.trend === 'flat'
      ? `La crescita è piatta, il profilo è in una fase di plateau.`
      : `Il tracking storico è appena iniziato: i trend saranno più significativi tra qualche settimana.`
  }`;

  // ======================
  // SUMMARY + SCORE
  // ======================
  const positiveCount = insights.filter((i) => i.severity === 'positive').length;
  const warningCount = insights.filter((i) => i.severity === 'warning' || i.severity === 'critical').length;

  let summary: string;
  let scoreOverall: number;

  if (positiveCount >= 3 && warningCount <= 1) {
    scoreOverall = 85;
    summary = 'Profilo in salute con pochi punti di attenzione. Ottima base per scalare con ADS o collaborazioni.';
  } else if (positiveCount > warningCount) {
    scoreOverall = 70;
    summary = 'Profilo solido con margini di miglioramento identificati. Agendo sulle azioni prioritarie si può portarlo al livello successivo.';
  } else if (warningCount > positiveCount) {
    scoreOverall = 45;
    summary = 'Profilo con criticità significative. Prima di investimenti importanti conviene sistemare i punti identificati.';
  } else {
    scoreOverall = 60;
    summary = 'Profilo nella media con alcune aree di eccellenza bilanciate da zone di miglioramento.';
  }

  return {
    summary,
    scoreOverall,
    storyline,
    insights,
    benchmarks,
    actions: actions.sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.priority] - order[b.priority];
    }),
    strengths: Array.from(new Set(strengths)),
    weaknesses: Array.from(new Set(weaknesses)),
    opportunities: Array.from(new Set(opportunities)),
  };
}
