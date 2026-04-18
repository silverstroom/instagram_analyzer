import { NextResponse } from 'next/server';
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
import { evaluateProfileChecklist } from '@/lib/evaluation/checklist';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * GET /api/analyze?platform=...&username=...&refresh=1
 *
 * Usato dal tab switch. Cache-first: se c'è un'analisi esistente, la restituisce
 * dalla cache. Con refresh=1 forza il refresh.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const platform = searchParams.get('platform') || '';
  const rawUsername = searchParams.get('username') || '';
  const username = rawUsername.replace('@', '').trim().toLowerCase();
  const forceRefresh = searchParams.get('refresh') === '1';

  if (!platform || !username) {
    return NextResponse.json({ error: 'platform e username richiesti' }, { status: 400 });
  }

  // CACHE LOOKUP
  if (!forceRefresh) {
    try {
      const supabase = getSupabaseAdmin();
      const { data } = await supabase
        .from('analyses_cache')
        .select('full_data, analyzed_at')
        .eq('platform', platform)
        .in('username', [username, rawUsername, rawUsername.toLowerCase()])
        .order('analyzed_at', { ascending: false })
        .limit(1);

      if (data && data.length > 0 && data[0].full_data) {
        const fd = data[0].full_data as any;
        if (fd.profile && fd.checklist) {
          return NextResponse.json({
            profile: fd.profile,
            posts: fd.posts || [],
            checklist: fd.checklist,
            fromCache: true,
            analyzedAt: data[0].analyzed_at,
          });
        }
      }
    } catch (e) {
      console.error('[analyze] cache lookup failed:', e);
    }
  }

  const client = getScrapeCreatorsClient();
  if (!client.isConfigured()) {
    return NextResponse.json({ error: 'API key non configurata' }, { status: 503 });
  }

  try {
    let profile: NormalizedProfile | null = null;
    let posts: NormalizedPost[] = [];

    switch (platform) {
      case 'instagram': {
        const raw = await client.instagramProfile(username);
        profile = normalizeInstagramProfile(raw);
        posts = normalizeInstagramPosts(raw);
        break;
      }
      case 'facebook': {
        const url = rawUsername.startsWith('http') ? rawUsername : `https://www.facebook.com/${rawUsername}`;
        const [profileRaw, postsRaw] = await Promise.all([
          client.facebookProfile(url),
          client.facebookPosts(url).catch(() => []),
        ]);
        profile = normalizeFacebookProfile(profileRaw);
        posts = normalizeFacebookPosts(postsRaw);
        break;
      }
      case 'tiktok': {
        const raw = await client.tiktokProfile(username);
        const videos = await client.tiktokProfileVideos(username).catch(() => null);
        profile = normalizeTikTokProfile(raw);
        posts = ((videos?.videos || videos?.itemList || []) as any[]).map((v: any) => ({
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
        break;
      }
      case 'youtube': {
        const raw = await client.youtubeChannel(username);
        const videos = await client.youtubeChannelVideos(username).catch(() => null);
        profile = normalizeYouTubeChannel(raw);
        posts = ((videos?.videos || []) as any[]).map((v: any) => ({
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
        break;
      }
      case 'linkedin': {
        const url = rawUsername.startsWith('http') ? rawUsername : `https://www.linkedin.com/company/${rawUsername}`;
        const raw = await client.linkedinCompany(url).catch(() => client.linkedinProfile(url));
        profile = normalizeLinkedInProfile(raw);
        break;
      }
      case 'twitter': {
        const raw = await client.twitterProfile(username);
        const tweets = await client.twitterUserTweets(username).catch(() => null);
        profile = normalizeTwitterProfile(raw);
        posts = ((tweets?.tweets || tweets?.data || []) as any[]).map((t: any) => ({
          id: String(t.id || t.id_str),
          url: `https://twitter.com/${profile!.handle}/status/${t.id || t.id_str}`,
          type: 'status' as const,
          caption: t.text || t.full_text || '',
          takenAt: t.created_at ? new Date(t.created_at).getTime() / 1000 : 0,
          likeCount: t.favorite_count || t.likes || 0,
          commentCount: t.reply_count || t.replies || 0,
          shareCount: t.retweet_count || t.retweets || 0,
        }));
        break;
      }
      default:
        return NextResponse.json({ error: `Platform "${platform}" non supportata` }, { status: 400 });
    }

    if (!profile) {
      return NextResponse.json({ error: 'Profilo non trovato' }, { status: 404 });
    }

    const checklist = evaluateProfileChecklist(profile, posts);

    // Salva in cache
    try {
      const supabase = getSupabaseAdmin();
      await supabase.from('analyses_cache').upsert(
        {
          username: (profile.handle || username).toLowerCase(),
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
      console.error('[analyze] cache write failed:', e);
    }

    return NextResponse.json({ profile, posts, checklist, fromCache: false });
  } catch (err: any) {
    console.error('[analyze]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
