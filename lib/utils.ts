import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Formatta un numero in stile compatto (12.5K, 1.2M, ecc.)
 */
export function formatCompact(n: number, locale: string = 'it-IT'): string {
  if (n < 1000) return n.toString();
  return new Intl.NumberFormat(locale, {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(n);
}

/**
 * Formatta un numero con separatori di migliaia.
 */
export function formatNumber(n: number, locale: string = 'it-IT'): string {
  return new Intl.NumberFormat(locale).format(n);
}

/**
 * Formatta una percentuale.
 */
export function formatPct(n: number, decimals: number = 1): string {
  return `${n.toFixed(decimals)}%`;
}

/**
 * Formatta costi USD con 4 decimali se < $1, altrimenti 2.
 */
export function formatUsd(n: number): string {
  const decimals = n < 1 ? 4 : 2;
  return `$${n.toFixed(decimals)}`;
}

/**
 * Calcola percentuale di crescita tra due valori.
 */
export function growthPct(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}
