'use server';

import { NextResponse } from 'next/server';
import { getValidSpotifyToken } from '@/lib/spotifyAuth';

export async function PUT(request: Request) {
  const accessToken = await getValidSpotifyToken();

  if (!accessToken) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  let volume: number | undefined;

  try {
    const body = await request.json();
    volume = typeof body?.volume === 'number' ? Math.round(body.volume) : undefined;
  } catch (error) {
    console.error('Failed to parse Spotify volume payload', error);
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  if (typeof volume !== 'number' || Number.isNaN(volume)) {
    return NextResponse.json({ error: 'Volume must be a number' }, { status: 400 });
  }

  const clampedVolume = Math.min(Math.max(volume, 0), 100);

  const response = await fetch(
    `https://api.spotify.com/v1/me/player/volume?volume_percent=${clampedVolume}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Spotify volume API error:', response.status, errorText);
    return NextResponse.json({ error: 'Failed to set volume' }, { status: response.status });
  }

  return NextResponse.json({ success: true, volume: clampedVolume });
}
