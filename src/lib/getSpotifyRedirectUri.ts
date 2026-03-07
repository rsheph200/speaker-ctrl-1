export function getSpotifyRedirectUri(request?: Request): string {
    // Explicit override takes priority so the URI always matches
    // what's registered in the Spotify Developer Dashboard
    if (process.env.SPOTIFY_REDIRECT_URI) {
      return process.env.SPOTIFY_REDIRECT_URI;
    }

    // Derive from the incoming request so it works on any host/port/IP
    if (request) {
      const url = new URL(request.url);
      return `${url.protocol}//${url.host}/api/spotify/callback`;
    }

    // Vercel
    if (process.env.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL}/api/spotify/callback`;
    }

    return 'http://127.0.0.1:3000/api/spotify/callback';
  }