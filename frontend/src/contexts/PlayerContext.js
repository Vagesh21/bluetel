import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';

const PlayerContext = createContext(null);

const STORAGE_KEY = 'blues_hotel_player';

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      episode: state.episode,
      currentTime: state.currentTime,
      volume: state.volume,
      speed: state.speed,
    }));
  } catch {}
}

export function PlayerProvider({ children }) {
  const audioRef = useRef(new Audio());
  const [episode, setEpisode] = useState(null);
  const [playlist, setPlaylist] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [speed, setSpeed] = useState(1);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Restore from localStorage on mount
  useEffect(() => {
    const saved = loadState();
    if (saved) {
      if (saved.volume !== undefined) { setVolume(saved.volume); audioRef.current.volume = saved.volume; }
      if (saved.speed) { setSpeed(saved.speed); audioRef.current.playbackRate = saved.speed; }
      if (saved.episode) {
        setEpisode(saved.episode);
        setIsVisible(true);
        const src = saved.episode.audio_url || saved.episode.external_audio_url;
        if (src) {
          audioRef.current.src = src;
          if (saved.currentTime) {
            audioRef.current.currentTime = saved.currentTime;
          }
        }
      }
    }
  }, []);

  // Audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    const onTimeUpdate = () => { setCurrentTime(audio.currentTime); };
    const onDurationChange = () => { setDuration(audio.duration || 0); };
    const onEnded = () => { setIsPlaying(false); playNext(); };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('durationchange', onDurationChange);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('durationchange', onDurationChange);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save state periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (episode) saveState({ episode, currentTime: audioRef.current.currentTime, volume, speed });
    }, 5000);
    return () => clearInterval(interval);
  }, [episode, volume, speed]);

  const playEpisode = useCallback((ep, list = []) => {
    const src = ep.audio_url || ep.external_audio_url;
    if (!src) return;
    audioRef.current.src = src;
    audioRef.current.volume = volume;
    audioRef.current.playbackRate = speed;
    audioRef.current.play().catch(() => {});
    setEpisode(ep);
    setIsPlaying(true);
    setIsVisible(true);
    if (list.length) setPlaylist(list);
    saveState({ episode: ep, currentTime: 0, volume, speed });
  }, [volume, speed]);

  const togglePlay = useCallback(() => {
    if (isPlaying) { audioRef.current.pause(); }
    else { audioRef.current.play().catch(() => {}); }
  }, [isPlaying]);

  const seek = useCallback((time) => {
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  }, []);

  const changeVolume = useCallback((v) => {
    audioRef.current.volume = v;
    setVolume(v);
  }, []);

  const changeSpeed = useCallback((s) => {
    audioRef.current.playbackRate = s;
    setSpeed(s);
  }, []);

  const playNext = useCallback(() => {
    if (!episode || !playlist.length) return;
    const idx = playlist.findIndex(e => e.id === episode.id);
    if (idx < playlist.length - 1) playEpisode(playlist[idx + 1], playlist);
  }, [episode, playlist, playEpisode]);

  const playPrev = useCallback(() => {
    if (!episode || !playlist.length) return;
    const idx = playlist.findIndex(e => e.id === episode.id);
    if (idx > 0) playEpisode(playlist[idx - 1], playlist);
  }, [episode, playlist, playEpisode]);

  const dismiss = useCallback(() => {
    audioRef.current.pause();
    audioRef.current.src = '';
    setIsPlaying(false);
    setIsVisible(false);
    setEpisode(null);
    setIsExpanded(false);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <PlayerContext.Provider value={{
      episode, isPlaying, currentTime, duration, volume, speed, isExpanded, isVisible, playlist,
      playEpisode, togglePlay, seek, changeVolume, changeSpeed, playNext, playPrev,
      setIsExpanded, dismiss, setPlaylist,
    }}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used within PlayerProvider');
  return ctx;
}
