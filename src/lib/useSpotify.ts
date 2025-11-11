'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

interface SpotifyState {
  authenticated: boolean;
  playing: boolean;
  pendingPlaying: boolean | null;
  pendingExpiresAt: number | null;
  volume: number;
  track?: string;
  artist?: string;
  album?: string;
  albumArt?: string;
  progress?: number;
  duration?: number;
}

export function useSpotify() {
  const [state, setState] = useState<SpotifyState>({
    authenticated: false,
    playing: false,
    pendingPlaying: null,
    pendingExpiresAt: null,
    volume: 50,
  });
  
  const lastFetchTime = useRef<number>(Date.now());
  const lastServerProgress = useRef<number>(0);

  const login = () => {
    window.location.href = '/api/spotify/auth';
  };

  // Helper to notify MQTT hook about API calls
  const notifySpotifyApiCall = () => {
    window.dispatchEvent(new Event('spotify-api-call'));
  };

  useEffect(() => {
    const fetchNowPlaying = async () => {
      try {
        const res = await fetch('/api/spotify/now-playing');
        if (res.status === 401) {
          setState(prev => ({
            ...prev,
            authenticated: false,
            pendingPlaying: null,
            pendingExpiresAt: null,
          }));
          return;
        }

        const data = await res.json();
        lastFetchTime.current = Date.now();
        lastServerProgress.current = data.progress || 0;
        
        setState(prev => {
          const nextPlaying =
            typeof data.playing === 'boolean' ? data.playing : prev.playing;
          const nextVolume =
            typeof data.volume === 'number' ? data.volume : prev.volume;

          return {
            ...prev,
            authenticated: true,
            ...data,
            playing: nextPlaying,
            volume: nextVolume,
          };
        });
      } catch (error) {
      }
    };

    fetchNowPlaying();
    const interval = setInterval(fetchNowPlaying, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let ticker: NodeJS.Timeout | undefined;
    
    if (state.playing && typeof state.duration === 'number') {
      ticker = setInterval(() => {
        setState(prev => {
          if (!prev.playing || typeof prev.duration !== 'number') {
            return prev;
          }
          
          const timeSinceLastFetch = Date.now() - lastFetchTime.current;
          const estimatedProgress = lastServerProgress.current + timeSinceLastFetch;
          const clampedProgress = Math.min(estimatedProgress, prev.duration);
          
          return {
            ...prev,
            progress: clampedProgress,
          };
        });
      }, 100);
    }
    
    return () => ticker && clearInterval(ticker);
  }, [state.playing, state.duration]);

  useEffect(() => {
    if (state.pendingExpiresAt === null) {
      return;
    }

    const delay = Math.max(0, state.pendingExpiresAt - Date.now());
    const timeout = window.setTimeout(() => {
      setState(prev => ({
        ...prev,
        pendingPlaying: null,
        pendingExpiresAt: null,
      }));
    }, delay);

    return () => window.clearTimeout(timeout);
  }, [state.pendingExpiresAt]);

  const refreshNowPlaying = async (delay = 300) => {
    setTimeout(async () => {
      try {
        const res = await fetch('/api/spotify/now-playing');
        if (!res.ok) {
          return;
        }
        const data = await res.json();
        lastFetchTime.current = Date.now();
        lastServerProgress.current = data.progress || 0;
        setState(prev => {
          const nextPlaying =
            typeof data.playing === 'boolean' ? data.playing : prev.playing;
          const nextVolume =
            typeof data.volume === 'number' ? data.volume : prev.volume;

          return {
            ...prev,
            authenticated: true,
            ...data,
            playing: nextPlaying,
            volume: nextVolume,
          };
        });
      } catch (error) {
        console.error('Failed to refresh state:', error);
      }
    }, delay);
  };

  const playPause = async (targetPlaying?: boolean) => {
    const desiredPlaying =
      typeof targetPlaying === 'boolean' ? targetPlaying : !state.playing;
    const previousPlaying = state.playing;

    try {
      notifySpotifyApiCall();
      setState(prev => ({
        ...prev,
        playing: desiredPlaying,
        pendingPlaying: desiredPlaying,
        pendingExpiresAt: Date.now() + 1500,
      }));

      const response = await fetch('/api/spotify/play-pause', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playing: desiredPlaying }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Spotify play/pause failed (${response.status}): ${errorText || 'Unknown error'}`,
        );
      }

      refreshNowPlaying(300);
    } catch (error) {
      console.error('Failed to play/pause:', error);
      setState(prev => ({
        ...prev,
        playing: previousPlaying,
        pendingPlaying: null,
        pendingExpiresAt: null,
      }));
    }
  };

  const next = async () => {
    try {
      notifySpotifyApiCall(); // Block MQTT updates
      
      const response = await fetch('/api/spotify/next', { method: 'POST' });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Spotify next failed (${response.status}): ${errorText || 'Unknown error'}`);
      }
      
      refreshNowPlaying(500);
    } catch (error) {
      console.error('Failed to skip:', error);
    }
  };

  const previous = async () => {
    try {
      notifySpotifyApiCall(); // Block MQTT updates
      
      const response = await fetch('/api/spotify/previous', { method: 'POST' });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Spotify previous failed (${response.status}): ${errorText || 'Unknown error'}`,
        );
      }
      
      refreshNowPlaying(500);
    } catch (error) {
      console.error('Failed to go back:', error);
    }
  };

  const setVolume = async (volume: number) => {
    const clamped = Math.min(Math.max(Math.round(volume), 0), 100);

    // Optimistically update UI
    setState(prev => ({ ...prev, volume: clamped }));

    try {
      const response = await fetch('/api/spotify/volume', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ volume: clamped }),
      });

      if (!response.ok) {
        throw new Error(`Failed to set volume: ${response.status}`);
      }

      lastFetchTime.current = Date.now();
      lastServerProgress.current = state.progress ?? 0;
    } catch (error) {
      console.error('Failed to set Spotify volume:', error);
      // Revert to previous volume on error
      setState(prev => ({ ...prev, volume: state.volume }));
    }
  };

  const acknowledgePendingPlaying = useCallback(() => {
    setState(prev => ({
      ...prev,
      pendingPlaying: null,
      pendingExpiresAt: null,
    }));
  }, []);

  return {
    ...state,
    login,
    playPause,
    next,
    previous,
    setVolume,
    acknowledgePendingPlaying,
  };
}
