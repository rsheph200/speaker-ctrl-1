'use client';

import { useEffect, useState } from 'react';

interface SpotifyState {
  authenticated: boolean;
  playing: boolean;
  track?: string;
  artist?: string;
  album?: string;
  albumArt?: string;
  /** Current playback progress in milliseconds. */
  progress?: number;
  /** Total length of the track in milliseconds. */
  duration?: number;
}

export function useSpotify() {
  const [state, setState] = useState<SpotifyState>({
    authenticated: false,
    playing: false,
  });

  /** Kick off the OAuth flow */
  const login = () => {
    window.location.href = '/api/spotify/auth';
  };

  /** Poll the backend every 5s to refresh what’s currently playing. */
  useEffect(() => {
    const fetchNowPlaying = async () => {
      try {
        const res = await fetch('/api/spotify/now-playing');
        if (res.status === 401) {
          setState(prev => ({ ...prev, authenticated: false }));
          return;
        }

        const data = await res.json();
        setState(prev => ({ ...prev, authenticated: true, ...data }));
      } catch (error) {
        console.error('Failed to fetch now playing:', error);
      }
    };

    fetchNowPlaying();
    const interval = setInterval(fetchNowPlaying, 5000);
    return () => clearInterval(interval);
  }, []);

  /**
   * Local ticker to keep the progress bar smooth.  When a track is playing,
   * increment the progress every second until you hit the track’s duration.
   */
  useEffect(() => {
    let ticker: NodeJS.Timeout | undefined;
    if (
      state.playing &&
      typeof state.progress === 'number' &&
      typeof state.duration === 'number'
    ) {
      ticker = setInterval(() => {
        setState(prev => {
          // If paused mid‑tick or data missing, don’t advance.
          if (
            !prev.playing ||
            typeof prev.progress !== 'number' ||
            typeof prev.duration !== 'number'
          ) {
            return prev;
          }
          const nextProgress = prev.progress + 1000;
          return {
            ...prev,
            progress: Math.min(nextProgress, prev.duration),
          };
        });
      }, 1000);
    }
    return () => ticker && clearInterval(ticker);
  }, [state.playing, state.progress, state.duration]);

  /** Toggle playback.  Send the NEW state to the backend rather than the old one. */
  const playPause = async () => {
    try {
      const newPlayingState = !state.playing;
      setState(prev => ({ ...prev, playing: newPlayingState }));

      await fetch('/api/spotify/play-pause', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playing: newPlayingState }),
      });

      // After a short delay, refresh the now-playing info.
      setTimeout(async () => {
        try {
          const res = await fetch('/api/spotify/now-playing');
          if (res.ok) {
            const data = await res.json();
            setState(prev => ({ ...prev, authenticated: true, ...data }));
          }
        } catch (error) {
          console.error('Failed to refresh state:', error);
        }
      }, 500);
    } catch (error) {
      console.error('Failed to play/pause:', error);
      setState(prev => ({ ...prev, playing: !prev.playing }));
    }
  };

  /** Skip to the next track and refresh the now-playing info. */
  const next = async () => {
    try {
      await fetch('/api/spotify/next', { method: 'POST' });

      // Wait a full second to allow Spotify to update the track before fetching.
      setTimeout(async () => {
        try {
          const res = await fetch('/api/spotify/now-playing');
          if (res.ok) {
            const data = await res.json();
            setState(prev => ({ ...prev, authenticated: true, ...data }));
          }
        } catch (error) {
          console.error('Failed to refresh state:', error);
        }
      }, 1000);
    } catch (error) {
      console.error('Failed to skip:', error);
    }
  };

  /** Go back to the previous track and refresh the now-playing info. */
  const previous = async () => {
    try {
      await fetch('/api/spotify/previous', { method: 'POST' });
      setTimeout(async () => {
        try {
          const res = await fetch('/api/spotify/now-playing');
          if (res.ok) {
            const data = await res.json();
            setState(prev => ({ ...prev, authenticated: true, ...data }));
          }
        } catch (error) {
          console.error('Failed to refresh state:', error);
        }
      }, 1000);
    } catch (error) {
      console.error('Failed to go back:', error);
    }
  };

  return { ...state, login, playPause, next, previous };
}
