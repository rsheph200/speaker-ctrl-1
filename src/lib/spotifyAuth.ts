import { cookies } from 'next/headers';

export async function getValidSpotifyToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('spotify_access_token')?.value;
  const refreshToken = cookieStore.get('spotify_refresh_token')?.value;
  const expiry = cookieStore.get('spotify_token_expiry')?.value;

  if (!refreshToken) {
    return null;
  }

  // Check if token is missing, expired, or expiring soon (within 5 minutes)
  const expiryMs = expiry ? Number(expiry) : 0;
  const isExpired = !accessToken || Date.now() > expiryMs - 5 * 60 * 1000;

  if (isExpired) {
    // Refresh the token
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
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Update cookies with new token
        try {
          cookieStore.set('spotify_access_token', data.access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 3600,
            path: '/',
          });

          cookieStore.set(
            'spotify_token_expiry',
            String(Date.now() + data.expires_in * 1000),
            {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              maxAge: 60 * 60 * 24 * 30,
              path: '/',
            },
          );
        } catch (error) {
          console.warn('Failed to update Spotify auth cookies:', error);
        }

        return data.access_token;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      return null;
    }
  }

  return accessToken ?? null;
}
