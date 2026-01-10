"use client";

import { useEffect, useState } from "react";

import { useMQTT } from "@/lib/useMQTT";
import { useSpotify } from "@/lib/useSpotify";
import { SpeakerHeader, SpeakerFooter } from "@/components/speaker/base";
import { SpeakerBody as PlainSpeakerBody } from "@/components/speaker/plain/plain-body";
import { SpeakerBody as MoodSpeakerBody } from "@/components/speaker/mood/mood-body";
import { SpeakerBody as CircularSpeakerBody } from "@/components/speaker/circular/circular-body";
import { MoodBackground } from "@/components/speaker/mood/mood-background";
import { PageBackground } from "@/components/page/PageBackground";
import { useAppSettings } from "@/context/AppSettingsContext";

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
    setVolume,
    setSource,
    shutdown,
    restart,
    freezeSpotifyProgress,
  } = useMQTT();

  const spotifyControl = useSpotify();
  const { theme } = useAppSettings();

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
    : (spotify.state ?? "idle");

  const triggerVisualizerReset = () => {
    setVisualizerResetTrigger(Date.now());
  };

  const spotifyActions = {
    playPause: () => {
      freezeSpotifyProgress(false);
      const isMqttPlaying = spotify.state === "playing";
      const currentPlaying =
        typeof spotifyControl.pendingPlaying === "boolean"
          ? spotifyControl.pendingPlaying
          : isMqttPlaying;
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

  const showNowPlaying = Boolean(spotify.track) && spotify.state !== "idle";
  const spotifyVolumeLevel = Number.isFinite(spotifyControl.volume)
    ? Math.round(spotifyControl.volume)
    : 0;

  const content = (
    <div className="flex flex-col mx-auto w-full h-full items-center justify-between">
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
          artwork={spotify.artwork}
          track={spotify.track}
          artist={spotify.artist}
          album={spotify.album}
          duration={spotify.duration}
          position={spotify.position}
          resolvedState={resolvedState}
          visualizerResetTrigger={visualizerResetTrigger}
          authenticated={spotifyControl.authenticated}
          volume={volume}
          spotifyVolumeLevel={spotifyVolumeLevel}
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
          artwork={spotify.artwork}
          track={spotify.track}
          artist={spotify.artist}
          album={spotify.album}
          duration={spotify.duration}
          position={spotify.position}
          resolvedState={resolvedState}
          visualizerResetTrigger={visualizerResetTrigger}
          authenticated={spotifyControl.authenticated}
          volume={volume}
          spotifyVolumeLevel={spotifyVolumeLevel}
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
          artwork={spotify.artwork}
          track={spotify.track}
          artist={spotify.artist}
          album={spotify.album}
          duration={spotify.duration}
          position={spotify.position}
          resolvedState={resolvedState}
          visualizerResetTrigger={visualizerResetTrigger}
          authenticated={spotifyControl.authenticated}
          volume={volume}
          spotifyVolumeLevel={spotifyVolumeLevel}
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
