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
  
  // Track when we last fetched to calculate smooth progress
  const lastFetchTime = useRef<number>(Date.now());
  const lastServerProgress = useRef<number>(0);

  const login = () => {
    window.location.href = '/api/spotify/auth';
  };

  // Fetch now playing every 2 seconds instead of 5
  useEffect(() => {
    const fetchNowPlaying = async () => {
      try {
        const res = await fetch('/api/spotify/now-playing');
        if (res.status === 401) {
          setState(prev => ({ ...prev, authenticated: false }));
          return;
        }

        const data = await res.json();
        
        // Store the server's progress and current time
        lastFetchTime.current = Date.now();
        lastServerProgress.current = data.progress || 0;
        
        setState(prev => ({ ...prev, authenticated: true, ...data }));
      } catch (error) {
        console.error('Failed to fetch now playing:', error);
      }
    };

    fetchNowPlaying();
    const interval = setInterval(fetchNowPlaying, 2000); // Changed from 5000 to 2000
    return () => clearInterval(interval);
  }, []);

  // Smooth progress ticker - updates every 100ms for smooth animation
  useEffect(() => {
    let ticker: NodeJS.Timeout | undefined;
    
    if (state.playing && typeof state.duration === 'number') {
      ticker = setInterval(() => {
        setState(prev => {
          if (!prev.playing || typeof prev.duration !== 'number') {
            return prev;
          }
          
          // Calculate how much time has passed since last server update
          const timeSinceLastFetch = Date.now() - lastFetchTime.current;
          const estimatedProgress = lastServerProgress.current + timeSinceLastFetch;
          
          // Clamp to duration
          const clampedProgress = Math.min(estimatedProgress, prev.duration);
          
          return {
            ...prev,
            progress: clampedProgress,
          };
        });
      }, 100); // Update every 100ms for smooth progress bar
    }
    
    return () => ticker && clearInterval(ticker);
  }, [state.playing, state.duration]);

  const playPause = async () => {
    try {
      const newPlayingState = !state.playing;
      
      // Optimistically update UI
      setState(prev => ({ ...prev, playing: newPlayingState }));

      await fetch('/api/spotify/play-pause', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playing: newPlayingState }),
      });

      // Refresh state after a short delay
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
      // Revert optimistic update on error
      setState(prev => ({ ...prev, playing: !prev.playing }));
    }
  };

  const next = async () => {
    try {
      await fetch('/api/spotify/next', { method: 'POST' });
      
      // Immediately fetch new track info
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