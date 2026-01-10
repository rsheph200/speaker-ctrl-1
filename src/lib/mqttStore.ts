import mqtt, { MqttClient } from "mqtt";

export interface SpeakerState {
  speaker_id: string;
  speaker_name: string;
  timestamp: string;
  status: "online" | "offline";
  snapclient?: {
    service_active: boolean;
    connected: boolean;
    playing: boolean;
    pid?: number;
  };
  system?: {
    cpu_percent: number;
    memory_percent: number;
    memory_mb_used: number;
    memory_mb_total: number;
    cpu_temp: number;
    uptime_hours: number;
    load_average: number[];
  };
  network?: {
    connected_to_server: boolean;
    latency_ms: number;
    ip_address: string;
    hostname: string;
  };
  health?: any;
}

class MQTTStore {
  private client: MqttClient | null = null;
  private speakers: Map<string, SpeakerState> = new Map();
  private connected: boolean = false;
  private initialized: boolean = false;
  private connectionAttempted: boolean = false;
  private lastErrorTime: number = 0;
  private errorSuppressionWindow: number = 60000; // 1 minute
  private failedConnectionCount: number = 0;
  private maxConnectionAttempts: number = 3;

  private initialize() {
    // Prevent re-initialization if connection was explicitly disabled
    if (this.initialized || this.connectionAttempted) {
      return;
    }

    // Only initialize on server-side
    if (typeof window !== "undefined") {
      return;
    }

    // Check if we've already failed too many times
    if (this.failedConnectionCount >= this.maxConnectionAttempts) {
      this.initialized = true;
      this.connectionAttempted = true;
      return;
    }

    // Only connect if MQTT_URL is explicitly set (don't auto-connect to localhost)
    const brokerUrl = process.env.MQTT_URL || process.env.NEXT_PUBLIC_MQTT_URL;

    if (!brokerUrl) {
      // Silently skip connection if no URL is configured
      this.initialized = true;
      this.connectionAttempted = true;
      return;
    }

    this.connectionAttempted = true;
    console.log("[MQTT Store] Initializing connection to", brokerUrl);

    this.client = mqtt.connect(brokerUrl, {
      reconnectPeriod: 0, // Disable auto-reconnect to prevent spam
      connectTimeout: 10000,
      clean: true,
      keepalive: 20,
      protocolVersion: 4,
    });

    this.client.on("connect", () => {
      console.log("[MQTT Store] Connected to broker");
      this.connected = true;

      // Subscribe to both old and new topic patterns
      this.client?.subscribe("ruspeaker/#", (error) => {
        if (error) {
          console.error(
            "[MQTT Store] Failed to subscribe to ruspeaker/#",
            error
          );
        } else {
          console.log("[MQTT Store] Subscribed to ruspeaker/#");
        }
      });

      this.client?.subscribe("audio/speakers/#", (error) => {
        if (error) {
          console.error(
            "[MQTT Store] Failed to subscribe to audio/speakers/#",
            error
          );
        } else {
          console.log("[MQTT Store] Subscribed to audio/speakers/#");
        }
      });
    });

    this.client.on("reconnect", () => {
      // Prevent reconnection by ending the client if we've exceeded max attempts
      if (this.failedConnectionCount >= this.maxConnectionAttempts) {
        if (this.client) {
          this.client.end(true); // Force disconnect
          this.client.removeAllListeners();
          this.client = null;
        }
        this.connectionAttempted = true; // Prevent re-initialization
        return;
      }
      // Suppress reconnect messages to reduce noise
      const now = Date.now();
      if (now - this.lastErrorTime > this.errorSuppressionWindow) {
        console.log("[MQTT Store] Reconnecting...");
      }
    });

    this.client.on("close", () => {
      // Suppress close messages unless it's the first time
      if (this.connected) {
        console.log("[MQTT Store] Connection closed");
      }
      this.connected = false;
    });

    this.client.on("offline", () => {
      this.connected = false;
    });

    this.client.on("message", (topic: string, payload: Buffer) => {
      const message = payload.toString();

      // Handle new audio/speakers/# topics
      if (topic.startsWith("audio/speakers/")) {
        this.handleAudioSpeakersTopic(topic, message);
      }
      // Legacy ruspeaker topics are handled by the client-side hook
    });

    this.client.on("error", (error: any) => {
      this.failedConnectionCount++;
      const now = Date.now();

      // Only log errors once per minute to reduce spam
      if (now - this.lastErrorTime > this.errorSuppressionWindow) {
        if (this.failedConnectionCount >= this.maxConnectionAttempts) {
          console.warn(
            `[MQTT Store] Connection failed after ${this.maxConnectionAttempts} attempts. MQTT features disabled.`
          );
          // Disable further connection attempts and prevent reconnection
          if (this.client) {
            this.client.end(true); // Force disconnect
            this.client.removeAllListeners();
            this.client = null;
          }
          this.connectionAttempted = true; // Prevent re-initialization
        } else {
          console.warn(
            "[MQTT Store] Connection error:",
            error.code || error.message
          );
        }
        this.lastErrorTime = now;
      }
      this.connected = false;
    });

    this.initialized = true;
  }

  private handleAudioSpeakersTopic(topic: string, message: string) {
    // Parse topic: audio/speakers/{speaker_id}/{type}
    const parts = topic.split("/");
    if (parts.length < 4) {
      return;
    }

    const speakerId = parts[2];
    const type = parts[3];

    // Get or create speaker state
    let speaker = this.speakers.get(speakerId);
    if (!speaker) {
      speaker = {
        speaker_id: speakerId,
        speaker_name: speakerId
          .replace(/-/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase()),
        timestamp: new Date().toISOString(),
        status: "offline",
      };
      this.speakers.set(speakerId, speaker);
    }

    // Update based on topic type
    if (type === "status") {
      speaker.status = message === "online" ? "online" : "offline";
      speaker.timestamp = new Date().toISOString();
    } else if (type === "state") {
      try {
        const state = JSON.parse(message);
        Object.assign(speaker, {
          ...state,
          timestamp: state.timestamp || new Date().toISOString(),
          status: speaker.status || "online",
        });
      } catch (error) {
        console.error(
          `[MQTT Store] Failed to parse state for ${speakerId}:`,
          error
        );
      }
    } else if (type === "health") {
      try {
        speaker.health = JSON.parse(message);
        speaker.timestamp = new Date().toISOString();
      } catch (error) {
        console.error(
          `[MQTT Store] Failed to parse health for ${speakerId}:`,
          error
        );
      }
    } else if (type === "network") {
      try {
        speaker.network = JSON.parse(message);
        speaker.timestamp = new Date().toISOString();
      } catch (error) {
        console.error(
          `[MQTT Store] Failed to parse network for ${speakerId}:`,
          error
        );
      }
    }

    // Update timestamp
    speaker.timestamp = new Date().toISOString();
    this.speakers.set(speakerId, speaker);
  }

  getSpeaker(speakerId: string): SpeakerState | null {
    this.initialize();
    return this.speakers.get(speakerId) || null;
  }

  getAllSpeakers(): SpeakerState[] {
    this.initialize();
    return Array.from(this.speakers.values());
  }

  isConnected(): boolean {
    return this.connected;
  }
}

// Singleton instance
export const mqttStore = new MQTTStore();
