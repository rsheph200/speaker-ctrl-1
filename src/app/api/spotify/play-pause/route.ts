import { NextRequest, NextResponse } from 'next/server';
import { getValidSpotifyToken } from '@/lib/spotifyAuth';

export async function POST(request: NextRequest) {
  const accessToken = await getValidSpotifyToken();
  
  if (!accessToken) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { playing } = await request.json();

  const endpoint = playing 
    ? 'https://api.spotify.com/v1/me/player/pause'
    : 'https://api.spotify.com/v1/me/player/play';

  const response = await fetch(endpoint, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (response.status === 204 || response.status === 200) {
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Failed' }, { status: response.status });
}