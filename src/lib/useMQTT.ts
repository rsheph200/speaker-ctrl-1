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
  // ADD THIS - Spotify state
  spotify: {
    track: string;
    artist: string;
    album: string;
    trackId: string;
    duration: number; // in milliseconds
    position: number; // in milliseconds
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
    // INITIAL Spotify state
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

  useEffect(() => {
    // Connect to MQTT broker on your Pi
    const mqttClient = mqtt.connect('ws://192.168.0.199:9001/mqtt', {
      reconnectPeriod: 1000,
      connectTimeout: 30000,
    });

    mqttClient.on('connect', () => {
      console.log('Connected to MQTT broker');
      setState(prev => ({ ...prev, connected: true }));

      // Subscribe to all ruspeaker topics
      mqttClient.subscribe('ruspeaker/#');
    });

    mqttClient.on('message', (topic: string, payload: Buffer) => {
      const message = payload.toString();
      console.log(`Received: ${topic} = ${message}`);

      // Update state based on topic
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
      // ADD THIS - Spotify topic handlers
      else if (topic === 'ruspeaker/spotify/track') {
        setState(prev => ({ 
          ...prev, 
          spotify: { ...prev.spotify, track: message }
        }));
      } else if (topic === 'ruspeaker/spotify/artist') {
        setState(prev => ({ 
          ...prev, 
          spotify: { ...prev.spotify, artist: message }
        }));
      } else if (topic === 'ruspeaker/spotify/album') {
        setState(prev => ({ 
          ...prev, 
          spotify: { ...prev.spotify, album: message }
        }));
      } else if (topic === 'ruspeaker/spotify/track_id') {
        setState(prev => ({ 
          ...prev, 
          spotify: { ...prev.spotify, trackId: message }
        }));
      } else if (topic === 'ruspeaker/spotify/duration') {
        setState(prev => ({ 
          ...prev, 
          spotify: { ...prev.spotify, duration: parseInt(message) || 0 }
        }));
      } else if (topic === 'ruspeaker/spotify/position') {
        setState(prev => ({ 
          ...prev, 
          spotify: { ...prev.spotify, position: parseInt(message) || 0 }
        }));
      } else if (topic === 'ruspeaker/spotify/state') {
        setState(prev => ({ 
          ...prev, 
          spotify: { ...prev.spotify, state: message as any }
        }));
      } else if (topic === 'ruspeaker/spotify/volume') {
        setState(prev => ({ 
          ...prev, 
          spotify: { ...prev.spotify, volume: parseInt(message) || 0 }
        }));
      }
      else if (topic === 'ruspeaker/spotify/artwork') {
        setState(prev => ({ 
          ...prev, 
          spotify: { ...prev.spotify, artwork: message }
        }));
      } else if (topic === 'ruspeaker/spotify/timestamp') {
        setState(prev => ({ 
          ...prev, 
          spotify: { ...prev.spotify, timestamp: parseInt(message) || 0 }
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

  // Command functions
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

  // Client-side progress tracking for smooth progress bar
useEffect(() => {
  if (state.spotify.state !== 'playing' || state.spotify.duration === 0) {
    return;
  }

  const interval = setInterval(() => {
    setState(prev => {
      if (prev.spotify.state !== 'playing' || prev.spotify.timestamp === 0) {
        return prev;
      }

      // Calculate elapsed time since last timestamp
      const now = Date.now();
      const elapsed = now - prev.spotify.timestamp;
      const newPosition = prev.spotify.position + elapsed;

      // Don't exceed duration
      if (newPosition >= prev.spotify.duration) {
        return {
          ...prev,
          spotify: { ...prev.spotify, position: prev.spotify.duration }
        };
      }

      return {
        ...prev,
        spotify: { ...prev.spotify, position: newPosition }
      };
    });
  }, 100); // Update every 100ms for smooth progress

  return () => clearInterval(interval);
}, [state.spotify.state, state.spotify.timestamp, state.spotify.duration]);

  return {
    ...state,
    setVolume,
    setSource,
    shutdown,
    restart,
  };
}