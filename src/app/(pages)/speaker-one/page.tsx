'use client';

import type { ReactNode } from 'react';
import { Music } from 'lucide-react';

import { useMQTT } from '@/lib/useMQTT';
import { useSpotify } from '@/lib/useSpotify';
import {
  SpeakerNowPlaying,
  SpeakerPowerControls,
  SpeakerSourceSelector,
  SpeakerStatus,
  SpeakerSystemHealth,
  SpeakerVolume,
  SpotifyVolumeControl,
  type NowPlayingInfo,
} from '@/components/speaker/base';

function Card({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-lg">
      {children}
    </div>
  );
}

function ConnectionBadge({ connected }: { connected: boolean }) {
  return (
    <span className="inline-flex items-center gap-2 text-gray-300">
      <span
        className={connected ? 'h-3 w-3 rounded-full bg-green-400' : 'h-3 w-3 rounded-full bg-red-400'}
      />
      <span className="text-sm uppercase tracking-wide text-gray-400">
        {connected ? 'Connected' : 'Disconnected'}
      </span>
    </span>
  );
}

function PreviousIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg className="h-7 w-7" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg className="h-7 w-7" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
    </svg>
  );
}

function NextIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
    </svg>
  );
}

export default function SpeakerOnePage() {
  const {
    connected,
    status,
    volume,
    source,
    availableSources,
    health,
    spotify,
    setVolume,
    setSource,
    shutdown,
    restart,
    freezeSpotifyProgress,
  } = useMQTT();

  const spotifyControl = useSpotify();

  const nowPlayingInfo: NowPlayingInfo = {
    track: spotify.track,
    artist: spotify.artist,
    album: spotify.album,
    artwork: spotify.artwork,
    durationMs: spotify.duration,
    positionMs: spotify.position,
    state: spotifyControl.playing
      ? 'playing'
      : spotifyControl.playing === false && spotify.state === 'playing'
        ? 'paused'
        : spotify.state,
  };

  const spotifyActions = {
    playPause: () => {
      freezeSpotifyProgress(false);
      return spotifyControl.playPause();
    },
    next: () => {
      freezeSpotifyProgress(true);
      return spotifyControl.next();
    },
    previous: () => {
      freezeSpotifyProgress(true);
      return spotifyControl.previous();
    },
  };

  const showNowPlaying = Boolean(spotify.track) && spotify.state !== 'idle';
  const spotifyVolumeLevel = Number.isFinite(spotifyControl.volume)
    ? Math.round(spotifyControl.volume)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-5xl font-bold text-white">Ru Speaker</h1>
          <ConnectionBadge connected={connected} />
        </header>

        <Card>
          <SpeakerStatus
            connected={connected}
            status={status}
            descriptionLabel="State"
            className="text-lg capitalize"
          />
        </Card>

        {showNowPlaying && (
          <Card>
            <SpeakerNowPlaying
              info={nowPlayingInfo}
              actions={spotifyActions}
              hideWhenIdle={false}
              playLabel={<PlayIcon />}
              pauseLabel={<PauseIcon />}
              nextLabel={<NextIcon />}
              previousLabel={<PreviousIcon />}
            />
          </Card>
        )}

        {!spotifyControl.authenticated && (
          <Card>
            <div className="flex justify-center">
              <button
                type="button"
                onClick={spotifyControl.login}
                className="inline-flex items-center gap-2 rounded-xl bg-green-500 px-8 py-3 font-semibold text-white transition-colors hover:bg-green-600"
              >
                <Music size={20} />
                <span>Connect Spotify</span>
              </button>
            </div>
          </Card>
        )}

        <Card>
          <div className="space-y-4 text-gray-300">
            <p className="text-sm uppercase tracking-wide text-gray-400">Speaker Volume</p>
            <SpeakerVolume
              volume={volume}
              onChange={setVolume}
            />
          </div>
        </Card>

        <Card>
          <SpotifyVolumeControl
            volume={spotifyVolumeLevel}
            onChange={spotifyControl.setVolume}
            authenticated={spotifyControl.authenticated}
          />
        </Card>

        <Card>
          <SpeakerSourceSelector
            sources={availableSources}
            selectedSource={source}
            onSelect={setSource}
          />
        </Card>

        {health && (
          <Card>
            <SpeakerSystemHealth
              health={health}
            />
          </Card>
        )}

        <Card>
          <SpeakerPowerControls
            onRestart={restart}
            onShutdown={shutdown}
          />
        </Card>
      </div>
    </div>
  );
}
