"use client";

import type { MQTTState } from "../useMQTT";
import type { SpotifyState } from "../useSpotify";

type DummySnapshot = {
  mqtt: MQTTState;
  spotify: SpotifyState;
};

type Listener = (snapshot: DummySnapshot) => void;

type Track = {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  artwork: string;
};

const playlist: Track[] = [
  {
    id: "aea-sunlit-oath",
    title: "Sunlit Oath",
    artist: "All Ears Audio",
    album: "Satellite Drift",
    duration: 242_000,
    artwork: "/dummy-content/dummy-album-one.jpg",
  },
  {
    id: "aea-night-shift",
    title: "Night Shift Radio",
    artist: "Mara Fields",
    album: "Violet Hour",
    duration: 198_000,
    artwork: "/dummy-content/dummy-album-two.jpg",
  },
  {
    id: "aea-dust-loop",
    title: "Dust Loop",
    artist: "Stereo Bloom",
    album: "Partial Alignments",
    duration: 261_000,
    artwork: "/dummy-content/dummy-album-three.jpg",
  },
];

const baseHealth = {
  cpu_temp: 46,
  memory_usage_percent: 62,
  disk_usage_percent: 43,
  wifi_signal_dbm: -48,
  live: "3 hours, 16 minutes",
  uptime: "3 hours, 16 minutes",
};

let snapshot: DummySnapshot = createInitialSnapshot(0);
let listeners = new Set<Listener>();
let timerId: number | null = null;
let currentTrackIndex = 0;
let initialized = false;
let lastTick = Date.now();

function createInitialSnapshot(index: number): DummySnapshot {
  const track = playlist[index] ?? playlist[0];
  const now = Date.now();

  const mqttSpotify: MQTTState["spotify"] = {
    track: track.title,
    artist: track.artist,
    album: track.album,
    trackId: track.id,
    duration: track.duration,
    position: 0,
    rawPosition: 0,
    state: "playing",
    volume: 58,
    artwork: track.artwork,
    timestamp: now,
    serverTimestamp: now,
    progressFrozen: false,
  };

  const mqttState: MQTTState = {
    connected: true,
    status: "Dummy speaker ready",
    volume: 45,
    source: "spotify",
    availableSources: ["spotify", "line-in", "aux"],
    health: { ...baseHealth },
    spotify: mqttSpotify,
  };

  const spotifyState: SpotifyState = {
    authenticated: true,
    playing: true,
    pendingPlaying: null,
    pendingExpiresAt: null,
    volume: 65,
    track: track.title,
    artist: track.artist,
    album: track.album,
    albumArt: track.artwork,
    progress: 0,
    duration: track.duration,
  };

  return { mqtt: mqttState, spotify: spotifyState };
}

function emit() {
  listeners.forEach((listener) => listener(snapshot));
}

function updateSnapshot(updater: (prev: DummySnapshot) => DummySnapshot) {
  snapshot = updater(snapshot);
  emit();
}

function jitter(value: number, delta: number) {
  const next = value + (Math.random() - 0.5) * delta;
  return Math.round(next * 10) / 10;
}

function ensureTimer() {
  if (timerId !== null || typeof window === "undefined") {
    return;
  }

  lastTick = Date.now();
  timerId = window.setInterval(() => {
    const now = Date.now();
    const delta = now - lastTick;
    lastTick = now;
    let nextTrack: number | null = null;

    updateSnapshot((prev) => {
      const current = prev.mqtt.spotify;
      if (
        current.state !== "playing" ||
        current.duration === 0 ||
        current.progressFrozen
      ) {
        return prev;
      }

      let nextPosition = current.position + delta;
      if (nextPosition >= current.duration) {
        nextTrack = (currentTrackIndex + 1) % playlist.length;
        nextPosition = current.duration;
      }

      const nextHealth = {
        ...prev.mqtt.health,
        cpu_temp: jitter(baseHealth.cpu_temp, 0.8),
        memory_usage_percent: Math.min(
          100,
          Math.max(0, jitter(baseHealth.memory_usage_percent, 1.2))
        ),
        wifi_signal_dbm: jitter(baseHealth.wifi_signal_dbm, 1.5),
      };

      return {
        mqtt: {
          ...prev.mqtt,
          health: nextHealth,
          spotify: {
            ...current,
            position: nextPosition,
            rawPosition: nextPosition,
            timestamp: now,
            serverTimestamp: now,
          },
        },
        spotify: {
          ...prev.spotify,
          progress: nextPosition,
        },
      };
    });

    if (nextTrack !== null) {
      loadTrack(nextTrack);
    }
  }, 750);
}

function stopTimer() {
  if (timerId !== null && typeof window !== "undefined") {
    window.clearInterval(timerId);
    timerId = null;
  }
}

function loadTrack(index: number) {
  currentTrackIndex = (index + playlist.length) % playlist.length;
  const track = playlist[currentTrackIndex] ?? playlist[0];
  const now = Date.now();

  updateSnapshot((prev) => {
    const playing = prev.spotify.playing;
    const playbackState = playing ? "playing" : "paused";

    return {
      mqtt: {
        ...prev.mqtt,
        spotify: {
          ...prev.mqtt.spotify,
          track: track.title,
          artist: track.artist,
          album: track.album,
          trackId: track.id,
          duration: track.duration,
          position: 0,
          rawPosition: 0,
          state: playbackState,
          artwork: track.artwork,
          timestamp: playing ? now : 0,
          serverTimestamp: playing ? now : null,
          progressFrozen: false,
        },
      },
      spotify: {
        ...prev.spotify,
        track: track.title,
        artist: track.artist,
        album: track.album,
        albumArt: track.artwork,
        progress: 0,
        duration: track.duration,
      },
    };
  });
}

export function activateDummySpeaker() {
  if (!initialized) {
    currentTrackIndex = 0;
    snapshot = createInitialSnapshot(currentTrackIndex);
    initialized = true;
    emit();
  }
  ensureTimer();
}

export function deactivateDummySpeaker() {
  initialized = false;
  stopTimer();
}

export function subscribeToDummySpeaker(listener: Listener) {
  listeners.add(listener);
  listener(snapshot);
  ensureTimer();

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      stopTimer();
    }
  };
}

const clampPercent = (value: number) =>
  Math.min(100, Math.max(0, Math.round(value)));

export function updateDummySpeakerVolume(volume: number) {
  updateSnapshot((prev) => ({
    ...prev,
    mqtt: { ...prev.mqtt, volume: clampPercent(volume) },
  }));
}

export function updateDummySource(source: string) {
  updateSnapshot((prev) => ({
    ...prev,
    mqtt: { ...prev.mqtt, source, status: `Source changed to ${source}` },
  }));
}

export function updateDummySpotifyVolume(volume: number) {
  const clamped = clampPercent(volume);
  updateSnapshot((prev) => ({
    mqtt: {
      ...prev.mqtt,
      spotify: { ...prev.mqtt.spotify, volume: clamped },
    },
    spotify: {
      ...prev.spotify,
      volume: clamped,
    },
  }));
}

export function dummyFreezeSpotifyProgress(resetPosition = false) {
  updateSnapshot((prev) => ({
    mqtt: {
      ...prev.mqtt,
      spotify: {
        ...prev.mqtt.spotify,
        progressFrozen: true,
        timestamp: 0,
        serverTimestamp: null,
        position: resetPosition ? 0 : prev.mqtt.spotify.position,
        rawPosition: resetPosition ? 0 : prev.mqtt.spotify.rawPosition,
      },
    },
    spotify: {
      ...prev.spotify,
      progress: resetPosition ? 0 : prev.spotify.progress,
    },
  }));
}

export function dummyPlayPause(targetPlaying?: boolean) {
  const desired =
    typeof targetPlaying === "boolean"
      ? targetPlaying
      : !snapshot.spotify.playing;
  const playbackState = desired ? "playing" : "paused";
  const expiresAt = Date.now() + 1500;

  updateSnapshot((prev) => ({
    mqtt: {
      ...prev.mqtt,
      spotify: {
        ...prev.mqtt.spotify,
        state: playbackState,
        timestamp: desired ? Date.now() : 0,
        serverTimestamp: desired ? Date.now() : null,
        progressFrozen: false,
      },
    },
    spotify: {
      ...prev.spotify,
      playing: desired,
      pendingPlaying: desired,
      pendingExpiresAt: expiresAt,
    },
  }));
}

export function dummyAcknowledgePendingPlaying() {
  updateSnapshot((prev) => ({
    ...prev,
    spotify: {
      ...prev.spotify,
      pendingPlaying: null,
      pendingExpiresAt: null,
    },
  }));
}

export function dummyNextTrack() {
  loadTrack(currentTrackIndex + 1);
}

export function dummyPreviousTrack() {
  loadTrack(currentTrackIndex - 1);
}

export function dummyRestart() {
  updateSnapshot((prev) => ({
    ...prev,
    mqtt: { ...prev.mqtt, status: "Restart requested (dummy)" },
  }));
}

export function dummyShutdown() {
  updateSnapshot((prev) => ({
    ...prev,
    mqtt: { ...prev.mqtt, status: "Shutdown requested (dummy)" },
  }));
}

export function dummyLogin() {
  updateSnapshot((prev) => ({
    ...prev,
    spotify: { ...prev.spotify, authenticated: true },
  }));
}
