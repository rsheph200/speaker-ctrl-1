import { NextResponse } from 'next/server';
import { getValidSpotifyToken } from '@/lib/spotifyAuth';

export async function POST() {
  const accessToken = await getValidSpotifyToken();
  
  if (!accessToken) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const response = await fetch('https://api.spotify.com/v1/me/player/previous', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (response.status === 204 || response.status === 200) {
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Failed' }, { status: response.status });
}