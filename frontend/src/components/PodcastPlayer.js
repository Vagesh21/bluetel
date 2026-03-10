import React, { useState } from 'react';
import { usePlayer } from '@/contexts/PlayerContext';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, X, Maximize2, Minimize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function formatTime(sec) {
  if (!sec || isNaN(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const SPEEDS = [0.75, 1, 1.25, 1.5, 2];

export default function PodcastPlayer() {
  const {
    episode, isPlaying, currentTime, duration, volume, speed, isExpanded, isVisible,
    togglePlay, seek, changeVolume, changeSpeed, playNext, playPrev, setIsExpanded, dismiss,
  } = usePlayer();
  const [showVolume, setShowVolume] = useState(false);

  if (!isVisible || !episode) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      {/* Expanded Overlay */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm"
            data-testid="player-expanded-overlay"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-lg mx-4 glass rounded-sm p-8"
            >
              <div className="flex justify-end mb-4">
                <button onClick={() => setIsExpanded(false)} className="text-gray-500 hover:text-white" data-testid="player-collapse-btn" aria-label="Collapse player">
                  <Minimize2 className="w-5 h-5" />
                </button>
              </div>
              <div className="flex flex-col items-center text-center">
                <img
                  src={episode.cover_art_url || episode.show_cover_art_url || '/placeholder.jpg'}
                  alt={episode.title}
                  className="w-48 h-48 object-cover rounded-sm mb-6 shadow-2xl"
                />
                <h3 className="font-heading text-xl text-white mb-1">{episode.title}</h3>
                <p className="text-amber text-sm mb-2">{episode.show_name}</p>
                <p className="text-gray-500 text-xs leading-relaxed max-h-24 overflow-y-auto mb-6">{episode.description}</p>

                {/* Progress */}
                <div className="w-full mb-4">
                  <input
                    type="range" min={0} max={duration || 0} value={currentTime}
                    onChange={(e) => seek(Number(e.target.value))}
                    className="w-full h-1"
                    data-testid="player-seek-expanded"
                    aria-label="Seek"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1 font-mono">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-6">
                  <button onClick={playPrev} className="text-gray-400 hover:text-white transition-colors" data-testid="player-prev-expanded" aria-label="Previous"><SkipBack className="w-5 h-5" /></button>
                  <button onClick={togglePlay} className="w-14 h-14 flex items-center justify-center bg-amber text-black rounded-full hover:brightness-110 transition-all" data-testid="player-play-expanded" aria-label={isPlaying ? 'Pause' : 'Play'}>
                    {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
                  </button>
                  <button onClick={playNext} className="text-gray-400 hover:text-white transition-colors" data-testid="player-next-expanded" aria-label="Next"><SkipForward className="w-5 h-5" /></button>
                </div>

                {/* Speed */}
                <div className="flex items-center gap-2 mt-4">
                  {SPEEDS.map((s) => (
                    <button
                      key={s}
                      onClick={() => changeSpeed(s)}
                      className={`text-xs px-2 py-1 rounded-sm transition-colors ${speed === s ? 'bg-amber text-black font-bold' : 'text-gray-500 hover:text-white'}`}
                      data-testid={`player-speed-${s}x`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 player-bar" data-testid="podcast-player-bar">
        {/* Progress bar on top */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-white/5">
          <div className="h-full bg-amber transition-all duration-200" style={{ width: `${progress}%` }} />
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-8 h-20 flex items-center gap-4">
          {/* Cover art + info */}
          <div className="flex items-center gap-3 min-w-0 flex-1 md:flex-none md:w-64">
            <img
              src={episode.cover_art_url || episode.show_cover_art_url || '/placeholder.jpg'}
              alt={episode.title}
              className="w-12 h-12 object-cover rounded-sm flex-shrink-0"
            />
            <div className="min-w-0">
              <p className="text-sm text-white truncate">{episode.title}</p>
              <p className="text-xs text-gray-500 truncate">{episode.show_name}</p>
            </div>
          </div>

          {/* Controls - center */}
          <div className="hidden md:flex items-center gap-4 flex-1 justify-center">
            <button onClick={playPrev} className="text-gray-500 hover:text-white transition-colors" data-testid="player-prev" aria-label="Previous"><SkipBack className="w-4 h-4" /></button>
            <button onClick={togglePlay} className="w-10 h-10 flex items-center justify-center bg-white text-black rounded-full hover:bg-gray-200 transition-all" data-testid="player-play-pause" aria-label={isPlaying ? 'Pause' : 'Play'}>
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>
            <button onClick={playNext} className="text-gray-500 hover:text-white transition-colors" data-testid="player-next" aria-label="Next"><SkipForward className="w-4 h-4" /></button>
          </div>

          {/* Seek bar - desktop */}
          <div className="hidden md:flex items-center gap-2 flex-1">
            <span className="text-xs text-gray-500 font-mono w-10 text-right">{formatTime(currentTime)}</span>
            <input
              type="range" min={0} max={duration || 0} value={currentTime}
              onChange={(e) => seek(Number(e.target.value))}
              className="flex-1 h-1"
              data-testid="player-seek"
              aria-label="Seek"
            />
            <span className="text-xs text-gray-500 font-mono w-10">{formatTime(duration)}</span>
          </div>

          {/* Mobile play button */}
          <button onClick={togglePlay} className="md:hidden w-10 h-10 flex items-center justify-center bg-white text-black rounded-full" data-testid="player-play-mobile" aria-label={isPlaying ? 'Pause' : 'Play'}>
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>

          {/* Right controls */}
          <div className="hidden md:flex items-center gap-2">
            {/* Speed */}
            <button
              onClick={() => { const idx = SPEEDS.indexOf(speed); changeSpeed(SPEEDS[(idx + 1) % SPEEDS.length]); }}
              className="text-xs text-gray-500 hover:text-white px-2 py-1 transition-colors font-mono"
              data-testid="player-speed-toggle"
              aria-label="Playback speed"
            >
              {speed}x
            </button>

            {/* Volume */}
            <div className="relative" onMouseEnter={() => setShowVolume(true)} onMouseLeave={() => setShowVolume(false)}>
              <button
                onClick={() => changeVolume(volume > 0 ? 0 : 1)}
                className="text-gray-500 hover:text-white transition-colors p-1"
                data-testid="player-volume-toggle"
                aria-label={volume > 0 ? 'Mute' : 'Unmute'}
              >
                {volume > 0 ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
              {showVolume && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 glass rounded-sm p-2">
                  <input
                    type="range" min={0} max={1} step={0.05} value={volume}
                    onChange={(e) => changeVolume(Number(e.target.value))}
                    className="w-20 h-1"
                    data-testid="player-volume-slider"
                    aria-label="Volume"
                  />
                </div>
              )}
            </div>

            {/* Expand */}
            <button onClick={() => setIsExpanded(true)} className="text-gray-500 hover:text-white transition-colors p-1" data-testid="player-expand" aria-label="Expand player">
              <Maximize2 className="w-4 h-4" />
            </button>

            {/* Close */}
            <button onClick={dismiss} className="text-gray-500 hover:text-red-400 transition-colors p-1" data-testid="player-close" aria-label="Close player">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
