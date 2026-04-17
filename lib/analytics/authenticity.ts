import type { HikerUser, HikerMedia } from '../hikerapi/types';

/**
 * Authenticity Score: combina segnali statistici per stimare
 * la probabilità che un profilo abbia follower reali o gonfiati.
 *
 * È un'indicazione, non una certezza. Anche profili legittimi possono
 * avere un low score (es. campagne pubblicitarie portano spike reali).
 *
 * Score: 0-100 (più alto = più autentico)
 */

export interface AuthenticitySignal {
  id: string;
  label: string;
  score: number; // 0-100
  weight: number; // quanto pesa nella media
  detail: string;
  severity: 'good' | 'warning' | 'danger';
}

export interface AuthenticityReport {
  overallScore: number;
  rating: 'excellent' | 'good' | 'suspicious' | 'poor';
  signals: AuthenticitySignal[];
  redFlags: string[];
  greenFlags: string[];
}

interface SnapshotLite {
  snapshot_date: string;
  follower_count: number;
}

export function calculateAuthenticityScore(
  user: HikerUser,
  posts: HikerMedia[],
  snapshotHistory?: SnapshotLite[],
  audienceQuality?: {
    verifiedPct: number;
    withProfilePicPct: number;
    privatePct: number;
  }
): AuthenticityReport {
  const signals: AuthenticitySignal[] = [];
  const redFlags: string[] = [];
  const greenFlags: string[] = [];

  // ---- Signal 1: Engagement rate vs follower base ----
  // Profili con tanti follower ma poco engagement sono sospetti
  const avgEng =
    posts.length > 0
      ? posts.reduce(
          (s, p) => s + (p.like_count || 0) + (p.comment_count || 0),
          0
        ) / posts.length
      : 0;
  const engagementRatio =
    user.follower_count > 0 ? (avgEng / user.follower_count) * 100 : 0;

  let engScore: number;
  let engSeverity: AuthenticitySignal['severity'];
  let engDetail: string;

  if (user.follower_count < 1000) {
    // profili piccoli hanno fisiologicamente engagement più alto
    engScore = 85;
    engSeverity = 'good';
    engDetail = 'Profilo piccolo, metrica non significativa';
  } else if (engagementRatio >= 3) {
    engScore = 100;
    engSeverity = 'good';
    engDetail = `Engagement del ${engagementRatio.toFixed(2)}% è ottimo`;
    greenFlags.push('Engagement rate molto alto per la base follower');
  } else if (engagementRatio >= 1.5) {
    engScore = 80;
    engSeverity = 'good';
    engDetail = `Engagement del ${engagementRatio.toFixed(2)}% è nella norma`;
  } else if (engagementRatio >= 0.5) {
    engScore = 50;
    engSeverity = 'warning';
    engDetail = `Engagement del ${engagementRatio.toFixed(2)}% è basso`;
  } else {
    engScore = 15;
    engSeverity = 'danger';
    engDetail = `Engagement del ${engagementRatio.toFixed(
      2
    )}% è molto sotto la norma — possibili follower non attivi`;
    redFlags.push('Engagement rate sospettamente basso rispetto ai follower');
  }

  signals.push({
    id: 'engagement_vs_followers',
    label: 'Engagement rapportato ai follower',
    score: engScore,
    weight: user.follower_count >= 1000 ? 35 : 10,
    detail: engDetail,
    severity: engSeverity,
  });

  // ---- Signal 2: Following/Follower ratio ----
  // Account che seguono troppe persone rispetto ai follower hanno comportamento "follow4follow"
  const followRatio =
    user.follower_count > 0 ? user.following_count / user.follower_count : 0;

  let ratioScore: number;
  let ratioSeverity: AuthenticitySignal['severity'];
  let ratioDetail: string;

  if (followRatio < 0.1 || user.follower_count > 10000) {
    ratioScore = 100;
    ratioSeverity = 'good';
    ratioDetail = 'Ratio follower/following sano';
  } else if (followRatio < 0.5) {
    ratioScore = 85;
    ratioSeverity = 'good';
    ratioDetail = 'Ratio nella norma';
  } else if (followRatio < 1) {
    ratioScore = 55;
    ratioSeverity = 'warning';
    ratioDetail = `Segue ${user.following_count.toLocaleString()} profili — possibile strategia follow4follow`;
  } else {
    ratioScore = 20;
    ratioSeverity = 'danger';
    ratioDetail = `Segue più profili di quanti ne ha (ratio ${followRatio.toFixed(
      1
    )}x) — tipico di bot o profili gonfiati`;
    redFlags.push('Pattern follow4follow sospetto');
  }

  signals.push({
    id: 'follow_ratio',
    label: 'Ratio seguiti / follower',
    score: ratioScore,
    weight: 20,
    detail: ratioDetail,
    severity: ratioSeverity,
  });

  // ---- Signal 3: Like/commenti ratio ----
  // Troppi like e pochi commenti è un pattern da like-bot
  const totalLikes = posts.reduce((s, p) => s + (p.like_count || 0), 0);
  const totalComments = posts.reduce((s, p) => s + (p.comment_count || 0), 0);
  const likesPerComment = totalComments > 0 ? totalLikes / totalComments : 0;

  let lcScore: number;
  let lcSeverity: AuthenticitySignal['severity'];
  let lcDetail: string;

  if (likesPerComment === 0 || posts.length === 0) {
    lcScore = 60;
    lcSeverity = 'warning';
    lcDetail = 'Dati insufficienti per valutare';
  } else if (likesPerComment < 50) {
    lcScore = 100;
    lcSeverity = 'good';
    lcDetail = `${likesPerComment.toFixed(0)} like per commento — audience attiva`;
    greenFlags.push('Rapporto like/commenti indica audience engaged');
  } else if (likesPerComment < 150) {
    lcScore = 75;
    lcSeverity = 'good';
    lcDetail = `${likesPerComment.toFixed(0)} like per commento — nella norma`;
  } else if (likesPerComment < 400) {
    lcScore = 45;
    lcSeverity = 'warning';
    lcDetail = `${likesPerComment.toFixed(
      0
    )} like per commento — audience passiva o like artificiali`;
  } else {
    lcScore = 15;
    lcSeverity = 'danger';
    lcDetail = `${likesPerComment.toFixed(
      0
    )} like per commento — pattern tipico di like-bot`;
    redFlags.push('Rapporto like/commenti sbilanciato, possibili like comprati');
  }

  signals.push({
    id: 'likes_comments_ratio',
    label: 'Rapporto like / commenti',
    score: lcScore,
    weight: 20,
    detail: lcDetail,
    severity: lcSeverity,
  });

  // ---- Signal 4: Crescita anomala (solo se abbiamo snapshot storici) ----
  if (snapshotHistory && snapshotHistory.length >= 3) {
    const sorted = [...snapshotHistory].sort((a, b) =>
      a.snapshot_date.localeCompare(b.snapshot_date)
    );
    const dailyDeltas = sorted.slice(1).map((s, i) => ({
      date: s.snapshot_date,
      delta: s.follower_count - sorted[i].follower_count,
      basePct:
        sorted[i].follower_count > 0
          ? ((s.follower_count - sorted[i].follower_count) /
              sorted[i].follower_count) *
            100
          : 0,
    }));

    const maxDailyGrowthPct = Math.max(...dailyDeltas.map((d) => d.basePct));

    let spikeScore: number;
    let spikeSeverity: AuthenticitySignal['severity'];
    let spikeDetail: string;

    if (maxDailyGrowthPct < 2) {
      spikeScore = 100;
      spikeSeverity = 'good';
      spikeDetail = 'Crescita graduale e organica';
    } else if (maxDailyGrowthPct < 5) {
      spikeScore = 80;
      spikeSeverity = 'good';
      spikeDetail = `Picco massimo di crescita +${maxDailyGrowthPct.toFixed(1)}% in un giorno`;
    } else if (maxDailyGrowthPct < 15) {
      spikeScore = 50;
      spikeSeverity = 'warning';
      spikeDetail = `Rilevato spike +${maxDailyGrowthPct.toFixed(
        1
      )}% in un giorno — possibile campagna o acquisizione`;
    } else {
      spikeScore = 20;
      spikeSeverity = 'danger';
      spikeDetail = `Spike enorme di +${maxDailyGrowthPct.toFixed(
        1
      )}% in un giorno — probabile acquisto follower`;
      redFlags.push(`Crescita innaturale il ${dailyDeltas.find((d) => d.basePct === maxDailyGrowthPct)?.date}`);
    }

    signals.push({
      id: 'growth_pattern',
      label: 'Pattern di crescita nel tempo',
      score: spikeScore,
      weight: 15,
      detail: spikeDetail,
      severity: spikeSeverity,
    });
  } else {
    signals.push({
      id: 'growth_pattern',
      label: 'Pattern di crescita nel tempo',
      score: 60,
      weight: 5,
      detail: 'Servono almeno 3 giorni di tracking per questa metrica',
      severity: 'warning',
    });
  }

  // ---- Signal 5: Audience quality (solo se attivato Deep Focus) ----
  if (audienceQuality) {
    const aq = audienceQuality;
    const withPicWeight = aq.withProfilePicPct;
    let aqScore: number;
    let aqSeverity: AuthenticitySignal['severity'];
    let aqDetail: string;

    if (withPicWeight > 85) {
      aqScore = 100;
      aqSeverity = 'good';
      aqDetail = `${withPicWeight.toFixed(0)}% dei follower ha una foto profilo — audience reale`;
      greenFlags.push('Alta percentuale di follower con foto profilo');
    } else if (withPicWeight > 70) {
      aqScore = 75;
      aqSeverity = 'good';
      aqDetail = `${withPicWeight.toFixed(0)}% dei follower ha foto profilo`;
    } else if (withPicWeight > 50) {
      aqScore = 45;
      aqSeverity = 'warning';
      aqDetail = `Solo ${withPicWeight.toFixed(
        0
      )}% dei follower ha foto — possibili bot`;
    } else {
      aqScore = 15;
      aqSeverity = 'danger';
      aqDetail = `Solo ${withPicWeight.toFixed(
        0
      )}% dei follower ha foto — alta probabilità di bot`;
      redFlags.push('Maggioranza dei follower senza foto profilo');
    }

    signals.push({
      id: 'audience_quality',
      label: 'Qualità audience (campione reale)',
      score: aqScore,
      weight: 30,
      detail: aqDetail,
      severity: aqSeverity,
    });
  }

  // ---- Calcolo score finale ponderato ----
  const totalWeight = signals.reduce((s, sig) => s + sig.weight, 0);
  const weightedSum = signals.reduce((s, sig) => s + sig.score * sig.weight, 0);
  const overallScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 50;

  const rating: AuthenticityReport['rating'] =
    overallScore >= 80
      ? 'excellent'
      : overallScore >= 60
      ? 'good'
      : overallScore >= 40
      ? 'suspicious'
      : 'poor';

  return {
    overallScore,
    rating,
    signals,
    redFlags,
    greenFlags,
  };
}
