export interface NowPlayingInfo {
  track?: string | null;
  artist?: string | null;
  album?: string | null;
  artwork?: string | null;
  durationMs?: number | null;
  positionMs?: number | null;
  state?: 'playing' | 'paused' | 'idle' | (string & {});
}

export interface SpotifyControlActions {
  playPause?: () => void;
  next?: () => void;
  previous?: () => void;
}

export interface SpeakerHealth {
  cpu_temp?: number | string | null;
  memory_usage_percent?: number | string | null;
  disk_usage_percent?: number | string | null;
  wifi_signal_dbm?: number | string | null;
  live?: string | null;
  uptime?: string | null;
}
