"use client";

import { useEffect, useState } from "react";

import { useMQTT } from "@/lib/useMQTT";
import { useSpotify } from "@/lib/useSpotify";
import { getModeConfig } from "@/lib/sourceModes";
import { SpeakerHeader, SpeakerFooter } from "@/components/speaker/base";
import { SpeakerBody as PlainSpeakerBody } from "@/components/speaker/plain/plain-body";
import { SpeakerBody as MoodSpeakerBody } from "@/components/speaker/mood/mood-body";
import { SpeakerBody as CircularSpeakerBody } from "@/components/speaker/circular/circular-body";
import { MoodBackground } from "@/components/speaker/mood/mood-background";
import { PageBackground } from "@/components/page/PageBackground";
import { useAppSettings } from "@/context/AppSettingsContext";
import { ThemeColorUpdater } from "@/components/ThemeColorUpdater";

export default function SpeakerOnePage() {
  const [visualizerResetTrigger, setVisualizerResetTrigger] = useState<
    number | null
  >(null);
  const [mounted, setMounted] = useState(false);

  const {
    connected,
    status,
    volume,
    source,
    availableSources,
    health,
    spotify,
    bluetooth,
    setVolume,
    setSource,
    shutdown,
    restart,
    freezeSpotifyProgress,
  } = useMQTT();

  const spotifyControl = useSpotify();
  const { theme } = useAppSettings();

  // Display data: MQTT when the speaker is actively playing, Spotify API as fallback.
  // Also tracks which source the display data came from for mode/controls.
  const { displayData, displaySource } = (() => {
    // MQTT Spotify: use when the speaker is actively playing Spotify
    if (source === "spotify" && spotify.state === "playing" && Boolean(spotify.track)) {
      return {
        displaySource: "spotify",
        displayData: {
          track: spotify.track,
          artist: spotify.artist,
          album: spotify.album,
          artwork: spotify.artwork,
          duration: spotify.duration,
          position: spotify.position,
          state: spotify.state,
        },
      };
    }

    // MQTT Bluetooth: use when source is bluetooth with track data
    if (source === "bluetooth" && Boolean(bluetooth.track) && bluetooth.state !== "idle") {
      return {
        displaySource: "bluetooth",
        displayData: {
          track: bluetooth.track,
          artist: bluetooth.artist,
          album: bluetooth.album,
          artwork: bluetooth.artwork,
          duration: bluetooth.duration,
          position: bluetooth.position,
          state: bluetooth.state,
        },
      };
    }

    // Spotify API fallback: works regardless of speaker source
    if (spotifyControl.authenticated && spotifyControl.track) {
      return {
        displaySource: "spotify",
        displayData: {
          track: spotifyControl.track ?? "",
          artist: spotifyControl.artist ?? "",
          album: spotifyControl.album ?? "",
          artwork: spotifyControl.albumArt ?? null,
          duration: spotifyControl.duration ?? 0,
          position: spotifyControl.progress ?? 0,
          state: spotifyControl.playing
            ? ("playing" as const)
            : ("paused" as const),
        },
      };
    }

    return {
      displaySource: source,
      displayData: {
        track: "",
        artist: "",
        album: "",
        artwork: null,
        duration: 0,
        position: 0,
        state: "idle" as const,
      },
    };
  })();

  const mode = getModeConfig(displaySource);

  useEffect(() => {
    setMounted(true);
  }, []);

  const pendingPlaying = spotifyControl.pendingPlaying;
  const pendingExpiresAt = spotifyControl.pendingExpiresAt;
  const acknowledgePendingPlaying = spotifyControl.acknowledgePendingPlaying;

  useEffect(() => {
    if (
      typeof pendingPlaying !== "boolean" ||
      typeof pendingExpiresAt !== "number" ||
      pendingExpiresAt <= Date.now() ||
      !acknowledgePendingPlaying
    ) {
      return;
    }

    const desiredState = pendingPlaying ? "playing" : "paused";
    const mqttState = spotify.state;
    const matchesDesired =
      desiredState === "playing"
        ? mqttState === "playing"
        : mqttState === "paused" ||
          mqttState === "stopped" ||
          mqttState === "idle";

    if (matchesDesired) {
      acknowledgePendingPlaying();
    }
  }, [
    pendingPlaying,
    pendingExpiresAt,
    acknowledgePendingPlaying,
    spotify.state,
  ]);

  const pendingActive =
    typeof pendingPlaying === "boolean" &&
    typeof pendingExpiresAt === "number" &&
    pendingExpiresAt > Date.now();

  const resolvedState = pendingActive
    ? pendingPlaying
      ? "playing"
      : "paused"
    : displayData.state ?? "idle";

  const triggerVisualizerReset = () => {
    setVisualizerResetTrigger(Date.now());
  };

  const spotifyActions = {
    playPause: () => {
      freezeSpotifyProgress(false);
      const currentPlaying =
        typeof spotifyControl.pendingPlaying === "boolean"
          ? spotifyControl.pendingPlaying
          : spotifyControl.authenticated
            ? spotifyControl.playing
            : spotify.state === "playing";
      const nextPlaying = !currentPlaying;
      return spotifyControl.playPause(nextPlaying);
    },
    next: () => {
      triggerVisualizerReset();
      freezeSpotifyProgress(true);
      return spotifyControl.next();
    },
    previous: () => {
      triggerVisualizerReset();
      freezeSpotifyProgress(true);
      return spotifyControl.previous();
    },
  };

  const showNowPlaying =
    Boolean(displayData.track) &&
    displayData.state !== "idle";
  const spotifyVolumeLevel = Number.isFinite(spotifyControl.volume)
    ? Math.round(spotifyControl.volume)
    : 0;

  const content = (
    <div className="flex flex-col mx-auto w-full h-full items-center justify-between">
      <ThemeColorUpdater />
      <SpeakerHeader
        health={health}
        source={source}
        availableSources={availableSources}
        onSourceChange={setSource}
        onRestart={restart}
        onShutdown={shutdown}
      />

      {theme === "Mood" ? (
        <MoodSpeakerBody
          mounted={mounted}
          showNowPlaying={showNowPlaying}
          artwork={displayData.artwork}
          track={displayData.track}
          artist={displayData.artist}
          album={displayData.album}
          duration={displayData.duration}
          position={displayData.position}
          resolvedState={resolvedState}
          visualizerResetTrigger={visualizerResetTrigger}
          authenticated={spotifyControl.authenticated}
          volume={volume}
          spotifyVolumeLevel={spotifyVolumeLevel}
          mode={mode}
          onLogin={spotifyControl.login}
          onPlayPause={spotifyActions.playPause}
          onNext={spotifyActions.next}
          onPrevious={spotifyActions.previous}
          onVolumeChange={setVolume}
          onSpotifyVolumeChange={spotifyControl.setVolume}
        />
      ) : theme === "Circular" ? (
        <CircularSpeakerBody
          mounted={mounted}
          showNowPlaying={showNowPlaying}
          artwork={displayData.artwork}
          track={displayData.track}
          artist={displayData.artist}
          album={displayData.album}
          duration={displayData.duration}
          position={displayData.position}
          resolvedState={resolvedState}
          visualizerResetTrigger={visualizerResetTrigger}
          authenticated={spotifyControl.authenticated}
          volume={volume}
          spotifyVolumeLevel={spotifyVolumeLevel}
          mode={mode}
          onLogin={spotifyControl.login}
          onPlayPause={spotifyActions.playPause}
          onNext={spotifyActions.next}
          onPrevious={spotifyActions.previous}
          onVolumeChange={setVolume}
          onSpotifyVolumeChange={spotifyControl.setVolume}
        />
      ) : (
        <PlainSpeakerBody
          mounted={mounted}
          showNowPlaying={showNowPlaying}
          artwork={displayData.artwork}
          track={displayData.track}
          artist={displayData.artist}
          album={displayData.album}
          duration={displayData.duration}
          position={displayData.position}
          resolvedState={resolvedState}
          visualizerResetTrigger={visualizerResetTrigger}
          authenticated={spotifyControl.authenticated}
          volume={volume}
          spotifyVolumeLevel={spotifyVolumeLevel}
          mode={mode}
          onLogin={spotifyControl.login}
          onPlayPause={spotifyActions.playPause}
          onNext={spotifyActions.next}
          onPrevious={spotifyActions.previous}
          onVolumeChange={setVolume}
          onSpotifyVolumeChange={spotifyControl.setVolume}
        />
      )}

      <SpeakerFooter
        connected={connected}
        status={status}
        health={health}
        theme={theme}
      />
    </div>
  );

  return theme === "Mood" ? (
    <MoodBackground>{content}</MoodBackground>
  ) : (
    <PageBackground theme={theme}>{content}</PageBackground>
  );
}
