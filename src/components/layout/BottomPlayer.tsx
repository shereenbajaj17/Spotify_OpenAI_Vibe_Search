'use client';

import { usePlayerStore } from '@/store/usePlayerStore';
import { Play, Pause, SkipBack, SkipForward, Volume2, Repeat, Shuffle } from 'lucide-react';
import { useEffect, useRef } from 'react';

export default function BottomPlayer() {
  const { currentTrack, isPlaying, togglePlay, playNext, playPrev, progress, setProgress, volume, setVolume } = usePlayerStore();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(e => console.error("Playback failed (likely no actual audio file found!):", e));
        }
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentTrack]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setProgress(audioRef.current.currentTime);
    }
  };

  const handleAudioEnded = () => {
    playNext();
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !currentTrack) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newTime = percent * currentTrack.duration;
    audioRef.current.currentTime = newTime;
    setProgress(newTime);
  };

  const handleVolumeChange = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setVolume(percent);
    if (audioRef.current) {
      audioRef.current.volume = percent;
    }
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <footer className="h-[90px] w-full bg-black border-t border-[#282828] flex items-center justify-between px-4 pb-2">
      {/* Hidden Audio Element */}
      {currentTrack && (
        <audio 
          autoPlay={isPlaying}
          ref={audioRef} 
          src={currentTrack.audioUrl} 
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleAudioEnded}
          onError={(e) => console.error("Audio file could not be loaded. Ensure the file exists in /public/audio!")}
        />
      )}

      {/* Left Output - Track Info */}
      <div className="w-[30%] min-w-[180px] flex items-center gap-4">
        {currentTrack ? (
          <>
            <div className="relative w-14 h-14 bg-[#282828] rounded-md overflow-hidden flex-shrink-0">
              <img src={currentTrack.albumArt || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&fit=crop'} alt={currentTrack.title} className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col truncate">
              <span className="text-sm font-medium text-white hover:underline cursor-pointer truncate">
                {currentTrack.title}
              </span>
              <span className="text-xs text-spotify-light hover:underline hover:text-white cursor-pointer truncate">
                {currentTrack.artist}
              </span>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-4">
             <div className="w-14 h-14 bg-[#282828] rounded-md flex-shrink-0" />
          </div>
        )}
      </div>

      {/* Center - Controls */}
      <div className="w-[40%] max-w-[722px] flex flex-col items-center justify-center gap-2">
        <div className="flex items-center gap-6">
          <button onClick={playPrev} className="text-spotify-light hover:text-white transition-colors hover:scale-105 active:scale-95">
            <SkipBack className="w-5 h-5 fill-current" />
          </button>
          <button 
            onClick={togglePlay}
            className="w-8 h-8 flex items-center justify-center bg-white rounded-full hover:scale-105 active:scale-95 transition-transform text-black"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5" />
            )}
          </button>
          <button onClick={playNext} className="text-spotify-light hover:text-white transition-colors hover:scale-105 active:scale-95">
            <SkipForward className="w-5 h-5 fill-current" />
          </button>
        </div>
        
        <div className="w-full flex items-center gap-2 text-xs text-spotify-light">
          <span className="min-w-[40px] text-right">{formatTime(progress)}</span>
          <div 
            onClick={handleSeek}
            className="h-1 flex-1 bg-neutral-800 rounded-full group cursor-pointer flex items-center relative overflow-hidden"
          >
            <div 
              className="h-full bg-white group-hover:bg-spotify-green transition-colors absolute left-0 top-0" 
              style={{ width: currentTrack ? `${(progress / currentTrack.duration) * 100}%` : '0%' }}
            />
          </div>
          <span className="min-w-[40px] text-left">{currentTrack ? formatTime(currentTrack.duration) : '0:00'}</span>
        </div>
      </div>

      {/* Right - Volume & Extra Controls */}
      <div className="w-[30%] min-w-[180px] flex items-center justify-end gap-2 pr-2">
        <button className="text-spotify-light hover:text-white transition-colors">
          <Volume2 className="w-5 h-5" />
        </button>
        <div 
          onClick={handleVolumeChange}
          className="w-24 h-1 bg-neutral-800 rounded-full group cursor-pointer flex items-center relative overflow-hidden"
        >
          <div 
            className="h-full bg-white group-hover:bg-spotify-green transition-colors absolute left-0 top-0" 
            style={{ width: `${volume * 100}%` }}
          />
        </div>
      </div>
    </footer>
  );
}
