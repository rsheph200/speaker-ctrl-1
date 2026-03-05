# Speaker Ctrl 1 - Next.js Web App

Web app for controlling the All Ears Audio multi-room speaker system. Built first as the initial interface before the React Native mobile app.

## Tech Stack

- **Next.js** 15.4.8 (App Router, Turbopack dev)
- **React** 19.1.0, **TypeScript** ^5
- **Tailwind CSS** ^4 (utility-first styling)
- **MQTT.js** ^5.14.1 (WebSocket connection to speaker hub)
- **@spotify/web-api-ts-sdk** ^1.2.0
- **Lucide React** ^0.546.0 (icons)

## Running

```bash
npm run dev        # Next.js dev server (Turbopack)
npm run build      # Production build
npm run start      # Production server
npm run format     # Prettier format
```

## Environment Variables

Set in `.env.local`:

- `NEXT_PUBLIC_MQTT_URL` - WebSocket URL for MQTT broker
- `SPOTIFY_CLIENT_ID` - Spotify OAuth app client ID
- `SPOTIFY_CLIENT_SECRET` - Spotify OAuth app secret
- `NEXT_PUBLIC_MQTT_DEBUG` - `"true"` to enable MQTT debug logging

## Project Structure

```
src/
├── app/
│   ├── layout.tsx               # Root layout with Providers
│   ├── page.tsx                 # Home (redirects to /speaker-one)
│   ├── globals.css              # Tailwind imports
│   ├── providers.tsx            # Client-side providers wrapper
│   ├── (pages)/
│   │   └── speaker-one/
│   │       └── page.tsx         # Main speaker control page
│   └── api/
│       ├── speakers/
│       │   ├── route.ts         # GET - list speakers
│       │   └── [speakerId]/
│       │       └── route.ts     # GET - speaker details
│       └── spotify/
│           ├── auth/            # GET - initiate OAuth
│           ├── callback/        # GET - handle OAuth callback
│           ├── now-playing/     # GET - current playback
│           ├── play-pause/      # POST - toggle playback
│           ├── next/            # POST - skip forward
│           ├── previous/        # POST - skip back
│           └── volume/          # POST - set volume
├── components/
│   ├── speakercontrol.tsx       # Main speaker control component
│   ├── ThemeColorUpdater.tsx    # Dynamic viewport meta color
│   ├── page/
│   │   └── PageBackground.tsx   # Theme-based background
│   ├── page-controls/
│   │   ├── SpeakerHeader.tsx    # Header with logo, source selector, health
│   │   ├── SpeakerFooter.tsx    # Footer with connection status
│   │   └── assets/              # SVG icon components (Play, Pause, Next, etc.)
│   └── speaker/
│       ├── base/                # Shared components across themes
│       │   ├── now-playing.tsx
│       │   ├── visualizer.tsx
│       │   ├── volume.tsx
│       │   ├── status.tsx
│       │   ├── source-selector.tsx
│       │   ├── power-controls.tsx
│       │   ├── spotify-volume-control.tsx
│       │   ├── system-health.tsx
│       │   ├── circle-visualizer.tsx
│       │   └── player-controls/
│       │       ├── SpeakerNowPlayingArtwork.tsx
│       │       ├── SpeakerNowPlayingControls.tsx
│       │       ├── SpeakerNowPlayingDetails.tsx
│       │       └── SpeakerNowPlayingProgress.tsx
│       ├── plain/               # Plain theme (gray, minimal)
│       │   ├── plain-body.tsx
│       │   ├── plain-progress.tsx
│       │   └── plain-player-controls.tsx
│       ├── mood/                # Mood theme (gradient, atmospheric)
│       │   ├── mood-body.tsx
│       │   ├── mood-background.tsx
│       │   ├── mood-progress.tsx
│       │   └── mood-player-controls.tsx
│       └── circular/            # Circular theme (radial layout)
│           ├── circular-body.tsx
│           ├── circular-progress.tsx
│           ├── circular-player-controls.tsx
│           ├── circular-track-display.tsx
│           └── circle-speaker-visualizer.tsx
├── context/
│   └── AppSettingsContext.tsx    # Global state: dummyMode, theme selection
└── lib/
    ├── useMQTT.ts               # Client-side MQTT hook (same topics as mobile)
    ├── useSpotify.ts            # Spotify playback control hook
    ├── useSpeakers.ts           # Speaker listing hook
    ├── mqttStore.ts             # Server-side MQTT client singleton
    ├── spotifyAuth.ts           # Spotify OAuth helpers
    ├── getSpotifyRedirectUri.ts # OAuth redirect URI builder
    ├── sourceModes.ts           # Source mode config (icon, label per source)
    ├── themeConfig.ts           # Theme color constants
    ├── mqttVisualizer.ts        # FFT visualization MQTT hook
    ├── useArtworkColor.ts       # Extract dominant color from album art
    └── dummy/
        ├── speakerService.ts    # Mock speaker state for demo mode
        └── visualizerFrames.ts  # Mock FFT frames
```

## Key Architecture

### Themes

Four visual themes selectable at runtime:

| Theme | Background | Style |
|-------|-----------|-------|
| Plain | `#C7C7C7` gray | Minimal, card-based |
| Retro | `#FFD700` gold | Vintage aesthetic |
| Mood | Black-to-teal gradient | Atmospheric, blur effects |
| Circular | `#C7C7C7` gray | Radial/concentric layout |

Each theme has its own body, progress, and player-controls components under `components/speaker/<theme>/`. Shared components live in `components/speaker/base/`.

Theme colors are defined in `lib/themeConfig.ts`.

### MQTT (useMQTT.ts)

Client-side hook, nearly identical to the mobile app's version. Connects via WebSocket to Mosquitto broker.

**Subscriptions:** `ruspeaker/#` and `audio/speakers/#`

**Same state shape as mobile app:** volume, source, spotify playback, bluetooth playback, health, nowPlaying.

**Same features:** client-side progress interpolation (100ms), auto source switching, unified `ruspeaker/now_playing` topic support.

### Server-side MQTT (mqttStore.ts)

Singleton MQTT client that runs on the Next.js server. Used by API routes to query speaker state.

### Spotify Auth

Backend OAuth flow (not PKCE like mobile). Tokens stored in HTTP-only cookies. API routes proxy all Spotify Web API calls.

### Artwork Color Extraction (useArtworkColor.ts)

Extracts dominant color from album artwork and applies it to theme accents dynamically.

### Demo Mode

Same as mobile - full mock speaker with playlist, playback simulation, and FFT data.

## Pages

- `/` - Redirects to `/speaker-one`
- `/speaker-one` - Main speaker control interface

## API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/speakers` | GET | List connected speakers |
| `/api/speakers/[id]` | GET | Speaker details |
| `/api/spotify/auth` | GET | Start Spotify OAuth |
| `/api/spotify/callback` | GET | OAuth callback, store tokens |
| `/api/spotify/now-playing` | GET | Current playback state |
| `/api/spotify/play-pause` | POST | Toggle playback |
| `/api/spotify/next` | POST | Next track |
| `/api/spotify/previous` | POST | Previous track |
| `/api/spotify/volume` | POST | Set Spotify volume |
