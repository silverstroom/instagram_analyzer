import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ProfileDashboard } from '@/components/ProfileDashboard';

export const dynamic = 'force-dynamic';

async function fetchQuickAnalysis(username: string) {
  const base = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000';

  const res = await fetch(`${base}/api/profiles/${username}`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || `Errore ${res.status}`);
  }

  return res.json();
}

export default async function DashboardPage({
  params,
}: {
  params: { username: string };
}) {
  const username = params.username.replace('@', '').trim().toLowerCase();

  let data;
  try {
    data = await fetchQuickAnalysis(username);
  } catch (err: any) {
    return (
      <main className="min-h-screen">
        <div className="max-w-3xl mx-auto px-6 py-20">
          <Link
            href="/"
            className="text-sm text-ink-500 hover:text-ink-900 mb-6 inline-block"
          >
            ← Torna alla home
          </Link>
          <h1 className="font-display text-3xl mb-4">Analisi non riuscita</h1>
          <p className="text-ink-600">
            Non è stato possibile analizzare <strong>@{username}</strong>.
          </p>
          <pre className="mt-4 p-4 bg-ink-100 rounded-md text-sm text-accent-700 overflow-auto">
            {err.message}
          </pre>
        </div>
      </main>
    );
  }

  if (!data.user) notFound();

  return <ProfileDashboard initialData={data} username={username} />;
}
