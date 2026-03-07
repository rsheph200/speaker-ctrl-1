import { NextResponse } from 'next/server';
import { getValidSpotifyToken } from '@/lib/spotifyAuth';

export async function GET() {
  const accessToken = await getValidSpotifyToken();
  
  if (!accessToken) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const response = await fetch('https://api.spotify.com/v1/me/player', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
    cache: 'no-store',
  });

  if (response.status === 204 || response.status === 202) {
    return NextResponse.json({ playing: false });
  }

  if (!response.ok) {
    console.error('Spotify player API error:', response.status, response.statusText);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: response.status });
  }

  const data = await response.json();

  // Just use the progress_ms from Spotify directly - don't try to calculate
  const progress = data.progress_ms || 0;
  const duration = data.item?.duration_ms || 0;

  return NextResponse.json({
    playing: data.is_playing,
    track: data.item?.name,
    artist: data.item?.artists?.map((a: any) => a.name).join(', ') || 'Unknown Artist',
    album: data.item?.album?.name,
    albumArt: data.item?.album?.images?.[0]?.url,
    progress: progress,
    duration: duration,
    volume: data.device?.volume_percent ?? null,
  });
}
