'use client';

import { useEffect, useState } from 'react';

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

  const login = () => {
    window.location.href = '/api/spotify/auth';
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
        setState(prev => ({ ...prev, authenticated: true, ...data }));
      } catch (error) {
        console.error('Failed to fetch now playing:', error);
      }
    };

    // Check immediately
    fetchNowPlaying();

    // Poll every 5 seconds
    const interval = setInterval(fetchNowPlaying, 5000);

    return () => clearInterval(interval);
  }, []);

  
  const playPause = async () => {
    try {
      // Optimistically update UI immediately
      const newPlayingState = !state.playing;
      setState(prev => ({ ...prev, playing: newPlayingState }));
      
      await fetch('/api/spotify/play-pause', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playing: state.playing }),
      });
      
      // Force immediate refresh after 500ms to sync with Spotify
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
      // Revert optimistic update on error
      setState(prev => ({ ...prev, playing: !prev.playing }));
    }
  };

  const next = async () => {
    try {
      await fetch('/api/spotify/next', { method: 'POST' });
      
      // Force immediate refresh to show new track
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
      console.error('Failed to skip:', error);
    }
  };
  
  const previous = async () => {
    try {
      await fetch('/api/spotify/previous', { method: 'POST' });
      
      // Force immediate refresh to show new track
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
      console.error('Failed to go back:', error);
    }
  };

  return { ...state, login, playPause, next, previous };
}