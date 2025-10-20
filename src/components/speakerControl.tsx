'use client';

import { useMQTT } from '@/lib/useMQTT';
import { Volume2, Wifi, Power, Activity, Music } from 'lucide-react';
import { useSpotify } from '@/lib/useSpotify';

export default function SpeakerControl() {
  const { 
    connected, 
    status, 
    volume, 
    source, 
    availableSources,
    health,
    setVolume, 
    setSource,
    shutdown,
    restart 
  } = useMQTT();

  const spotify = useSpotify();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="text-center">
          <h1 className="text-5xl font-bold text-white mb-2">Ru Speaker</h1>
          <div className="flex items-center justify-center gap-2">
            <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`} />
            <span className="text-gray-300">{connected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>

        {/* Status Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          <div className="flex items-center gap-3 mb-4">
            <Activity className="text-purple-400" />
            <h2 className="text-xl font-semibold text-white">Status</h2>
          </div>
          <div className="text-gray-300 text-lg capitalize">{status}</div>
        </div>

        {spotify.authenticated && (spotify.playing || spotify.track) && (
  <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
    <div className="flex items-center gap-3 mb-4">
      <Music className="text-purple-400" />
      <h2 className="text-xl font-semibold text-white">Now Playing</h2>
    </div>
    <div className="flex gap-4">
      {spotify.albumArt && (
        <img 
          src={spotify.albumArt} 
          alt="Album art" 
          className="w-24 h-24 rounded-lg shadow-lg"
        />
      )}
      <div className="flex-1">
        <div className="text-2xl font-bold text-white mb-1">{spotify.track}</div>
        <div className="text-lg text-gray-300 mb-2">{spotify.artist}</div>
        <div className="text-sm text-gray-400">{spotify.album}</div>
        {spotify.progress && spotify.duration && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>{Math.floor(spotify.progress / 60000)}:{String(Math.floor((spotify.progress % 60000) / 1000)).padStart(2, '0')}</span>
              <span>{Math.floor(spotify.duration / 60000)}:{String(Math.floor((spotify.duration % 60000) / 1000)).padStart(2, '0')}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-1">
              <div 
                className="bg-purple-500 h-1 rounded-full transition-all" 
                style={{ width: `${(spotify.progress / spotify.duration) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
    
    {/* Playback Controls */}
    <div className="flex justify-center gap-4 mt-6">
      <button
        onClick={spotify.previous}
        className="bg-white/10 hover:bg-white/20 text-white p-4 rounded-full transition-colors"
        title="Previous track"
      >
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
        </svg>
      </button>
      
      <button
  onClick={spotify.playPause}
  className="bg-purple-500 hover:bg-purple-600 text-white p-5 rounded-full transition-all shadow-lg shadow-purple-500/50 active:scale-95"
  title={spotify.playing ? 'Pause' : 'Play'}
>
        {spotify.playing ? (
          <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
          </svg>
        ) : (
          <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z"/>
          </svg>
        )}
      </button>
      
      <button
        onClick={spotify.next}
        className="bg-white/10 hover:bg-white/20 text-white p-4 rounded-full transition-colors"
        title="Next track"
      >
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
        </svg>
      </button>
    </div>
  </div>
)}

{/* Login Button if not authenticated */}
{!spotify.authenticated && (
  <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 text-center">
    <button
      onClick={spotify.login}
      className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-xl transition-colors inline-flex items-center gap-2"
    >
      <Music size={20} />
      Connect Spotify
    </button>
  </div>
)}

        {/* Volume Control */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          <div className="flex items-center gap-3 mb-4">
            <Volume2 className="text-purple-400" />
            <h2 className="text-xl font-semibold text-white">Volume</h2>
          </div>
          <div className="space-y-4">
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => setVolume(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="text-center text-3xl font-bold text-white">{volume}%</div>
          </div>
        </div>

        {/* Source Selector */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          <div className="flex items-center gap-3 mb-4">
            <Music className="text-purple-400" />
            <h2 className="text-xl font-semibold text-white">Source</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {availableSources.map((src) => (
              <button
                key={src}
                onClick={() => setSource(src)}
                className={`p-4 rounded-xl font-medium transition-all ${
                  source === src
                    ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/50'
                    : 'bg-white/5 text-gray-300 hover:bg-white/10'
                }`}
              >
                {src.charAt(0).toUpperCase() + src.slice(1).replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Health Stats */}
        {health && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex items-center gap-3 mb-4">
              <Wifi className="text-purple-400" />
              <h2 className="text-xl font-semibold text-white">System Health</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-gray-400 text-sm">CPU Temp</div>
                <div className="text-white text-2xl font-bold">{health.cpu_temp}°C</div>
              </div>
              <div>
                <div className="text-gray-400 text-sm">Memory</div>
                <div className="text-white text-2xl font-bold">{health.memory_usage_percent}%</div>
              </div>
              <div>
                <div className="text-gray-400 text-sm">Disk</div>
                <div className="text-white text-2xl font-bold">{health.disk_usage_percent}%</div>
              </div>
              <div>
                <div className="text-gray-400 text-sm">WiFi</div>
                <div className="text-white text-2xl font-bold">{health.wifi_signal_dbm} dBm</div>
              </div>
            </div>
            <div className="mt-4 text-gray-400 text-sm">
              Uptime: {health.uptime}
            </div>
          </div>
        )}

        {/* Power Controls */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          <div className="flex items-center gap-3 mb-4">
            <Power className="text-purple-400" />
            <h2 className="text-xl font-semibold text-white">Power</h2>
          </div>
          <div className="flex gap-3">
            <button
              onClick={restart}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 rounded-xl transition-colors"
            >
              Restart
            </button>
            <button
              onClick={shutdown}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium py-3 rounded-xl transition-colors"
            >
              Shutdown
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}