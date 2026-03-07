export function getSpotifyRedirectUri(request?: Request): string {
    // Derive from the incoming request so it works on any host/port/IP
    // (phone on local network, Tailscale, localhost — all get the right URI)
    if (request) {
      const url = new URL(request.url);
      return `${url.protocol}//${url.host}/api/spotify/callback`;
    }

    // Explicit override (e.g. production deploy)
    if (process.env.SPOTIFY_REDIRECT_URI) {
      return process.env.SPOTIFY_REDIRECT_URI;
    }

    // Vercel
    if (process.env.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL}/api/spotify/callback`;
    }

    return 'http://127.0.0.1:3000/api/spotify/callback';
  }