'use client';

import { Play, Pause } from 'lucide-react';
import { usePlayerStore, TrackData } from '@/store/usePlayerStore';

export default function PlayButton({ track, allTracks }: { track: TrackData, allTracks: TrackData[] }) {
  const { currentTrack, isPlaying, playTrack, togglePlay } = usePlayerStore();

  const isCurrentTrack = currentTrack?.id === track.id;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isCurrentTrack) {
      togglePlay();
    } else {
      playTrack(track, allTracks);
    }
  };

  return (
    <button 
      onClick={handleClick}
      className="w-12 h-12 bg-spotify-green rounded-full flex items-center justify-center text-black hover:scale-105 transition-transform shadow-lg"
    >
      {isCurrentTrack && isPlaying ? (
        <Pause className="w-5 h-5 fill-current" />
      ) : (
        <Play className="w-5 h-5 fill-current ml-1" />
      )}
    </button>
  );
}
