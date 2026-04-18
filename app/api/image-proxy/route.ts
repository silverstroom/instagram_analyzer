import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/image-proxy?url=<encoded_url>
 *
 * Scarica un'immagine server-side e la ri-serve dal nostro dominio.
 * Serve per bypassare le protezioni CORS/referrer di Instagram/Facebook CDN
 * che bloccano l'uso diretto delle URL delle foto profilo in contesti web esterni.
 *
 * Whitelist domini per evitare abusi: solo CDN dei social supportati.
 */

const ALLOWED_HOSTS = [
  'scontent',    // Instagram/Facebook CDN: scontent-*.cdninstagram.com, scontent.*.fbcdn.net
  'cdninstagram',
  'fbcdn.net',
  'fbcdn.com',
  'ttcdn',        // TikTok
  'tiktokcdn',
  'ytimg.com',    // YouTube
  'yt3.ggpht.com',
  'licdn.com',    // LinkedIn
  'twimg.com',    // Twitter
  'pbs.twimg.com',
];

function isAllowed(url: URL): boolean {
  const host = url.hostname.toLowerCase();
  return ALLOWED_HOSTS.some((allowed) => host.includes(allowed));
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const target = searchParams.get('url');

  if (!target) {
    return new NextResponse('missing url', { status: 400 });
  }

  let url: URL;
  try {
    url = new URL(target);
  } catch {
    return new NextResponse('invalid url', { status: 400 });
  }

  if (!isAllowed(url)) {
    return new NextResponse('host not allowed', { status: 403 });
  }

  try {
    const res = await fetch(url.toString(), {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        Referer: 'https://www.instagram.com/',
      },
      // cache per 1 giorno: i CDN Instagram cambiano spesso URL,
      // ma entro 24h il file resta valido
      next: { revalidate: 86400 },
    });

    if (!res.ok) {
      return new NextResponse(`upstream ${res.status}`, { status: 502 });
    }

    const contentType = res.headers.get('content-type') || 'image/jpeg';
    const buffer = await res.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
        'Content-Length': String(buffer.byteLength),
      },
    });
  } catch (err: any) {
    return new NextResponse(`proxy error: ${err.message}`, { status: 502 });
  }
}
