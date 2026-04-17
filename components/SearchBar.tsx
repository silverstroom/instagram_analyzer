'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

export function SearchBar() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [pending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = username.replace('@', '').trim().toLowerCase();
    if (!clean) return;
    startTransition(() => {
      router.push(`/dashboard/${clean}`);
    });
  };

  return (
    <form onSubmit={onSubmit} className="relative">
      <div className="flex items-center gap-0 border-b-2 border-ink-900 focus-within:border-accent-600 transition-colors">
        <span className="font-display text-4xl md:text-5xl text-ink-400 pr-2 select-none">
          @
        </span>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="username"
          className="flex-1 bg-transparent outline-none text-3xl md:text-4xl font-display py-4 placeholder:text-ink-300"
          autoFocus
          disabled={pending}
        />
        <button
          type="submit"
          disabled={!username.trim() || pending}
          className="ml-4 px-5 py-3 bg-ink-900 text-ink-50 text-sm font-medium rounded-full hover:bg-ink-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
        >
          {pending ? 'Analizzo...' : 'Analizza'}
        </button>
      </div>

      <p className="mt-3 text-xs text-ink-500">
        Analisi quick gratuita · ~2 request API · $0.0012 di costo interno
      </p>
    </form>
  );
}
