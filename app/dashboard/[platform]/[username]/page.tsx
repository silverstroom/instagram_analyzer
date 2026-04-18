import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ProfileDashboardV5 } from '@/components/ProfileDashboardV5';
import { getScrapeCreatorsClient } from '@/lib/scrapecreators/client';
import {
  normalizeInstagramProfile,
  normalizeInstagramPosts,
  normalizeTikTokProfile,
  normalizeYouTubeChannel,
  normalizeLinkedInProfile,
  normalizeTwitterProfile,
  normalizeFacebookProfile,
  normalizeFacebookPosts,
  type NormalizedProfile,
  type NormalizedPost,
} from '@/lib/scrapecreators/normalizer';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { evaluateProfileChecklist } from '@/lib/evaluation/checklist';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

type Params = { platform: string; username: string };

async function analyzeProfile(
  platform: string,
  input: string
): Promise<{ profile: NormalizedProfile | null; posts: NormalizedPost[]; error?: string }> {
  const client = getScrapeCreatorsClient();
  if (!client.isConfigured()) {
    return { profile: null, posts: [], error: 'ScrapeCreators API key non configurata' };
  }

  try {
    switch (platform) {
      case 'instagram': {
        const raw = await client.instagramProfile(input);
        return {
          profile: normalizeInstagramProfile(raw),
          posts: normalizeInstagramPosts(raw),
        };
      }

      case 'facebook': {
        // Accetta sia handle puro ('EduNews24.it') sia URL completa
        const url = input.startsWith('http')
          ? input
          : `https://www.facebook.com/${input}`;
        const [profileRaw, postsRaw] = await Promise.all([
          client.facebookProfile(url),
          client.facebookPosts(url).catch(() => []),
        ]);
        return {
          profile: normalizeFacebookProfile(profileRaw),
          posts: normalizeFacebookPosts(postsRaw),
        };
      }

      case 'tiktok': {
        const raw = await client.tiktokProfile(input);
        const videos = await client.tiktokProfileVideos(input).catch(() => null);
        const profile = normalizeTikTokProfile(raw);
        const posts: NormalizedPost[] = ((videos?.videos || videos?.itemList || []) as any[]).map((v: any) => ({
          id: String(v.id || v.aweme_id),
          url: v.shareUrl || v.url,
          type: 'video' as const,
          caption: v.desc || v.title || '',
          thumbnailUrl: v.video?.cover || v.cover,
          takenAt: v.createTime || v.create_time || 0,
          likeCount: v.stats?.diggCount || v.digg_count || 0,
          commentCount: v.stats?.commentCount || v.comment_count || 0,
          shareCount: v.stats?.shareCount || v.share_count || 0,
          viewCount: v.stats?.playCount || v.play_count || 0,
        }));
        return { profile, posts };
      }

      case 'youtube': {
        const raw = await client.youtubeChannel(input);
        const videos = await client.youtubeChannelVideos(input).catch(() => null);
        const profile = normalizeYouTubeChannel(raw);
        const posts: NormalizedPost[] = ((videos?.videos || []) as any[]).map((v: any) => ({
          id: String(v.videoId || v.id),
          url: `https://www.youtube.com/watch?v=${v.videoId || v.id}`,
          type: 'video' as const,
          caption: v.title || '',
          thumbnailUrl: v.thumbnailUrl,
          takenAt: v.publishedAt ? new Date(v.publishedAt).getTime() / 1000 : 0,
          likeCount: v.likeCount || 0,
          commentCount: v.commentCount || 0,
          viewCount: v.viewCount || 0,
        }));
        return { profile, posts };
      }

      case 'linkedin': {
        const url = input.startsWith('http')
          ? input
          : `https://www.linkedin.com/company/${input}`;
        const raw = await client.linkedinCompany(url).catch(() => client.linkedinProfile(url));
        return { profile: normalizeLinkedInProfile(raw), posts: [] };
      }

      case 'twitter': {
        const raw = await client.twitterProfile(input);
        const tweets = await client.twitterUserTweets(input).catch(() => null);
        const profile = normalizeTwitterProfile(raw);
        const posts: NormalizedPost[] = ((tweets?.tweets || tweets?.data || []) as any[]).map((t: any) => ({
          id: String(t.id || t.id_str),
          url: `https://twitter.com/${profile.handle}/status/${t.id || t.id_str}`,
          type: 'status' as const,
          caption: t.text || t.full_text || '',
          takenAt: t.created_at ? new Date(t.created_at).getTime() / 1000 : 0,
          likeCount: t.favorite_count || t.likes || 0,
          commentCount: t.reply_count || t.replies || 0,
          shareCount: t.retweet_count || t.retweets || 0,
        }));
        return { profile, posts };
      }

      default:
        return { profile: null, posts: [], error: `Platform "${platform}" non supportata` };
    }
  } catch (err: any) {
    return { profile: null, posts: [], error: err.message };
  }
}

/**
 * Parse il parametro handles dalla query.
 * Formato: "instagram:edunews_24,facebook:EduNews24.it,tiktok:@foo"
 */
function parseHandlesParam(raw: string | undefined): Record<string, string> {
  if (!raw) return {};
  const out: Record<string, string> = {};
  const decoded = decodeURIComponent(raw);
  for (const pair of decoded.split(',')) {
    const colonIdx = pair.indexOf(':');
    if (colonIdx <= 0) continue;
    const plat = pair.slice(0, colonIdx).trim();
    const val = pair.slice(colonIdx + 1).trim();
    if (plat && val) out[plat] = val;
  }
  return out;
}

export default async function DashboardPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: { platforms?: string; handles?: string };
}) {
  const platform = params.platform.toLowerCase();
  const urlUsername = decodeURIComponent(params.username);
  const selectedPlatforms = (searchParams.platforms || platform).split(',').filter(Boolean);
  const handles = parseHandlesParam(searchParams.handles);

  // Usa l'handle specifico per la platform se disponibile, altrimenti fallback all'URL param
  const analysisInput = handles[platform] || urlUsername;

  const { profile, posts, error } = await analyzeProfile(platform, analysisInput);

  if (error || !profile) {
    return (
      <main className="min-h-screen">
        <div className="max-w-3xl mx-auto px-6 py-20">
          <Link
            href="/"
            className="text-sm text-ink-700 hover:text-ink-900 mb-6 inline-block"
          >
            ← Torna alla home
          </Link>
          <h1 className="font-display text-3xl mb-4">Analisi non riuscita</h1>
          <p className="text-ink-700 mb-4">
            Non è stato possibile analizzare <strong>{analysisInput}</strong> su {platform}.
          </p>
          <pre className="mt-4 p-4 bg-ink-100 rounded-md text-sm text-red-800 overflow-auto whitespace-pre-wrap">
            {error}
          </pre>
          <p className="text-sm text-ink-700 mt-4">
            Suggerimento: verifica di aver inserito l&apos;handle/URL corretto per{' '}
            {platform}. Gli handle variano tra social (es. <code>@edunews_24</code> su
            Instagram ma <code>facebook.com/EduNews24.it</code> su Facebook).
          </p>
        </div>
      </main>
    );
  }

  const checklist = evaluateProfileChecklist(profile, posts);

  // Persistenza storico
  try {
    const supabase = getSupabaseAdmin();
    await supabase.from('analyses_cache').upsert(
      {
        username: profile.handle || analysisInput,
        platform,
        analyzed_at: new Date().toISOString(),
        profile_pic_url: profile.profilePicUrl,
        summary: {
          followers: profile.followerCount,
          following: profile.followingCount,
          posts: profile.mediaCount,
          is_verified: profile.isVerified,
          checklist_score: checklist.score,
          posts_analyzed: posts.length,
        },
        full_data: { profile, posts, checklist } as any,
        cost_usd: 0,
      },
      { onConflict: 'username,platform' }
    );
  } catch (e) {
    console.error('[dashboard] DB write failed:', e);
  }

  return (
    <ProfileDashboardV5
      initialProfile={profile}
      initialPosts={posts}
      initialChecklist={checklist}
      platform={platform}
      selectedPlatforms={selectedPlatforms}
      handles={handles}
      username={profile.handle || analysisInput}
    />
  );
}
