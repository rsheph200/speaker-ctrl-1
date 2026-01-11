"use client";

import { useEffect, useState } from "react";
import { SpeakerState } from "./mqttStore";

export function useSpeakers() {
  const [speakers, setSpeakers] = useState<SpeakerState[]>([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchSpeakers = async () => {
    try {
      const response = await fetch("/api/speakers");
      if (response.ok) {
        const data = await response.json();
        setSpeakers(data.speakers || []);
        setConnected(data.connected || false);
      } else {
        // Handle non-ok responses gracefully
        console.warn("[useSpeakers] API returned non-ok status:", response.status);
      }
    } catch (error) {
      // Only log if it's not a network error (which can happen during dev)
      if (error instanceof TypeError && error.message === "Failed to fetch") {
        // This can happen if the server isn't ready or during SSR
        // Silently handle it - the interval will retry
        if (typeof window !== "undefined") {
          console.debug("[useSpeakers] Fetch failed (server may not be ready)");
        }
      } else {
        console.error("[useSpeakers] Error fetching speakers:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpeakers();
    // Poll every 5 seconds for updates
    const interval = setInterval(fetchSpeakers, 5000);
    return () => clearInterval(interval);
  }, []);

  const getSpeaker = (speakerId: string): SpeakerState | null => {
    return speakers.find((s) => s.speaker_id === speakerId) || null;
  };

  return {
    speakers,
    getSpeaker,
    connected,
    loading,
    refresh: fetchSpeakers,
  };
}

