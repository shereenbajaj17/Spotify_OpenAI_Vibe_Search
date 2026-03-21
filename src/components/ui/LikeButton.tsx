'use client';

import { Heart } from 'lucide-react';
import { useLibraryStore } from '@/store/useLibraryStore';
import { TrackData } from '@/store/usePlayerStore';

export default function LikeButton({ track }: { track: TrackData }) {
  const { toggleLike, isLiked } = useLibraryStore();
  const liked = isLiked(track.id);

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleLike(track);
      }}
      className={`transition-all hover:scale-110 p-1 ${liked ? 'text-[#1ed760]' : 'text-neutral-400 hover:text-white'}`}
      title={liked ? 'Remove from Liked Songs' : 'Add to Liked Songs'}
    >
      <Heart className={`w-5 h-5 ${liked ? 'fill-[#1ed760]' : ''}`} />
    </button>
  );
}
