// app/control/page.tsx
"use client";
import { useEffect, useRef, useState } from "react";

type Source = "bluetooth" | "spotify" | "idle";

export default function ControlPage() {
  const base = process.env.NEXT_PUBLIC_DEVICE_URL || "http://localhost:3001";
  const [status, setStatus] = useState<any>(null);
  const [volume, setVolume] = useState<number>(50);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Initial load + WS
  useEffect(() => {
    if (!base) {
      setConnectionError("NEXT_PUBLIC_DEVICE_URL environment variable is not set");
      return;
    }

    // Test connection first
    fetch(`${base}/api/status`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}: ${r.statusText}`);
        return r.json();
      })
      .then(s => {
        setStatus(s);
        setVolume(s.volume);
        setIsConnected(true);
        setConnectionError(null);
      })
      .catch(err => {
        console.error("Failed to fetch status:", err);
        setIsConnected(false);
        setConnectionError(`Cannot connect to device at ${base}. Make sure the device is running and accessible.`);
      });

    const wsUrl = base.replace("http", "ws") + "/ws";
    const ws = new WebSocket(wsUrl);
    ws.onopen = () => {
      console.log("WebSocket connected");
    };
    ws.onmessage = (e) => {
      const m = JSON.parse(e.data);
      if (m.type === "volume") setVolume(m.value);
      if (m.type === "status") setStatus(m.payload);
      if (m.type === "source") setStatus((prev: any) => ({ ...prev, source: m.value }));
    };
    ws.onerror = (err) => {
      console.error("WebSocket error:", err);
      setConnectionError("WebSocket connection failed");
    };
    ws.onclose = () => {
      console.log("WebSocket disconnected");
    };
    wsRef.current = ws;
    return () => ws.close();
  }, [base]);

  const setDeviceVolume = (v: number) => {
    if (!base || !isConnected) return;
    setVolume(v);
    fetch(`${base}/api/volume`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value: v }),
    }).catch(err => {
      console.error("Failed to set volume:", err);
      setConnectionError("Failed to set volume. Device may be disconnected.");
    });
  };

  const chooseSource = (s: Source) => {
    if (!base || !isConnected) return;
    fetch(`${base}/api/source`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source: s }),
    }).catch(err => {
      console.error("Failed to choose source:", err);
      setConnectionError("Failed to change source. Device may be disconnected.");
    });
  };

  const sp = (action: "play" | "pause" | "next" | "prev") => {
    if (!base || !isConnected) return;
    fetch(`${base}/api/spotify/playback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    }).catch(err => {
      console.error("Failed to control Spotify:", err);
      setConnectionError("Failed to control Spotify. Device may be disconnected.");
    });
  };

  return (
    <main className="p-6 max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Speaker Control</h1>

      {/* Connection Status */}
      <section className="space-y-2">
        <div className={`text-sm p-3 rounded ${
          isConnected 
            ? "bg-green-100 text-green-800 border border-green-200" 
            : "bg-red-100 text-red-800 border border-red-200"
        }`}>
          {isConnected ? (
            <span>✅ Connected to device at {base}</span>
          ) : (
            <span>❌ {connectionError || "Not connected"}</span>
          )}
        </div>
      </section>

      <section className="space-y-2">
        <div className="text-sm opacity-80">
          Source: <b>{status?.source ?? "loading…"}</b> · BT:{" "}
          {status?.bt?.connected ? `🎧 ${status.bt.deviceName}` : "—"}
        </div>

        <div className="flex gap-2">
          <button 
            className={`px-3 py-2 rounded ${
              isConnected ? "bg-gray-200 hover:bg-gray-300" : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
            onClick={() => chooseSource("bluetooth")}
            disabled={!isConnected}
          >
            Bluetooth
          </button>
          <button 
            className={`px-3 py-2 rounded ${
              isConnected ? "bg-gray-200 hover:bg-gray-300" : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
            onClick={() => chooseSource("spotify")}
            disabled={!isConnected}
          >
            Spotify
          </button>
          <button 
            className={`px-3 py-2 rounded ${
              isConnected ? "bg-gray-200 hover:bg-gray-300" : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
            onClick={() => chooseSource("idle")}
            disabled={!isConnected}
          >
            Idle
          </button>
        </div>
      </section>

      <section className="space-y-2">
        <label className="block">Volume: {volume}%</label>
        <input 
          type="range" 
          min={0} 
          max={100} 
          value={volume}
          onChange={(e) => setDeviceVolume(Number(e.target.value))}
          disabled={!isConnected}
          className={!isConnected ? "opacity-50" : ""}
        />
      </section>

      <section className="space-y-2">
        <div className="font-medium">{status?.spotify?.track?.title ?? "No track"}</div>
        <div className="text-sm opacity-70">{status?.spotify?.track?.artist ?? ""}</div>
        <div className="flex gap-2">
          <button 
            className={`px-3 py-2 rounded ${
              isConnected ? "bg-gray-200 hover:bg-gray-300" : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`} 
            onClick={() => sp("prev")}
            disabled={!isConnected}
          >
            ⏮︎
          </button>
          <button 
            className={`px-3 py-2 rounded ${
              isConnected ? "bg-gray-200 hover:bg-gray-300" : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`} 
            onClick={() => sp("pause")}
            disabled={!isConnected}
          >
            ⏸
          </button>
          <button 
            className={`px-3 py-2 rounded ${
              isConnected ? "bg-gray-200 hover:bg-gray-300" : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`} 
            onClick={() => sp("play")}
            disabled={!isConnected}
          >
            ▶️
          </button>
          <button 
            className={`px-3 py-2 rounded ${
              isConnected ? "bg-gray-200 hover:bg-gray-300" : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`} 
            onClick={() => sp("next")}
            disabled={!isConnected}
          >
            ⏭︎
          </button>
        </div>
      </section>
    </main>
  );
}

