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
    // Try to get recently played track
    const recentResponse = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=1', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    
    if (recentResponse.ok) {
      const recentData = await recentResponse.json();
      const lastTrack = recentData.items?.[0]?.track;
      
      if (lastTrack) {
        return NextResponse.json({
          playing: false,
          track: lastTrack.name,
          artist: lastTrack.artists?.map((a: any) => a.name).join(', ') || 'Unknown Artist',
          album: lastTrack.album?.name,
          albumArt: lastTrack.album?.images?.[0]?.url,
          progress: 0,
          duration: lastTrack.duration_ms,
        });
      }
    }
    
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
  });
}