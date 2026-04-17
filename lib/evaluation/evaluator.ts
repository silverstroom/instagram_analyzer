import type { HikerUser, HikerMedia } from '../hikerapi/types';
import type { AuthenticityReport } from '../analytics/authenticity';

export type InsightSeverity = 'positive' | 'neutral' | 'warning' | 'critical';

export interface Insight {
  id: string;
  severity: InsightSeverity;
  icon: string; // emoji o simbolo
  title: string;
  detail: string;
  suggestion?: string;
}

export interface Evaluation {
  summary: string;
  scoreOverall: number; // 0-100
  insights: Insight[];
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
  snapshotCount: number;
}

/**
 * Genera valutazioni "AI-style" in modo completamente deterministico
 * basandosi su soglie statistiche e regole chiare.
 * Non chiama API esterne — è gratis e istantaneo.
 */
export function evaluateProfile(input: Input): Evaluation {
  const insights: Insight[] = [];
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const opportunities: string[] = [];

  const {
    user,
    posts,
    engagementRate,
    avgPostsPerWeek,
    hashtagCount,
    authenticity,
    snapshotCount,
  } = input;

  // ---- Insight 1: Engagement rate ----
  if (user.follower_count > 1000) {
    if (engagementRate >= 4) {
      insights.push({
        id: 'engagement_high',
        severity: 'positive',
        icon: '⚡',
        title: 'Engagement eccellente',
        detail: `Il tasso del ${engagementRate.toFixed(
          2
        )}% è decisamente sopra la media di settore (1-3%). L'audience è molto attiva.`,
      });
      strengths.push('Community altamente engaged');
    } else if (engagementRate >= 1.5) {
      insights.push({
        id: 'engagement_ok',
        severity: 'neutral',
        icon: '●',
        title: 'Engagement nella norma',
        detail: `${engagementRate.toFixed(
          2
        )}% rientra nella fascia sana (1-3%). C'è margine per spingere oltre con contenuti più interattivi.`,
      });
      opportunities.push('Aumentare engagement con CTA e domande nelle caption');
    } else if (engagementRate >= 0.5) {
      insights.push({
        id: 'engagement_low',
        severity: 'warning',
        icon: '⚠',
        title: 'Engagement sotto la media',
        detail: `${engagementRate.toFixed(
          2
        )}% è basso per un profilo di questa dimensione. Rivedere tipo di contenuti e orari di pubblicazione.`,
        suggestion:
          'Sperimentare Reels e carousel, che hanno historicamente tassi più alti',
      });
      weaknesses.push('Basso engagement rapportato ai follower');
    } else {
      insights.push({
        id: 'engagement_critical',
        severity: 'critical',
        icon: '✕',
        title: 'Engagement critico',
        detail: `${engagementRate.toFixed(
          2
        )}% è nettamente sotto soglia. Possibile audience non autentica o contenuti non rilevanti per i follower attuali.`,
        suggestion: 'Audit urgente su qualità audience e rilevanza contenuti',
      });
      weaknesses.push('Engagement rate drammaticamente basso');
    }
  }

  // ---- Insight 2: Frequenza pubblicazione ----
  if (avgPostsPerWeek >= 5) {
    insights.push({
      id: 'freq_high',
      severity: 'neutral',
      icon: '◈',
      title: 'Pubblicazione molto frequente',
      detail: `Circa ${avgPostsPerWeek.toFixed(
        1
      )} post a settimana. Assicurati che la qualità non venga compromessa dal volume.`,
    });
  } else if (avgPostsPerWeek >= 2) {
    insights.push({
      id: 'freq_ok',
      severity: 'positive',
      icon: '◆',
      title: 'Frequenza di pubblicazione ottimale',
      detail: `${avgPostsPerWeek.toFixed(
        1
      )} post a settimana è nella fascia raccomandata (2-5). Mantenere regolarità.`,
    });
    strengths.push('Cadenza di pubblicazione regolare');
  } else if (avgPostsPerWeek >= 0.5) {
    insights.push({
      id: 'freq_low',
      severity: 'warning',
      icon: '⏱',
      title: 'Frequenza bassa',
      detail: `Solo ${avgPostsPerWeek.toFixed(
        1
      )} post a settimana. L'algoritmo di Instagram premia profili più attivi.`,
      suggestion: 'Puntare ad almeno 3 post a settimana',
    });
    weaknesses.push('Pubblicazione poco frequente');
  } else {
    insights.push({
      id: 'freq_critical',
      severity: 'critical',
      icon: '⊘',
      title: 'Profilo quasi inattivo',
      detail: `Meno di 1 post alla settimana — l'algoritmo sta sicuramente riducendo la reach organica.`,
      suggestion: 'Riprendere la pubblicazione con cadenza minima di 2 post settimana',
    });
    weaknesses.push('Profilo inattivo o poco aggiornato');
  }

  // ---- Insight 3: Mix di contenuti ----
  const videoCount = posts.filter((p) => p.media_type === 2 || p.product_type === 'clips').length;
  const carouselCount = posts.filter((p) => p.media_type === 8).length;
  const photoCount = posts.length - videoCount - carouselCount;

  if (posts.length >= 5) {
    const videoRatio = videoCount / posts.length;
    const carouselRatio = carouselCount / posts.length;

    if (videoRatio === 0 && carouselRatio === 0) {
      insights.push({
        id: 'content_only_photos',
        severity: 'warning',
        icon: '▢',
        title: 'Solo foto statiche',
        detail: `Tutti gli ultimi ${posts.length} post sono foto singole. Reels e carousel hanno engagement 2-3x superiore.`,
        suggestion: 'Introdurre almeno 1 Reel a settimana',
      });
      opportunities.push('Sperimentare formati video e carousel');
    } else if (videoRatio >= 0.4) {
      insights.push({
        id: 'content_video_first',
        severity: 'positive',
        icon: '▶',
        title: 'Strategia video-first',
        detail: `Il ${(videoRatio * 100).toFixed(
          0
        )}% dei post è video/Reels — allineato alle priorità attuali dell'algoritmo.`,
      });
      strengths.push('Uso intensivo di Reels/video');
    }
  }

  // ---- Insight 4: Authenticity (se presente) ----
  if (authenticity) {
    if (authenticity.overallScore >= 80) {
      insights.push({
        id: 'authenticity_high',
        severity: 'positive',
        icon: '✓',
        title: `Audience autentica (score ${authenticity.overallScore}/100)`,
        detail:
          'I segnali statistici indicano follower reali e interazioni organiche. Base solida per investimenti.',
      });
      strengths.push('Audience verificata come autentica');
    } else if (authenticity.overallScore < 50) {
      insights.push({
        id: 'authenticity_low',
        severity: 'critical',
        icon: '⚠',
        title: `Audience sospetta (score ${authenticity.overallScore}/100)`,
        detail: authenticity.redFlags.join('. ') || 'Segnali anomali rilevati.',
        suggestion:
          'Prima di qualsiasi investimento in ADS o collaborazioni, fare audit approfondito',
      });
      weaknesses.push('Indicatori di possibile audience non autentica');
    }
  }

  // ---- Insight 5: Hashtag strategy ----
  if (hashtagCount === 0 && posts.length > 0) {
    insights.push({
      id: 'no_hashtags',
      severity: 'neutral',
      icon: '#',
      title: 'Zero hashtag nei post',
      detail:
        'Trend coerente con profili che puntano tutto sull\'algoritmo organico — strategia valida per profili grandi, rischiosa per quelli in crescita.',
    });
  } else if (hashtagCount > 0 && hashtagCount < 5) {
    insights.push({
      id: 'few_hashtags',
      severity: 'warning',
      icon: '#',
      title: 'Pochi hashtag diversificati',
      detail: `Solo ${hashtagCount} hashtag unici negli ultimi post. Un mix più ampio può aumentare la discoverability.`,
      suggestion: 'Espandere a 8-15 hashtag tematici per post',
    });
    opportunities.push('Diversificare mix di hashtag');
  }

  // ---- Insight 6: Verifica e business ----
  if (user.is_verified) {
    strengths.push('Profilo verificato Meta');
  }
  if (user.is_business) {
    strengths.push('Account business con insights attivi');
  }

  // ---- Insight 7: Snapshot storico ----
  if (snapshotCount < 3) {
    insights.push({
      id: 'tracking_early',
      severity: 'neutral',
      icon: '◷',
      title: 'Tracking appena iniziato',
      detail: `Solo ${snapshotCount} snapshot storici disponibili. L'analisi di crescita diventerà significativa dopo 2-3 settimane.`,
    });
  }

  // ---- Summary finale ----
  const posCount = insights.filter((i) => i.severity === 'positive').length;
  const negCount = insights.filter(
    (i) => i.severity === 'warning' || i.severity === 'critical'
  ).length;

  let summary: string;
  let scoreOverall: number;

  if (posCount >= 3 && negCount === 0) {
    scoreOverall = 90;
    summary =
      'Profilo in salute: audience attiva, cadenza regolare e segnali positivi predominano. Ottima base per scalare.';
  } else if (posCount >= negCount + 1) {
    scoreOverall = 72;
    summary =
      'Profilo solido con alcune aree di miglioramento. I punti di forza superano le criticità.';
  } else if (negCount >= posCount + 1) {
    scoreOverall = 45;
    summary =
      'Profilo con criticità rilevanti da affrontare prima di investire in ADS o collaborazioni a pagamento.';
  } else {
    scoreOverall = 58;
    summary =
      'Profilo nella media: performance bilanciate, margini di crescita significativi se si agisce sulle opportunità identificate.';
  }

  return {
    summary,
    scoreOverall,
    insights,
    strengths: Array.from(new Set(strengths)),
    weaknesses: Array.from(new Set(weaknesses)),
    opportunities: Array.from(new Set(opportunities)),
  };
}
