'use client';

import { useState } from 'react';

export type TabId = 'instagram' | 'facebook';

interface Props {
  active: TabId;
  onChange: (tab: TabId) => void;
  facebookAvailable?: boolean;
}

export function PlatformTabs({ active, onChange, facebookAvailable = true }: Props) {
  return (
    <div
      role="tablist"
      className="inline-flex items-center gap-1 p-1 bg-ink-100 rounded-full mb-6"
    >
      <TabButton
        active={active === 'instagram'}
        onClick={() => onChange('instagram')}
        label="Instagram"
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
            <rect x="3" y="3" width="18" height="18" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r="0.7" fill="currentColor" />
          </svg>
        }
      />
      <TabButton
        active={active === 'facebook'}
        onClick={() => onChange('facebook')}
        label="Facebook + ADS"
        disabled={!facebookAvailable}
        icon={
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
            <path d="M14 13.5h2.5l1-4H14V7c0-1.03 0-2 2-2h1.5V1.64S16.19 1.5 14.62 1.5C10.96 1.5 9 3.92 9 7.07V9.5H6V13.5H9V22h5V13.5z" />
          </svg>
        }
      />
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
  icon,
  disabled,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
        active
          ? 'bg-white text-ink-900 shadow-sm'
          : 'text-ink-600 hover:text-ink-900 disabled:opacity-40 disabled:cursor-not-allowed'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
