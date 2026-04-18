import type { NormalizedProfile, NormalizedPost } from '../scrapecreators/normalizer';

export interface ChecklistItem {
  id: string;
  label: string;
  status: 'pass' | 'warn' | 'fail';
  detail: string;
  howToFix?: string;
  weight: number; // peso per lo score
}

export interface OptimizationChecklist {
  items: ChecklistItem[];
  score: number; // 0-100
  passed: number;
  failed: number;
  warnings: number;
}

/**
 * Valuta l'idoneità/ottimizzazione del profilo secondo una checklist
 * ispirata alle linee guida ufficiali Meta + best practice.
 *
 * Score pesato: i punti critici (bio, foto, verifica) pesano di più.
 */
export function evaluateProfileChecklist(
  profile: NormalizedProfile,
  posts: NormalizedPost[]
): OptimizationChecklist {
  const items: ChecklistItem[] = [];

  // 1. Foto profilo presente
  items.push({
    id: 'profile_pic',
    label: 'Foto profilo presente',
    status: profile.profilePicUrl ? 'pass' : 'fail',
    detail: profile.profilePicUrl
      ? 'Foto profilo impostata e visibile.'
      : 'Manca la foto profilo.',
    howToFix: profile.profilePicUrl
      ? undefined
      : 'Carica una foto riconoscibile (logo o viso per personal brand). Idealmente quadrata, min 320×320px.',
    weight: 10,
  });

  // 2. Nome completo non vuoto
  items.push({
    id: 'full_name',
    label: 'Nome completo compilato',
    status: profile.fullName && profile.fullName.length >= 2 ? 'pass' : 'fail',
    detail: profile.fullName
      ? `Nome: "${profile.fullName}"`
      : 'Campo "Nome" vuoto — penalizza la ricercabilità.',
    howToFix: profile.fullName
      ? undefined
      : 'Imposta il nome completo nel profilo. Su Instagram è un campo ricercabile distinto dal username.',
    weight: 8,
  });

  // 3. Biografia presente e sufficientemente lunga
  const bioLen = (profile.biography || '').length;
  let bioStatus: ChecklistItem['status'] = 'fail';
  let bioDetail = '';
  let bioFix: string | undefined;

  if (bioLen === 0) {
    bioStatus = 'fail';
    bioDetail = 'Bio vuota.';
    bioFix = 'Scrivi una bio di 100-150 caratteri che spieghi chi sei e cosa fai, con 1-2 emoji e una CTA (es. "Scopri ↓").';
  } else if (bioLen < 50) {
    bioStatus = 'warn';
    bioDetail = `Bio molto corta (${bioLen} caratteri).`;
    bioFix = 'Espandi a 100-150 caratteri per comunicare valore e personalità.';
  } else if (bioLen > 150) {
    bioStatus = 'warn';
    bioDetail = `Bio lunga (${bioLen} caratteri) — rischio troncamento su mobile.`;
    bioFix = 'Accorcia a 150 caratteri massimo.';
  } else {
    bioStatus = 'pass';
    bioDetail = `Bio di ${bioLen} caratteri — lunghezza ottimale.`;
  }

  items.push({
    id: 'bio_length',
    label: 'Biografia ottimizzata',
    status: bioStatus,
    detail: bioDetail,
    howToFix: bioFix,
    weight: 8,
  });

  // 4. Link in bio
  const hasLink = !!(profile.externalUrl || (profile.bioLinks || []).length > 0);
  items.push({
    id: 'external_link',
    label: 'Link esterno in bio',
    status: hasLink ? 'pass' : 'fail',
    detail: hasLink
      ? `Link configurato: ${profile.externalUrl || profile.bioLinks[0]?.url}`
      : 'Nessun link in bio — perdi il canale di conversione principale.',
    howToFix: hasLink
      ? undefined
      : 'Aggiungi un link alla homepage, una landing dedicata o un Linktree.',
    weight: 9,
  });

  // 5. Account business/professional
  if (profile.platform === 'instagram' || profile.platform === 'facebook') {
    items.push({
      id: 'business_account',
      label: 'Account Business/Creator',
      status: profile.isBusiness ? 'pass' : 'warn',
      detail: profile.isBusiness
        ? 'Account Business/Creator attivo — accesso a Insights e ADS.'
        : 'Account non Business — stai perdendo insights e categoria.',
      howToFix: profile.isBusiness
        ? undefined
        : 'Vai in Impostazioni → Account → Passa ad account Professional. Gratuito, non cambia nulla per i follower.',
      weight: 7,
    });
  }

  // 6. Categoria impostata
  items.push({
    id: 'category',
    label: 'Categoria professionale',
    status: profile.category ? 'pass' : 'warn',
    detail: profile.category
      ? `Categoria: "${profile.category}"`
      : 'Categoria non impostata — meno chiarezza per i nuovi visitatori.',
    howToFix: profile.category
      ? undefined
      : 'Imposta una categoria coerente (es. "Media/Notizie", "Arte", "Ristorante") dalle impostazioni account.',
    weight: 5,
  });

  // 7. Verifica
  items.push({
    id: 'verification',
    label: 'Account verificato',
    status: profile.isVerified ? 'pass' : 'warn',
    detail: profile.isVerified
      ? 'Verificato da Meta (badge blu).'
      : 'Non verificato — nessun badge blu.',
    howToFix: profile.isVerified
      ? undefined
      : 'Richiedi verifica via Meta Verified (abbonamento) se sei brand/persona pubblica. Altrimenti non è essenziale.',
    weight: 4,
  });

  // 8. Highlights (solo Instagram)
  if (profile.platform === 'instagram') {
    items.push({
      id: 'highlights',
      label: 'Storie in evidenza',
      status: profile.hasHighlights ? 'pass' : 'warn',
      detail: profile.hasHighlights
        ? 'Hai Highlights pubblicati.'
        : 'Nessun Highlight — perdi uno spazio editoriale permanente sul profilo.',
      howToFix: profile.hasHighlights
        ? undefined
        : 'Crea 3-5 Highlights tematici (Chi siamo, Prodotti, Testimonianze, Novità, Contatti) con cover coordinate.',
      weight: 5,
    });
  }

  // 9. Rapporto follower/seguiti sano
  if (profile.followerCount >= 1000) {
    const ratio = profile.followingCount > 0 ? profile.followerCount / profile.followingCount : Infinity;
    let status: ChecklistItem['status'] = 'pass';
    let detail = '';
    if (ratio < 0.5) {
      status = 'warn';
      detail = `Segui più persone di quante ti seguano (${profile.followingCount} vs ${profile.followerCount}).`;
    } else if (ratio >= 10) {
      status = 'pass';
      detail = `Rapporto ottimo: ${ratio.toFixed(1)}× più follower che seguiti.`;
    } else {
      status = 'pass';
      detail = `Rapporto equilibrato (${ratio.toFixed(1)}× follower/seguiti).`;
    }
    items.push({
      id: 'follow_ratio',
      label: 'Rapporto follower/seguiti',
      status,
      detail,
      howToFix: status === 'warn'
        ? 'Considera di sfoltire gli account seguiti — un rapporto sbilanciato segnala poca autorevolezza.'
        : undefined,
      weight: 4,
    });
  }

  // 10. Frequenza pubblicazione
  if (posts.length >= 2) {
    const timestamps = posts.map((p) => p.takenAt).filter((t) => t > 0).sort((a, b) => a - b);
    if (timestamps.length >= 2) {
      const spanDays = Math.max(
        1,
        (timestamps[timestamps.length - 1] - timestamps[0]) / (24 * 3600)
      );
      const postsPerWeek = (posts.length / spanDays) * 7;

      let status: ChecklistItem['status'] = 'pass';
      let detail = '';
      let fix: string | undefined;
      if (postsPerWeek < 1) {
        status = 'fail';
        detail = `Solo ${postsPerWeek.toFixed(1)} post a settimana.`;
        fix = 'Punta ad almeno 3 post a settimana per mantenere reach organica.';
      } else if (postsPerWeek < 2) {
        status = 'warn';
        detail = `${postsPerWeek.toFixed(1)} post/settimana — sotto il consigliato.`;
        fix = 'Porta la frequenza a 3-5 post a settimana.';
      } else if (postsPerWeek > 14) {
        status = 'warn';
        detail = `${postsPerWeek.toFixed(1)} post/settimana — rischio saturazione feed.`;
        fix = 'Riduci a 5-7 post alta qualità invece che bassa qualità ad alto volume.';
      } else {
        status = 'pass';
        detail = `${postsPerWeek.toFixed(1)} post/settimana — frequenza sana.`;
      }

      items.push({
        id: 'posting_frequency',
        label: 'Frequenza di pubblicazione',
        status,
        detail,
        howToFix: fix,
        weight: 8,
      });
    }
  }

  // 11. Mix contenuti
  if (posts.length >= 5) {
    const videos = posts.filter((p) => p.type === 'video' || p.type === 'reel').length;
    const carousels = posts.filter((p) => p.type === 'carousel').length;
    const videoRatio = videos / posts.length;

    let status: ChecklistItem['status'] = 'pass';
    let detail = '';
    let fix: string | undefined;

    if (videoRatio === 0 && carousels === 0) {
      status = 'fail';
      detail = 'Solo foto singole, niente video o carousel.';
      fix = 'Introduci almeno 1 Reel e 1 carousel a settimana — sono i formati con engagement più alto.';
    } else if (videoRatio < 0.2) {
      status = 'warn';
      detail = `Solo ${(videoRatio * 100).toFixed(0)}% di contenuti video.`;
      fix = 'Porta i video al 30-50% del mix per favorire reach organica.';
    } else {
      status = 'pass';
      detail = `Mix bilanciato: ${(videoRatio * 100).toFixed(0)}% video, ${((carousels / posts.length) * 100).toFixed(0)}% carousel.`;
    }

    items.push({
      id: 'content_mix',
      label: 'Mix di formati',
      status,
      detail,
      howToFix: fix,
      weight: 7,
    });
  }

  // 12. Engagement rate adeguato (solo con follower >= 500)
  if (posts.length >= 3 && profile.followerCount >= 500) {
    const avgEng =
      posts.reduce((s, p) => s + p.likeCount + p.commentCount + (p.shareCount || 0), 0) /
      posts.length;
    const engRate = (avgEng / profile.followerCount) * 100;

    let threshold = 3;
    if (profile.followerCount > 100_000) threshold = 1.5;
    else if (profile.followerCount > 10_000) threshold = 2.5;

    let status: ChecklistItem['status'] = 'pass';
    let detail = '';
    let fix: string | undefined;

    if (engRate < threshold * 0.3) {
      status = 'fail';
      detail = `Engagement rate ${engRate.toFixed(2)}% — molto basso rispetto al ${threshold}% medio.`;
      fix = 'Aumenta interazione con caption che pongono domande, Reels virali, CTA esplicite.';
    } else if (engRate < threshold) {
      status = 'warn';
      detail = `Engagement rate ${engRate.toFixed(2)}% — sotto la media ${threshold}%.`;
      fix = 'Sperimenta formati più interattivi: sondaggi nelle stories, domande in caption, duet Reels.';
    } else {
      status = 'pass';
      detail = `Engagement rate ${engRate.toFixed(2)}% — sopra la media del ${threshold}%.`;
    }

    items.push({
      id: 'engagement_rate',
      label: 'Engagement rate',
      status,
      detail,
      howToFix: fix,
      weight: 9,
    });
  }

  // Calcola score
  const totalWeight = items.reduce((s, i) => s + i.weight, 0);
  const earnedWeight = items.reduce((s, i) => {
    if (i.status === 'pass') return s + i.weight;
    if (i.status === 'warn') return s + i.weight * 0.5;
    return s;
  }, 0);

  const score = totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;

  return {
    items,
    score,
    passed: items.filter((i) => i.status === 'pass').length,
    failed: items.filter((i) => i.status === 'fail').length,
    warnings: items.filter((i) => i.status === 'warn').length,
  };
}
