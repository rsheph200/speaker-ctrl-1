'use client';

import { useEffect, useState, useCallback } from 'react';
import mqtt, { MqttClient } from 'mqtt';

interface MQTTState {
  connected: boolean;
  status: string;
  volume: number;
  source: string;
  availableSources: string[];
  health: any;
  spotify: {
    track: string;
    artist: string;
    album: string;
    trackId: string;
    duration: number;
    position: number;
    state: 'playing' | 'paused' | 'stopped' | 'idle';
    volume: number;
    artwork: string;
    timestamp: number;
  };
}

export function useMQTT() {
  const [client, setClient] = useState<MqttClient | null>(null);
  const [state, setState] = useState<MQTTState>({
    connected: false,
    status: 'offline',
    volume: 50,
    source: 'spotify',
    availableSources: ['spotify', 'line-in', 'aux', 'bluetooth'],
    health: null,
    spotify: {
      track: '',
      artist: '',
      album: '',
      trackId: '',
      duration: 0,
      position: 0,
      state: 'idle',
      volume: 50,
      artwork: '',
      timestamp: 0,
    },
  });

  const [smoothPosition, setSmoothPosition] = useState(0);

  useEffect(() => {
    const mqttClient = mqtt.connect('ws://192.168.0.199:9001/mqtt', {
      reconnectPeriod: 1000,
      connectTimeout: 30000,
    });

    mqttClient.on('connect', () => {
      console.log('Connected to MQTT broker');
      setState(prev => ({ ...prev, connected: true }));
      mqttClient.subscribe('ruspeaker/#');
    });

    mqttClient.on('message', (topic: string, payload: Buffer) => {
      const message = payload.toString();

      // Non-Spotify topics
      if (topic === 'ruspeaker/status') {
        setState(prev => ({ ...prev, status: message }));
      } else if (topic === 'ruspeaker/volume') {
        setState(prev => ({ ...prev, volume: parseInt(message) }));
      } else if (topic === 'ruspeaker/source/current') {
        setState(prev => ({ ...prev, source: message }));
      } else if (topic === 'ruspeaker/source/available') {
        setState(prev => ({ ...prev, availableSources: JSON.parse(message) }));
      } else if (topic === 'ruspeaker/health') {
        try {
          setState(prev => ({ ...prev, health: JSON.parse(message) }));
        } catch (error) {
          console.error('Failed to parse health JSON:', message, error);
        }
      }
      // USE STATE_UNIFIED - single source of truth
      else if (topic === 'ruspeaker/spotify/state_unified') {
        try {
          const unified = JSON.parse(message);
          
          // Handle both playing and paused states
          if (unified.current) {
            setState(prev => ({
              ...prev,
              spotify: {
                track: unified.current.track || '',
                artist: unified.current.artist || '',
                album: unified.current.album || '',
                trackId: unified.current.trackId || '',
                duration: (unified.current.duration || 0) * 1000, // Convert seconds to ms
                position: (unified.current.position || 0) * 1000, // Convert seconds to ms
                state: unified.current.isPlaying ? 'playing' : 'paused',
                volume: prev.spotify.volume, // Keep existing volume
                artwork: unified.current.albumArt || '',
                timestamp: Date.now(), // ← Use NOW, not server timestamp
              }
            }));
            
            // Reset smooth position to actual
            setSmoothPosition((unified.current.position || 0) * 1000);
            
            console.log('📊 Unified state update:', {
              track: unified.current.track,
              position: unified.current.position,
              isPlaying: unified.current.isPlaying,
              timestamp: unified.timestamp
            });
          }
        } catch (error) {
          console.error('Failed to parse state_unified:', error);
        }
      }
      // Still handle volume separately
      else if (topic === 'ruspeaker/spotify/volume') {
        setState(prev => ({ 
          ...prev, 
          spotify: { ...prev.spotify, volume: parseInt(message) || 0 }
        }));
      }
    });

    mqttClient.on('error', (error) => {
      console.error('MQTT Error:', error);
      setState(prev => ({ ...prev, connected: false }));
    });

    setClient(mqttClient);

    return () => {
      mqttClient.end();
    };
  }, []);

  // Smooth progress when playing
  useEffect(() => {
    if (state.spotify.state !== 'playing' || state.spotify.duration === 0) {
      return;
    }

    const interval = setInterval(() => {
      setSmoothPosition(prev => {
        const now = Date.now();
        const timeSinceUpdate = now - state.spotify.timestamp;
        const calculatedPosition = state.spotify.position + timeSinceUpdate;
        
        // Don't exceed duration
        if (calculatedPosition >= state.spotify.duration) {
          return state.spotify.duration;
        }
        
        return calculatedPosition;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [state.spotify.state, state.spotify.position, state.spotify.timestamp, state.spotify.duration]);

  // When paused, use exact position
  useEffect(() => {
    if (state.spotify.state === 'paused') {
      setSmoothPosition(state.spotify.position);
    }
  }, [state.spotify.state, state.spotify.position]);

  const setVolume = useCallback((volume: number) => {
    if (client) {
      client.publish('ruspeaker/command/volume', volume.toString());
    }
  }, [client]);

  const setSource = useCallback((source: string) => {
    if (client) {
      client.publish('ruspeaker/command/source', source);
    }
  }, [client]);

  const shutdown = useCallback(() => {
    if (client) {
      client.publish('ruspeaker/command/shutdown', 'now');
    }
  }, [client]);

  const restart = useCallback(() => {
    if (client) {
      client.publish('ruspeaker/command/restart', 'now');
    }
  }, [client]);

  return {
    ...state,
    spotify: {
      ...state.spotify,
      position: smoothPosition,
    },
    setVolume,
    setSource,
    shutdown,
    restart,
  };
}