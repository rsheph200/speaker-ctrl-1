
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  
  // Log incoming request
  console.log('Spotify callback received:', {
    hasCode: !!code,
    codeLength: code?.length,
    userAgent: request.headers.get('user-agent'),
    ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
    timestamp: new Date().toISOString()
  });

  // DEBUG: Check if env vars are loaded
  console.log('Environment variables check:', {
    clientIdExists: !!process.env.SPOTIFY_CLIENT_ID,
    clientSecretExists: !!process.env.SPOTIFY_CLIENT_SECRET,
    redirectUriExists: !!process.env.NEXT_PUBLIC_REDIRECT_URI,
    clientIdLength: process.env.SPOTIFY_CLIENT_ID?.length,
    clientSecretLength: process.env.SPOTIFY_CLIENT_SECRET?.length,
    redirectUri: process.env.NEXT_PUBLIC_REDIRECT_URI
  });

  if (!code) {
    console.warn('Spotify callback failed: No authorization code provided');
    return NextResponse.redirect(new URL('/?error=no_code', request.url));
  }

  try {
    console.log('Exchanging authorization code for tokens...');
    
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
        redirect_uri: process.env.NEXT_PUBLIC_REDIRECT_URI!,
      }),
    });

    console.log('Spotify token response status:', response.status);

    if (!response.ok) {
      const error = await response.text();
      console.error('Spotify token exchange failed:', {
        status: response.status,
        statusText: response.statusText,
        error: error,
        codeLength: code.length
      });
      return NextResponse.redirect(new URL('/?error=token_failed', request.url));
    }

    const data = await response.json();
    console.log('Token exchange successful:', {
      hasAccessToken: !!data.access_token,
      hasRefreshToken: !!data.refresh_token,
      tokenType: data.token_type,
      expiresIn: data.expires_in,
      scope: data.scope
    });

    // Store tokens in cookie
    console.log('Setting authentication cookies...');
    const redirectUrl = new URL('/', request.url);
    const responseWithCookie = NextResponse.redirect(redirectUrl);
    
    responseWithCookie.cookies.set('spotify_access_token', data.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600, // 1 hour
    });
    
    responseWithCookie.cookies.set('spotify_refresh_token', data.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    console.log('Spotify authentication completed successfully:', {
      redirectUrl: redirectUrl.toString(),
      isProduction: process.env.NODE_ENV === 'production',
      cookiesSet: ['spotify_access_token', 'spotify_refresh_token']
    });

    return responseWithCookie;
  } catch (error) {
    console.error('Spotify callback error:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      code: code?.substring(0, 10) + '...', // Log first 10 chars for debugging
      timestamp: new Date().toISOString()
    });
    return NextResponse.redirect(new URL('/?error=exception', request.url));
  }
}