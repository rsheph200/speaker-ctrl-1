'use client';

import { useEffect, useState, useRef } from 'react';

interface SpotifyState {
  authenticated: boolean;
  playing: boolean;
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
          setState(prev => ({ ...prev, authenticated: false }));
          return;
        }

        const data = await res.json();
        lastFetchTime.current = Date.now();
        lastServerProgress.current = data.progress || 0;
        setState(prev => ({ ...prev, authenticated: true, ...data }));
      } catch (error) {
        console.error('Failed to fetch now playing:', error);
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

  const playPause = async () => {
    try {
      const newPlayingState = !state.playing;
      
      // 🔥 KEY FIX: Notify MQTT to block updates BEFORE making the API call
      notifySpotifyApiCall();
      
      // Optimistically update UI
      setState(prev => ({ ...prev, playing: newPlayingState }));

      await fetch('/api/spotify/play-pause', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playing: newPlayingState }),
      });

      // Refresh state after Spotify has had time to update
      setTimeout(async () => {
        try {
          const res = await fetch('/api/spotify/now-playing');
          if (res.ok) {
            const data = await res.json();
            lastFetchTime.current = Date.now();
            lastServerProgress.current = data.progress || 0;
            setState(prev => ({ ...prev, authenticated: true, ...data }));
          }
        } catch (error) {
          console.error('Failed to refresh state:', error);
        }
      }, 300);
    } catch (error) {
      console.error('Failed to play/pause:', error);
      setState(prev => ({ ...prev, playing: !prev.playing }));
    }
  };

  const next = async () => {
    try {
      notifySpotifyApiCall(); // Block MQTT updates
      
      await fetch('/api/spotify/next', { method: 'POST' });
      
      setTimeout(async () => {
        try {
          const res = await fetch('/api/spotify/now-playing');
          if (res.ok) {
            const data = await res.json();
            lastFetchTime.current = Date.now();
            lastServerProgress.current = data.progress || 0;
            setState(prev => ({ ...prev, authenticated: true, ...data }));
          }
        } catch (error) {
          console.error('Failed to refresh state:', error);
        }
      }, 500);
    } catch (error) {
      console.error('Failed to skip:', error);
    }
  };

  const previous = async () => {
    try {
      notifySpotifyApiCall(); // Block MQTT updates
      
      await fetch('/api/spotify/previous', { method: 'POST' });
      
      setTimeout(async () => {
        try {
          const res = await fetch('/api/spotify/now-playing');
          if (res.ok) {
            const data = await res.json();
            lastFetchTime.current = Date.now();
            lastServerProgress.current = data.progress || 0;
            setState(prev => ({ ...prev, authenticated: true, ...data }));
          }
        } catch (error) {
          console.error('Failed to refresh state:', error);
        }
      }, 500);
    } catch (error) {
      console.error('Failed to go back:', error);
    }
  };

  return { ...state, login, playPause, next, previous };
}