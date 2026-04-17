import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Arrotonda a `decimals` decimali. Usa toFixed per evitare numeri tipo 6.122222222222222.
 */
export function round(n: number, decimals: number = 2): number {
  if (!Number.isFinite(n)) return 0;
  const factor = Math.pow(10, decimals);
  return Math.round(n * factor) / factor;
}

/**
 * Formatta compatto: 12.5K, 1.2M. Sempre 1 decimale massimo.
 */
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

/**
 * Percentuale con sempre 2 decimali.
 */
export function formatPct(n: number, decimals: number = 2): string {
  if (!Number.isFinite(n)) return '—';
  return `${round(n, decimals).toFixed(decimals)}%`;
}

/**
 * USD: 4 decimali se < $1, altrimenti 2.
 */
export function formatUsd(n: number): string {
  if (!Number.isFinite(n)) return '$0.00';
  const decimals = n < 1 ? 4 : 2;
  return `$${n.toFixed(decimals)}`;
}

export function growthPct(current: number, previous: number): number {
  if (previous === 0) return 0;
  return round(((current - previous) / previous) * 100, 2);
}

/**
 * Formatta una data ISO in formato italiano leggibile.
 */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateShort(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
}

/**
 * Iniziali per avatar fallback, max 2 caratteri.
 */
export function getInitials(name: string): string {
  const clean = (name || '').trim();
  if (!clean) return '??';
  const parts = clean.split(/[\s_\-.]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
}

/**
 * Colore hash-based per avatar fallback coerenti.
 */
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
