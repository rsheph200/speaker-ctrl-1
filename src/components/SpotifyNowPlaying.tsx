'use client';

import { useMQTT } from '@/lib/useMQTT';

export function SpotifyNowPlaying() {
  const { spotify, connected } = useMQTT();

  // Format milliseconds to MM:SS
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!connected) {
    return (
      <div className="p-4 border rounded-lg bg-gray-50">
        <p className="text-gray-500">Connecting to speaker...</p>
      </div>
    );
  }

  if (!spotify.track || spotify.state === 'idle') {
    return (
      <div className="p-4 border rounded-lg bg-gray-50">
        <p className="text-gray-500">No music playing</p>
      </div>
    );
  }

  return (
    <div className="p-6 border rounded-lg bg-white shadow-sm">
      {/* Status Badge */}
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-3 h-3 rounded-full ${
          spotify.state === 'playing' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
        }`} />
        <span className="text-sm text-gray-600">
          {spotify.state === 'playing' ? 'Now Playing' : 'Paused'}
        </span>
      </div>

      {/* Track Info */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">
          {spotify.track}
        </h2>
        <p className="text-lg text-gray-600">
          {spotify.artist}
        </p>
        <p className="text-sm text-gray-500">
          {spotify.album}
        </p>
      </div>

      {/* Progress Bar */}
      {spotify.duration > 0 && (
        <div className="mt-6 space-y-2">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all"
              style={{ 
                width: `${(spotify.position / spotify.duration) * 100}%` 
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>{formatTime(spotify.position)}</span>
            <span>{formatTime(spotify.duration)}</span>
          </div>
        </div>
      )}
    </div>
  );
}