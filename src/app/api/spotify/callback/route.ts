import { NextRequest, NextResponse } from 'next/server';
import { getSpotifyRedirectUri } from '@/lib/getSpotifyRedirectUri';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');

  const redirectUri = getSpotifyRedirectUri();

  if (!code) {
    return NextResponse.redirect(new URL('/?error=no_code', request.url));
  }

  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(
          `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
        ).toString('base64'),
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Spotify token exchange failed:', error);
      return NextResponse.redirect(new URL('/?error=token_failed', request.url));
    }

    const data = await response.json();

    const redirectUrl = new URL('/', request.nextUrl.origin);
    const responseWithCookie = NextResponse.redirect(redirectUrl);
    
    // Store access token (expires in 1 hour)
    responseWithCookie.cookies.set('spotify_access_token', data.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600, // 1 hour
      path: '/',
    });
    
    if (data.refresh_token) {
      // Store refresh token (long-lived)
      responseWithCookie.cookies.set('spotify_refresh_token', data.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
      });
    }

    // Store expiry time so we know when to refresh
    responseWithCookie.cookies.set('spotify_token_expiry', 
      String(Date.now() + data.expires_in * 1000), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    return responseWithCookie;
  } catch (error) {
    console.error('Spotify callback error:', error);
    return NextResponse.redirect(new URL('/?error=exception', request.url));
  }
}
