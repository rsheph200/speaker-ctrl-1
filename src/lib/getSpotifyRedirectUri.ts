export function getSpotifyRedirectUri(): string {
    // If explicitly set in env, use that
    if (process.env.SPOTIFY_REDIRECT_URI) {
      return process.env.SPOTIFY_REDIRECT_URI;
    }
    
    // For server-side (API routes), construct from VERCEL_URL or fallback
    if (typeof window === 'undefined') {
      const vercelUrl = process.env.VERCEL_URL;
      if (vercelUrl) {
        return `https://${vercelUrl}/api/spotify/callback`;
      }
      return 'http://127.0.0.1:3000/api/spotify/callback';
    }
    
    // For client-side (shouldn't be needed, but just in case)
    return `${window.location.origin}/api/spotify/callback`;
  }