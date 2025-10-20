import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const scopes = [
    'user-read-playback-state',
    'user-read-currently-playing',
    'user-modify-playback-state',
  ].join(' ');

  const params = new URLSearchParams({
    client_id: process.env.SPOTIFY_CLIENT_ID!,
    response_type: 'code',
    redirect_uri: process.env.NEXT_PUBLIC_REDIRECT_URI!,
    scope: scopes,
  });

  return NextResponse.redirect(`https://accounts.spotify.com/authorize?${params.toString()}`);
}