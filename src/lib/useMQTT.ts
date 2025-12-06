'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import mqtt, { MqttClient } from 'mqtt';
import { useAppSettings } from '@/context/AppSettingsContext';
import {
  activateDummySpeaker,
  deactivateDummySpeaker,
  subscribeToDummySpeaker,
  updateDummySpeakerVolume,
  updateDummySource,
  dummyShutdown,
  dummyRestart,
  dummyFreezeSpotifyProgress,
} from './dummy/speakerService';

export interface MQTTState {
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
    duration: number; // in milliseconds
    position: number; // in milliseconds
    rawPosition: number; // latest raw position from MQTT
    state: 'playing' | 'paused' | 'stopped' | 'idle';
    volume: number;
    artwork: string;
    timestamp: number;
    serverTimestamp: number | null;
    progressFrozen: boolean;
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
      rawPosition: 0,
      state: 'idle',
      volume: 50,
      artwork: '',
      timestamp: 0,
      serverTimestamp: null,
      progressFrozen: false,
    },
  });

  const { dummyMode } = useAppSettings();
  const dummyUnsubscribeRef = useRef<(() => void) | null>(null);
  const freezeTimeoutRef = useRef<number | null>(null);

  const clearFreezeTimeout = useCallback(() => {
    if (freezeTimeoutRef.current !== null) {
      window.clearTimeout(freezeTimeoutRef.current);
      freezeTimeoutRef.current = null;
    }
  }, []);

  const scheduleFreezeFallback = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }

    clearFreezeTimeout();
    freezeTimeoutRef.current = window.setTimeout(() => {
      freezeTimeoutRef.current = null;
      setState(prev => {
        if (!prev.spotify.progressFrozen) {
          return prev;
        }

        return {
          ...prev,
          spotify: {
            ...prev.spotify,
            progressFrozen: false,
            timestamp: Date.now(),
          },
        };
      });
    }, 2500);
  }, [clearFreezeTimeout]);

  const mqttDebug = process.env.NEXT_PUBLIC_MQTT_DEBUG === 'true';

  const toMilliseconds = (value: number) => {
    if (!Number.isFinite(value) || value <= 0) {
      return 0;
    }

    return value > 1000 ? value : value * 1000;
  };

  const normalizeTimestamp = (value: number) => {
    if (!Number.isFinite(value) || value <= 0) {
      return null;
    }

    // Values larger than 1e11 are already in milliseconds. Otherwise assume seconds.
    return value > 1e11 ? value : value * 1000;
  };

  const adjustPositionWithTimestamp = (
    rawPosition: number,
    duration: number,
    serverTimestamp: number | null,
    now: number,
  ) => {
    if (!Number.isFinite(rawPosition) || rawPosition < 0) {
      return 0;
    }

    let adjustedPosition = rawPosition;

    if (serverTimestamp && serverTimestamp <= now) {
      const delta = now - serverTimestamp;
      if (delta > 0) {
        adjustedPosition += delta;
      }
    }

    if (duration > 0) {
      adjustedPosition = Math.min(adjustedPosition, duration);
    }

    return adjustedPosition;
  };

  useEffect(() => {
    if (!dummyMode) {
      if (dummyUnsubscribeRef.current) {
        dummyUnsubscribeRef.current();
        dummyUnsubscribeRef.current = null;
      }
      deactivateDummySpeaker();
      return;
    }

    activateDummySpeaker();
    const unsubscribe = subscribeToDummySpeaker(next => {
      setState(next.mqtt);
    });
    dummyUnsubscribeRef.current = unsubscribe;
    setClient(null);

    return () => {
      unsubscribe();
      dummyUnsubscribeRef.current = null;
    };
  }, [dummyMode]);

  useEffect(() => {
    if (dummyMode) {
      return;
    }

    const brokerUrl = process.env.NEXT_PUBLIC_MQTT_URL;

    if (!brokerUrl) {
      console.error('NEXT_PUBLIC_MQTT_URL is not defined');
      return;
    }

    if (mqttDebug) {
      console.debug('[MQTT] Connecting to broker', brokerUrl);
    }

    const mqttClient = mqtt.connect(brokerUrl, {
      reconnectPeriod: 1000,
      connectTimeout: 30000,
    });

    mqttClient.on('connect', () => {
      if (mqttDebug) {
        console.debug('[MQTT] Connected');
      }
      setState(prev => ({ ...prev, connected: true }));
      mqttClient.subscribe('ruspeaker/#');
    });

    mqttClient.on('reconnect', () => {
      if (mqttDebug) {
        console.debug('[MQTT] Reconnecting…');
      }
    });

    mqttClient.on('close', () => {
      if (mqttDebug) {
        console.debug('[MQTT] Connection closed');
      }
      setState(prev => ({ ...prev, connected: false }));
    });

    mqttClient.on('offline', () => {
      if (mqttDebug) {
        console.debug('[MQTT] Broker offline');
      }
      setState(prev => ({ ...prev, connected: false }));
    });

    mqttClient.on('message', (topic: string, payload: Buffer) => {
      const message = payload.toString();
      if (mqttDebug) {
        console.debug('[MQTT] Message', topic, message);
      }

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
          spotify: prev.spotify.trackId === message
            ? prev.spotify
            : {
                ...prev.spotify,
                trackId: message,
                position: 0,
                rawPosition: 0,
                progressFrozen: true,
                timestamp: 0,
                serverTimestamp: null,
              }
        }));
      } else if (topic === 'ruspeaker/spotify/duration') {
        const parsed = parseInt(message, 10) || 0;
        const duration = toMilliseconds(parsed);

        setState(prev => ({ 
          ...prev, 
          spotify: { ...prev.spotify, duration }
        }));
      } else if (topic === 'ruspeaker/spotify/position') {
        const parsed = parseInt(message, 10) || 0;
        const position = toMilliseconds(parsed);

        setState(prev => {
          const now = Date.now();
          const adjustedPosition = adjustPositionWithTimestamp(
            position,
            prev.spotify.duration,
            prev.spotify.serverTimestamp,
            now,
          );
          const resetAllowed =
            prev.spotify.progressFrozen || (position === 0 && prev.spotify.position <= 250);
          const safePosition = resetAllowed
            ? adjustedPosition
            : Math.max(adjustedPosition, prev.spotify.position);

          return { 
            ...prev, 
            spotify: {
              ...prev.spotify,
              position: safePosition,
              rawPosition: position,
              timestamp: now,
              serverTimestamp: prev.spotify.serverTimestamp,
              progressFrozen: false,
            },
          };
        });
        clearFreezeTimeout();
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
      } else if (topic === 'ruspeaker/spotify/artwork') {
        setState(prev => ({ 
          ...prev, 
          spotify: { ...prev.spotify, artwork: message }
        }));
      } else if (topic === 'ruspeaker/spotify/timestamp') {
        const parsed = parseInt(message, 10);
        const serverTimestamp = normalizeTimestamp(parsed) ?? Date.now();

        setState(prev => {
          const now = Date.now();
          const basePosition = Number.isFinite(prev.spotify.rawPosition)
            ? prev.spotify.rawPosition
            : prev.spotify.position;
          const adjustedPosition = adjustPositionWithTimestamp(
            basePosition,
            prev.spotify.duration,
            serverTimestamp,
            now,
          );
          const resetAllowed =
            prev.spotify.progressFrozen || (basePosition === 0 && prev.spotify.position <= 250);
          const safePosition = resetAllowed
            ? adjustedPosition
            : Math.max(adjustedPosition, prev.spotify.position);

          return { 
            ...prev, 
            spotify: {
              ...prev.spotify,
              serverTimestamp,
              position: safePosition,
              timestamp: now,
              progressFrozen: false,
            },
          };
        });
        clearFreezeTimeout();
      }
    });

    mqttClient.on('error', (error) => {
      if (mqttDebug) {
        console.error('[MQTT] Error', error);
      } else {
        console.error('MQTT Error:', error);
      }
      setState(prev => ({ ...prev, connected: false }));
    });

    setClient(mqttClient);

    return () => {
      mqttClient.end();
      setClient(null);
    };
  }, [dummyMode]);

  const setVolume = useCallback((volume: number) => {
    if (dummyMode) {
      updateDummySpeakerVolume(volume);
      return;
    }

    if (client) {
      client.publish('ruspeaker/command/volume', volume.toString());
    }
  }, [client, dummyMode]);

  const setSource = useCallback((source: string) => {
    if (dummyMode) {
      updateDummySource(source);
      return;
    }

    if (client) {
      client.publish('ruspeaker/command/source', source);
    }
  }, [client, dummyMode]);

  const shutdown = useCallback(() => {
    if (dummyMode) {
      dummyShutdown();
      return;
    }

    if (client) {
      client.publish('ruspeaker/command/shutdown', 'now');
    }
  }, [client, dummyMode]);

  const restart = useCallback(() => {
    if (dummyMode) {
      dummyRestart();
      return;
    }

    if (client) {
      client.publish('ruspeaker/command/restart', 'now');
    }
  }, [client, dummyMode]);

  const freezeSpotifyProgress = useCallback((resetPosition = false) => {
    scheduleFreezeFallback();

    if (dummyMode) {
      dummyFreezeSpotifyProgress(resetPosition);
      return;
    }

    setState(prev => ({
      ...prev,
      spotify: {
        ...prev.spotify,
        progressFrozen: true,
        timestamp: 0,
        position: resetPosition ? 0 : prev.spotify.position,
        rawPosition: resetPosition ? 0 : prev.spotify.rawPosition,
        serverTimestamp: null,
      },
    }));
  }, [dummyMode, scheduleFreezeFallback]);

  // Client-side progress tracking for smooth progress bar
  useEffect(() => {
    if (dummyMode) {
      return;
    }

    if (
      state.spotify.state !== 'playing' ||
      state.spotify.duration === 0 ||
      state.spotify.progressFrozen
    ) {
      return;
    }

    const interval = setInterval(() => {
      setState(prev => {
        if (
          prev.spotify.state !== 'playing' ||
          prev.spotify.timestamp === 0 ||
          prev.spotify.progressFrozen
        ) {
          return prev;
        }

        const now = Date.now();
        const elapsed = now - prev.spotify.timestamp;

        if (elapsed <= 0) {
          return prev;
        }

        const projectedPosition = prev.spotify.position + elapsed;
        const clampedPosition = Math.min(projectedPosition, prev.spotify.duration);

        if (clampedPosition >= prev.spotify.duration) {
          return {
            ...prev,
            spotify: { ...prev.spotify, position: prev.spotify.duration, timestamp: now }
          };
        }

        return {
          ...prev,
          spotify: { ...prev.spotify, position: clampedPosition, timestamp: now }
        };
      });
    }, 100); // Update every 100ms for smooth progress

    return () => clearInterval(interval);
  }, [
    state.spotify.state,
    state.spotify.timestamp,
    state.spotify.duration,
    state.spotify.progressFrozen,
    dummyMode,
  ]);

  useEffect(() => {
    return () => {
      clearFreezeTimeout();
    };
  }, [clearFreezeTimeout]);

  return {
    ...state,
    setVolume,
    setSource,
    shutdown,
    restart,
    freezeSpotifyProgress,
  };
}
