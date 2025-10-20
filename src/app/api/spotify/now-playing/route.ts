import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('spotify_access_token')?.value;

  if (!accessToken) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (response.status === 204) {
    // Nothing playing - try to get last played track
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
          artist: lastTrack.artists?.[0]?.name,
          album: lastTrack.album?.name,
          albumArt: lastTrack.album?.images?.[0]?.url,
        });
      }
    }
    
    return NextResponse.json({ playing: false });
  }

  if (!response.ok) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: response.status });
  }

  const data = await response.json();

  return NextResponse.json({
    playing: data.is_playing,  // Use actual playing state from Spotify
    track: data.item?.name,
    artist: data.item?.artists?.[0]?.name,
    album: data.item?.album?.name,
    albumArt: data.item?.album?.images?.[0]?.url,
    progress: data.progress_ms,
    duration: data.item?.duration_ms,
  });
}