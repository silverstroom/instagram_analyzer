import { COST_PER_REQUEST_USD } from './client';
import type { HikerUser } from './types';

export type DeepFocusModuleId =
  | 'posts_90'
  | 'hashtag_analysis'
  | 'stories'
  | 'audience_quality'
  | 'competitor_discovery';

export interface DeepFocusModule {
  id: DeepFocusModuleId;
  label: string;
  description: string;
  /** Calcola il numero di request API che questo modulo consumerà per un dato profilo */
  estimateRequests: (user: HikerUser) => number;
}

export const DEEP_FOCUS_MODULES: DeepFocusModule[] = [
  {
    id: 'posts_90',
    label: 'Ultimi 90 post',
    description: 'Caption, metriche e trend engagement nel tempo',
    // HikerAPI restituisce ~12 post per pagina
    estimateRequests: () => Math.ceil(90 / 12), // 8 req
  },
  {
    id: 'hashtag_analysis',
    label: 'Mappa hashtag',
    description: 'Performance per tag e suggerimenti',
    // 1 request per i top 3 hashtag del profilo
    estimateRequests: () => 3,
  },
  {
    id: 'stories',
    label: 'Stories attive',
    description: 'Ultime stories e highlights',
    estimateRequests: () => 1,
  },
  {
    id: 'audience_quality',
    label: 'Audience quality score',
    description: 'Sample follower per rilevare bot e geo approssimativa',
    // 5 pagine x 50 follower = 250 sample
    estimateRequests: () => 5,
  },
  {
    id: 'competitor_discovery',
    label: 'Competitor discovery',
    description: 'Profili simili trovati automaticamente',
    estimateRequests: () => 2,
  },
];

export interface DeepFocusEstimate {
  moduleId: DeepFocusModuleId;
  label: string;
  requests: number;
  estimatedCost: number;
}

/**
 * Calcola il costo stimato di una deep focus analysis.
 */
export function estimateDeepFocusCost(
  user: HikerUser,
  selectedModules: DeepFocusModuleId[]
): { total: number; breakdown: DeepFocusEstimate[]; totalRequests: number } {
  const breakdown = DEEP_FOCUS_MODULES
    .filter((m) => selectedModules.includes(m.id))
    .map<DeepFocusEstimate>((m) => {
      const requests = m.estimateRequests(user);
      return {
        moduleId: m.id,
        label: m.label,
        requests,
        estimatedCost: requests * COST_PER_REQUEST_USD,
      };
    });

  const totalRequests = breakdown.reduce((s, b) => s + b.requests, 0);
  const total = totalRequests * COST_PER_REQUEST_USD;

  return { total, breakdown, totalRequests };
}
