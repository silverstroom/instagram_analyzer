import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function round(n: number, decimals: number = 2): number {
  if (!Number.isFinite(n)) return 0;
  const factor = Math.pow(10, decimals);
  return Math.round(n * factor) / factor;
}

export function formatCompact(n: number, locale: string = 'it-IT'): string {
  if (!Number.isFinite(n)) return '—';
  if (n < 1000) return Math.round(n).toString();
  return new Intl.NumberFormat(locale, {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(n);
}

export function formatNumber(n: number, locale: string = 'it-IT'): string {
  if (!Number.isFinite(n)) return '—';
  return new Intl.NumberFormat(locale).format(Math.round(n));
}

export function formatPct(n: number, decimals: number = 2): string {
  if (!Number.isFinite(n)) return '—';
  return `${round(n, decimals).toFixed(decimals)}%`;
}

export function formatUsd(n: number): string {
  if (!Number.isFinite(n)) return '$0.00';
  const decimals = n < 1 ? 4 : 2;
  return `$${n.toFixed(decimals)}`;
}

export function formatDate(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateShort(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
}

export function getInitials(name: string): string {
  const clean = (name || '').trim();
  if (!clean) return '??';
  const parts = clean.split(/[\s_\-.]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return clean.slice(0, 2).toUpperCase();
}

export function hashColor(seed: string): string {
  const palette = [
    '#cc5420', '#1d9e75', '#378ADD', '#D4537E',
    '#534AB7', '#D85A30', '#BA7517',
  ];
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h << 5) - h + seed.charCodeAt(i);
    h |= 0;
  }
  return palette[Math.abs(h) % palette.length];
}

/**
 * Trasforma una URL di immagine social in una URL che passa dal proxy.
 * Necessario per mostrare avatar Instagram/Facebook nel tool.
 */
export function proxiedImage(url: string | undefined | null): string | undefined {
  if (!url) return undefined;
  // Non proxare immagini già locali
  if (url.startsWith('/') || url.startsWith('data:')) return url;
  return `/api/image-proxy?url=${encodeURIComponent(url)}`;
}

export function extractHashtagsFromText(text: string): string[] {
  if (!text) return [];
  const matches = text.match(/#[\p{L}0-9_]+/gu) || [];
  return matches.map((m) => m.toLowerCase());
}
