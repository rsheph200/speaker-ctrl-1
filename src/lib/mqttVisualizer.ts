import mqtt, { MqttClient } from 'mqtt';

export type VizFrame = {
  ts: number;
  rate: number;
  bins: number;
  rms: number;
  bars: number[];
};

type VisualizerOptions = {
  url: string;
  topicPrefix?: string;
  onFrame?: (frame: VizFrame) => void;
  onStatus?: (status: string) => void;
};

const defaultPrefix = 'ruspeaker/visualizer';

export function connectVisualizer({
  url,
  topicPrefix = defaultPrefix,
  onFrame,
  onStatus,
}: VisualizerOptions): MqttClient {
  const client = mqtt.connect(url, {
    reconnectPeriod: 1000,
    connectTimeout: 30000,
    clean: true,
    keepalive: 20,
    protocolVersion: 4,
  });

  const topic = (suffix: string) => `${topicPrefix}/${suffix}`;

  client.on('connect', () => {
    client.subscribe(`${topicPrefix}/#`, error => {
      if (error) {
        console.error('[Visualizer] Failed to subscribe', error);
      }
    });
    onStatus?.('connected');
  });

  client.on('message', (incomingTopic: string, payload: Buffer) => {
    if (incomingTopic === topic('fft')) {
      try {
        const frame = JSON.parse(payload.toString()) as VizFrame;
        onFrame?.(frame);
      } catch (error) {
        console.warn('[Visualizer] Failed to parse frame', error);
      }
    }

    if (incomingTopic === topic('status')) {
      onStatus?.(payload.toString());
    }
  });

  client.on('error', error => {
    console.error('[Visualizer] MQTT error', error);
    onStatus?.('error');
  });

  client.on('close', () => {
    onStatus?.('disconnected');
  });

  return client;
}
