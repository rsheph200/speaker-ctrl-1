import { NextRequest, NextResponse } from 'next/server';
import { getValidSpotifyToken } from '@/lib/spotifyAuth';

export async function POST(request: NextRequest) {
  const accessToken = await getValidSpotifyToken();
  
  if (!accessToken) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { playing } = await request.json();

  const endpoint = playing 
    ? 'https://api.spotify.com/v1/me/player/play'
    : 'https://api.spotify.com/v1/me/player/pause';

  const response = await fetch(endpoint, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (response.ok) {
    return NextResponse.json({ success: true });
  }

  const errorText = await response.text();
  console.error(
    'Spotify play/pause API error:',
    response.status,
    response.statusText,
    errorText,
  );

  return NextResponse.json(
    { error: 'Failed to toggle playback', details: errorText || null },
    { status: response.status },
  );
}
