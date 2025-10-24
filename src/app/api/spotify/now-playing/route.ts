import { NextResponse } from 'next/server';
import { getValidSpotifyToken } from '@/lib/spotifyAuth';

export async function GET() {
  const accessToken = await getValidSpotifyToken();
  
  if (!accessToken) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // Use /player endpoint instead of /currently-playing for more reliable data
  const response = await fetch('https://api.spotify.com/v1/me/player', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
    cache: 'no-store', // Force fresh data
  });

  if (response.status === 204 || response.status === 202) {
    // No active device or nothing playing
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

  // Calculate progress properly - timestamp-based approach
  const timestamp = data.timestamp || Date.now(); // Server time
  const progress = data.progress_ms || 0;
  const isPlaying = data.is_playing;
  
  // If playing, calculate current progress accounting for time passed
  let currentProgress = progress;
  if (isPlaying && timestamp) {
    const timePassed = Date.now() - timestamp;
    currentProgress = progress + timePassed;
  }
  
  // Clamp to valid range
  const duration = data.item?.duration_ms || 0;
  currentProgress = Math.max(0, Math.min(currentProgress, duration));

  console.log('Spotify player data:', {
    is_playing: data.is_playing,
    track: data.item?.name,
    raw_progress: progress,
    calculated_progress: currentProgress,
    duration: duration,
    timestamp: timestamp,
    time_passed: Date.now() - timestamp
  });

  return NextResponse.json({
    playing: data.is_playing,
    track: data.item?.name,
    artist: data.item?.artists?.map((a: any) => a.name).join(', ') || 'Unknown Artist',
    album: data.item?.album?.name,
    albumArt: data.item?.album?.images?.[0]?.url,
    progress: currentProgress,
    duration: duration,
  });
}