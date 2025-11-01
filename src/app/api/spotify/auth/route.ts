import { NextResponse } from 'next/server';
import { getSpotifyRedirectUri } from '@/lib/getSpotifyRedirectUri';

export async function GET() {
  const redirectUri = getSpotifyRedirectUri();

  const scopes = [
    'user-read-playback-state',
    'user-read-currently-playing',
    'user-modify-playback-state',
    'user-read-recently-played',
  ].join(' ');

  const params = new URLSearchParams({
    client_id: process.env.SPOTIFY_CLIENT_ID!,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: scopes,
  });

  return NextResponse.redirect(`https://accounts.spotify.com/authorize?${params.toString()}`);
}